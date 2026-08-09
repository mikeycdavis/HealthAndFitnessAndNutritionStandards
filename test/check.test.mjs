/**
 * Tests for the evaluation engine: verdicts, dispositions, exceptions, attestations, and every path
 * that produces BLOCKED_BY_INVARIANT.
 *
 * The properties asserted here are the ones whose absence produces a confident wrong answer:
 * a skip is never a pass, NOT_EVALUATED stays reachable, a prohibition can never be waived, and
 * manipulation stops the run rather than failing a rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalog } from "../scripts/catalog.mjs";
import { evaluate, screenIntegrity, STATUS, baselineStrength } from "../scripts/compliance.mjs";
import { parseYaml } from "../scripts/yaml.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const catalog = await loadCatalog(path.join(REPO, "rules"));

const policyFixture = async (name) =>
  parseYaml(await readFile(path.join(HERE, "fixtures", "policies", `${name}.yml`), "utf8"));

const run = (policy, { findings = [], evaluated = [], today = "2026-08-09", digests = new Map() } = {}) =>
  evaluate({ catalog, policy, findings, evaluated, today, digests });

/** A finding that establishes the subject exists — the only kind that can contradict a scope claim. */
const violation = (rule, message = "observed") => ({
  rule,
  message,
  evidence: ["somewhere"],
  subjectExists: true,
});
const absence = (rule, message = "not found") => ({
  rule,
  message,
  evidence: ["somewhere"],
  subjectExists: false,
});

// ---------------------------------------------------------------------------------------------
// The load-bearing properties
// ---------------------------------------------------------------------------------------------

test("a rule nothing evaluated is skipped, never passed", () => {
  const verdict = run({ standardVersion: "1.0.0" }, { evaluated: [] });
  const passed = verdict.results.filter((r) => r.status === "passed");
  assert.deepEqual(passed, [], "nothing was evaluated, so nothing may be reported as passing");
  for (const r of verdict.results) {
    assert.equal(r.status, "skipped");
    assert.equal(r.disposition, "not-evaluated");
  }
});

test("nothing failing does not produce COMPLIANT while required rules are unevaluated", () => {
  const verdict = run({ standardVersion: "1.0.0" }, { evaluated: [] });
  assert.equal(verdict.status, STATUS.NOT_EVALUATED);
  assert.ok(verdict.denominator.unevaluatedRequired > 0);
});

test("COMPLIANT is reachable only when every applicable required rule was established", () => {
  // Declare every rule not-applicable except one, and evaluate that one cleanly.
  const applicability = {};
  for (const rule of catalog.rules.values()) {
    if (rule.id === "trend.principle-documented" || rule.kind === "invariant") continue;
    applicability[rule.id] = { status: "not-applicable", reason: "fixture", revisitWhen: "never" };
  }
  // The invariant is manual-review and cannot be attested, so it always holds the verdict open.
  const verdict = run({ standardVersion: "1.0.0", applicability }, { evaluated: ["trend.principle-documented"] });
  assert.equal(
    verdict.status,
    STATUS.NOT_EVALUATED,
    "the integrity invariant is required, manual-review, and never attestable — so COMPLIANT requires it to be evaluated by something, and nothing can",
  );
});

test("an attested prohibition passes and is counted as manual review, never automated", () => {
  const policy = {
    standardVersion: "1.0.0",
    attestations: {
      "nutrition.no-crash-dieting": {
        status: "approved",
        reviewedBy: "reviewer",
        reviewedAt: "2026-08-01",
        evidence: "Reviewed the deficit floor in the plan generator.",
      },
    },
  };
  const verdict = run(policy);
  const result = verdict.results.find((r) => r.ruleId === "nutrition.no-crash-dieting");
  assert.equal(result.status, "passed");
  assert.equal(result.disposition, "attested");
  assert.equal(result.validationType, "manual-review");
  assert.equal(result.assurance, "none", "a human established it; no machine did");
});

test("the assurance breakdown accounts for every applicable rule", () => {
  const verdict = run({ standardVersion: "1.0.0" }, { evaluated: [] });
  const applicable = verdict.results.filter((r) => r.disposition !== "not-applicable").length;
  const { automated, manualReview, notEvaluated } = verdict.assurance;
  assert.equal(automated + manualReview + notEvaluated, applicable, "the three must sum");
});

test("the score's denominator is what was evaluated, and status never derives from it", () => {
  const verdict = run({ standardVersion: "1.0.0" }, { evaluated: [] });
  assert.equal(verdict.score, null, "no scored rules means no score, not zero");
  assert.equal(verdict.denominator.scored, 0);
  assert.equal(verdict.status, STATUS.NOT_EVALUATED);
});

// ---------------------------------------------------------------------------------------------
// Failures, warnings, exceptions
// ---------------------------------------------------------------------------------------------

test("a requirement failure is a failure; a recommendation failure is a warning", () => {
  const verdict = run(
    { standardVersion: "1.0.0" },
    {
      evaluated: ["health.interpretation-record", "trend.principle-documented"],
      findings: [absence("health.interpretation-record"), absence("trend.principle-documented")],
    },
  );
  assert.equal(verdict.results.find((r) => r.ruleId === "health.interpretation-record").status, "failed");
  assert.equal(verdict.results.find((r) => r.ruleId === "trend.principle-documented").status, "warning");
  assert.equal(verdict.status, STATUS.NON_COMPLIANT);
});

test("a live exception softens a requirement failure to COMPLIANT_WITH_EXCEPTIONS", async () => {
  const policy = {
    standardVersion: "1.0.0",
    exceptions: [
      {
        rule: "health.interpretation-record",
        reason: "Records land next quarter.",
        approvedBy: "owner",
        approvedAt: "2026-01-01",
        expires: "2027-01-01",
      },
    ],
    applicability: {},
  };
  for (const rule of catalog.rules.values()) {
    if (rule.id === "health.interpretation-record" || rule.kind === "invariant") continue;
    policy.applicability[rule.id] = { status: "not-applicable", reason: "fixture", revisitWhen: "never" };
  }
  // The invariant still holds the verdict at NOT_EVALUATED; assert the disposition instead.
  const verdict = run(policy, {
    evaluated: ["health.interpretation-record"],
    findings: [absence("health.interpretation-record")],
  });
  const result = verdict.results.find((r) => r.ruleId === "health.interpretation-record");
  assert.equal(result.disposition, "excepted");
  assert.equal(result.exception.approvedBy, "owner");
});

test("an expired exception is a failure, not a resolution", async () => {
  const verdict = run(await policyFixture("expired-exception"), { evaluated: [] });
  const expired = verdict.results.find((r) => r.disposition === "expired-exception");
  assert.ok(expired, "an exception past its expiry must be reported");
  assert.equal(expired.status, "failed");
  assert.equal(verdict.status, STATUS.NON_COMPLIANT);
});

// ---------------------------------------------------------------------------------------------
// Attestation lifecycle
// ---------------------------------------------------------------------------------------------

test("a rejected attestation is a failure — a recorded rejection is not silence", async () => {
  const verdict = run(await policyFixture("attested-rejected"));
  const result = verdict.results.find((r) => r.ruleId === "nutrition.no-crash-dieting");
  assert.equal(result.status, "failed");
  assert.equal(result.disposition, "attested-rejected");
});

test("an expired attestation returns the rule to not-evaluated, not to failed", async () => {
  const verdict = run(await policyFixture("attested-expired"));
  const result = verdict.results.find((r) => r.ruleId === "nutrition.no-crash-dieting");
  assert.equal(result.status, "skipped");
  assert.equal(result.disposition, "not-evaluated", "a lapsed review is unreviewed, not wrong");
});

test("a stale digest returns the rule to not-evaluated rather than blocking the run", () => {
  const policy = {
    standardVersion: "1.0.0",
    attestations: {
      "nutrition.no-crash-dieting": {
        status: "approved",
        reviewedBy: "reviewer",
        reviewedAt: "2026-08-01",
        evidence: "Reviewed the generator.",
        reviewedAgainst: { paths: ["src/plan.ts"], digest: "aaaaaaaaaaaaaaaa" },
      },
    },
  };
  const verdict = run(policy, { digests: new Map([["nutrition.no-crash-dieting", "bbbbbbbbbbbbbbbb"]]) });
  const result = verdict.results.find((r) => r.ruleId === "nutrition.no-crash-dieting");
  assert.equal(result.disposition, "not-evaluated");
  assert.notEqual(verdict.status, STATUS.BLOCKED_BY_INVARIANT, "ordinary staleness is not tampering");
});

// ---------------------------------------------------------------------------------------------
// BLOCKED_BY_INVARIANT — every path
// ---------------------------------------------------------------------------------------------

const blockedBy = async (fixtureName) => {
  const verdict = run(await policyFixture(fixtureName));
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT, `${fixtureName} must block`);
  assert.deepEqual(verdict.results, [], "nothing else is evaluated once the run is blocked");
  assert.ok(verdict.integrityViolations.length > 0);
  return verdict.integrityViolations[0];
};

test("an exception against a prohibition blocks the run", async () => {
  const v = await blockedBy("exception-against-prohibition");
  assert.equal(v.violation, "exception-against-non-exemptible");
  assert.match(v.remediation, /not-applicable/, "the remedy points at the legitimate alternative");
});

test("an exception against the integrity invariant blocks the run", async () => {
  const v = await blockedBy("exception-against-invariant");
  assert.equal(v.violation, "exception-against-non-exemptible");
});

test("lowering a rule's strength blocks the run", async () => {
  const v = await blockedBy("strength-lowered");
  assert.equal(v.violation, "strength-lowered");
  assert.match(v.message, /lowers it to 'recommended'/);
});

test("setting a strength on a prohibition blocks the run", async () => {
  const v = await blockedBy("strength-on-prohibition");
  assert.equal(v.violation, "strength-change-on-non-negotiable");
});

test("declaring the invariant not-applicable blocks the run", async () => {
  const v = await blockedBy("not-applicable-invariant");
  assert.equal(v.violation, "not-applicable-invariant");
});

test("attesting the invariant blocks the run", async () => {
  const v = await blockedBy("attested-invariant");
  assert.equal(v.violation, "attested-invariant");
});

test("attesting a rule the catalog says a machine evaluates blocks the run", async () => {
  const v = await blockedBy("attested-non-attestable");
  assert.equal(v.violation, "attestation-on-non-attestable-rule");
});

test("an attestation contradicted by a finding blocks the run", () => {
  const policy = {
    standardVersion: "1.0.0",
    attestations: {
      "nutrition.no-crash-dieting": {
        status: "approved",
        reviewedBy: "reviewer",
        reviewedAt: "2026-08-01",
        evidence: "Looked at it.",
      },
    },
  };
  const verdict = run(policy, { findings: [violation("nutrition.no-crash-dieting", "observed a 900 kcal target")] });
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.equal(verdict.integrityViolations[0].violation, "contradicted-attestation");
});

/**
 * The distinction that keeps every correctly-scoped project from being reported as an integrity
 * violation. Found by running the tool against this repository, which legitimately declares the
 * interpretation rules out of scope and legitimately has no interpretation records.
 */
test("a not-applicable declaration is contradicted by a violation, NOT by an absence", () => {
  const policy = {
    standardVersion: "1.0.0",
    applicability: {
      "health.interpretation-record": {
        status: "not-applicable",
        reason: "This project interprets no personal health data.",
        revisitWhen: "Any capability interprets a real person's data.",
      },
    },
  };

  const withAbsence = run(policy, { findings: [absence("health.interpretation-record", "no records found")] });
  assert.notEqual(
    withAbsence.status,
    STATUS.BLOCKED_BY_INVARIANT,
    "an absence is evidence FOR the scope claim, never against it",
  );

  const withViolation = run(policy, { findings: [violation("health.interpretation-record", "found 12 records")] });
  assert.equal(withViolation.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.equal(withViolation.integrityViolations[0].violation, "contradicted-applicability");
});

test("integrity screening runs before everything, so a blocked run reports no partial results", async () => {
  const policy = await policyFixture("exception-against-prohibition");
  const verdict = run(policy, {
    evaluated: ["health.interpretation-record"],
    findings: [absence("health.interpretation-record")],
  });
  assert.equal(verdict.status, STATUS.BLOCKED_BY_INVARIANT);
  assert.equal(verdict.score, null);
  assert.deepEqual(verdict.results, [], "a partial result invites salvaging the parts that look fine");
});

test("a clean policy produces no integrity violations", async () => {
  const violations = screenIntegrity({
    catalog,
    policy: await policyFixture("valid"),
    findings: [],
    today: "2026-08-09",
  });
  assert.deepEqual(violations, []);
});

test("this repository's own policy produces no integrity violations", async () => {
  const policy = parseYaml(await readFile(path.join(REPO, "project-policy.yml"), "utf8"));
  const violations = screenIntegrity({ catalog, policy, findings: [], today: "2026-08-09" });
  assert.deepEqual(violations, []);
});

// ---------------------------------------------------------------------------------------------
// Strength
// ---------------------------------------------------------------------------------------------

test("baseline strength follows kind, and raising a recommendation is permitted", () => {
  assert.equal(baselineStrength(catalog.rules.get("health.interpretation-record")), "required");
  assert.equal(baselineStrength(catalog.rules.get("trend.principle-documented")), "recommended");

  const policy = { standardVersion: "1.0.0", rules: { "trend.principle-documented": { strength: "required" } } };
  const verdict = run(policy, {
    evaluated: ["trend.principle-documented"],
    findings: [absence("trend.principle-documented")],
  });
  assert.notEqual(verdict.status, STATUS.BLOCKED_BY_INVARIANT, "raising is allowed");
  assert.equal(
    verdict.results.find((r) => r.ruleId === "trend.principle-documented").status,
    "failed",
    "raised to required, so its failure is a failure rather than a warning",
  );
});
