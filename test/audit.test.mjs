/**
 * Tests for the detectors and the audit command.
 *
 * These run the real CLI as a subprocess and assert on its --json output, so they exercise argument
 * parsing, scanning, and serialization rather than internal functions.
 *
 * EVERY DETECTOR IS ASSERTED TWICE: once on a fixture that must provoke it, and once on a fixture
 * that must not. The second assertion is the one that matters. A suite that only checks detectors
 * fire will pass while a detector fires on everything, and a detector that fires on a correctly
 * scoped project is worse than no detector — it teaches people to ignore the tool.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCHEMA_VERSION } from "../scripts/compliance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "..", "scripts", "standards.mjs");
const REPO = path.join(HERE, "..");
const fixture = (name) => path.join(HERE, "fixtures", name);

function audit(dir, extra = []) {
  const r = spawnSync(process.execPath, [CLI, "audit", `--dir=${dir}`, "--json", ...extra], {
    encoding: "utf8",
  });
  assert.equal(r.error, undefined, `spawn failed: ${r.error}`);
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    assert.fail(`stdout was not JSON.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  }
  return { code: r.status, json, stderr: r.stderr };
}

const rulesFired = (res) => new Set(res.json.findings.map((f) => f.rule).filter(Boolean));
const idsFired = (res) => new Set(res.json.findings.map((f) => f.id));

// ---------------------------------------------------------------------------------------------
// Fire / do-not-fire pairs, one per detector
// ---------------------------------------------------------------------------------------------

const COMPLIANT = fixture("compliant-adopter");
const MISSING = fixture("missing-sections");
const NAMING = fixture("naming-only");

test("the compliant fixture provokes nothing at all", () => {
  const res = audit(COMPLIANT);
  assert.deepEqual(
    res.json.findings.map((f) => `${f.rule}: ${f.message}`),
    [],
    "a correctly built project must produce no findings",
  );
});

test("D1 interpretation records — fires when absent, silent when present", () => {
  assert.ok(rulesFired(audit(NAMING)).has("health.interpretation-record"), "must fire: no records");
  assert.ok(!rulesFired(audit(COMPLIANT)).has("health.interpretation-record"), "must not fire: records present");
});

test("D2 interpretation sections — each fires independently, none on a complete record", () => {
  const fired = rulesFired(audit(MISSING));
  for (const rule of [
    "health.measurement-quality-recorded",
    "health.uncertainty-recorded",
    "health.modifiers-recorded",
  ]) {
    assert.ok(fired.has(rule), `must fire on the incomplete record: ${rule}`);
  }
  const clean = rulesFired(audit(COMPLIANT));
  for (const rule of [
    "health.symptom-context-recorded",
    "health.measurement-quality-recorded",
    "health.baseline-recorded",
    "health.uncertainty-recorded",
    "health.modifiers-recorded",
  ]) {
    assert.ok(!clean.has(rule), `must not fire on a complete record: ${rule}`);
  }
});

test("D2 distinguishes an empty section from a missing one", () => {
  const res = audit(MISSING);
  const empty = res.json.findings.find((f) => f.message.includes("empty '## Measurement Quality'"));
  const absent = res.json.findings.find((f) => f.message.includes("no '## Uncertainty'"));
  assert.ok(empty, "an empty section must be reported as empty");
  assert.ok(absent, "a missing section must be reported as missing");
});

test("D3 escalation tier — fires on zero or two labels, silent on exactly one", () => {
  const res = audit(MISSING);
  const finding = res.json.findings.find((f) => f.id === "escalation-tier-not-exactly-one");
  assert.ok(finding, "must fire when a record names two tiers");
  assert.match(finding.message, /names 2 escalation tiers/);
  assert.ok(
    !idsFired(audit(COMPLIANT)).has("escalation-tier-not-exactly-one"),
    "must not fire when exactly one tier is named",
  );
});

test("D4 tier model — fires on a document that discusses tiers without naming them (use/mention)", () => {
  const res = audit(NAMING);
  const finding = res.json.findings.find((f) => f.rule === "escalation.tier-model-documented");
  assert.ok(finding, "must fire: the document talks about escalation without defining the four tiers");
  assert.match(finding.message, /does not name/);
  assert.ok(
    !rulesFired(audit(COMPLIANT)).has("escalation.tier-model-documented"),
    "must not fire when all four tiers are named",
  );
});

test("D5 scope disclosure — fires when absent, silent when present", () => {
  assert.ok(rulesFired(audit(MISSING)).has("escalation.scope-disclosed"), "must fire: no disclosure");
  assert.ok(!rulesFired(audit(COMPLIANT)).has("escalation.scope-disclosed"), "must not fire: disclosure present");
});

test("D6 trend principle — fires when absent, silent when stated", () => {
  assert.ok(rulesFired(audit(MISSING)).has("trend.principle-documented"), "must fire: principle not stated");
  assert.ok(!rulesFired(audit(COMPLIANT)).has("trend.principle-documented"), "must not fire: principle stated");
});

test("D7 fitness plan sections — each fires independently, none on a complete plan", () => {
  const fired = rulesFired(audit(MISSING));
  for (const rule of [
    "fitness.progression-recorded",
    "fitness.recovery-planned",
    "fitness.pain-response-protocol",
    "fitness.review-cadence-defined",
  ]) {
    assert.ok(fired.has(rule), `must fire on the incomplete plan: ${rule}`);
  }
  const clean = rulesFired(audit(COMPLIANT));
  for (const rule of [
    "fitness.plan-documented",
    "fitness.baseline-recorded",
    "fitness.progression-recorded",
    "fitness.recovery-planned",
    "fitness.pain-response-protocol",
    "fitness.review-cadence-defined",
  ]) {
    assert.ok(!clean.has(rule), `must not fire on a complete plan: ${rule}`);
  }
});

test("D8 nutrition plan — sections, named targets, and provenance all fire; none on a complete plan", () => {
  const res = audit(MISSING);
  const fired = rulesFired(res);
  for (const rule of [
    "nutrition.adequacy-considered",
    "nutrition.restrictions-recorded",
    "nutrition.targets-recorded",
    "nutrition.value-provenance",
  ]) {
    assert.ok(fired.has(rule), `must fire on the incomplete plan: ${rule}`);
  }
  const targets = res.json.findings.find((f) => f.id === "nutrition-targets-incomplete");
  assert.match(targets.message, /protein/, "must name which targets are missing");
  assert.match(targets.message, /fiber/);

  const clean = rulesFired(audit(COMPLIANT));
  for (const rule of [
    "nutrition.plan-documented",
    "nutrition.targets-recorded",
    "nutrition.adequacy-considered",
    "nutrition.restrictions-recorded",
    "nutrition.value-provenance",
  ]) {
    assert.ok(!clean.has(rule), `must not fire on a complete plan: ${rule}`);
  }
});

// ---------------------------------------------------------------------------------------------
// The finding contract
// ---------------------------------------------------------------------------------------------

test("every finding carries the full schema, including subjectExists", () => {
  const required = ["id", "category", "severity", "label", "evidence", "message", "standardRef", "rule", "subjectExists"];
  for (const name of ["compliant-adopter", "missing-sections", "naming-only"]) {
    const res = audit(fixture(name));
    // Asserted against the constant, not a literal: this envelope carries the contract's version,
    // and pinning a spelling here is how the version stops moving when the contract does.
    assert.equal(res.json.schemaVersion, SCHEMA_VERSION);
    assert.match(res.json.auditedAt, /^\d{4}-\d\d-\d\dT.*Z$/);
    for (const f of res.json.findings) {
      for (const key of required) assert.ok(key in f, `${name}: finding ${f.id} lacks ${key}`);
      assert.ok(["error", "warning", "info"].includes(f.severity), `${name}: bad severity ${f.severity}`);
      assert.ok(["OBSERVED", "INFERRED", "CONFIRMED_BY_OWNER", "UNKNOWN"].includes(f.label));
      assert.ok(Array.isArray(f.evidence));
      assert.equal(typeof f.subjectExists, "boolean", `${f.id} must declare subjectExists`);
    }
  }
});

/**
 * The distinction that keeps correctly-scoped projects from being reported as integrity violations.
 * An absence finding is consistent with — indeed evidence for — a not-applicable declaration; only a
 * finding that presupposes the artifact exists can contradict one.
 */
test("absence findings declare subjectExists false; findings about an existing artifact declare true", () => {
  const res = audit(MISSING);
  const byId = new Map(res.json.findings.map((f) => [f.id, f]));

  assert.equal(byId.get("no-escalation-tier-doc").subjectExists, false, "a missing document is an absence");
  assert.equal(byId.get("no-scope-disclosure").subjectExists, false);
  assert.equal(byId.get("no-trend-principle").subjectExists, false);

  assert.equal(byId.get("nutrition-targets-incomplete").subjectExists, true, "the plan exists, so the subject does");
  assert.equal(byId.get("escalation-tier-not-exactly-one").subjectExists, true);
  assert.equal(
    res.json.findings.find((f) => f.message.includes("'## Progression'")).subjectExists,
    true,
  );

  const naming = audit(NAMING);
  assert.equal(
    naming.json.findings.find((f) => f.id === "no-interpretation-records").subjectExists,
    false,
    "no records found is an absence, not evidence the project interprets health data",
  );
});

test("every standardRef points at a standards file that exists and an anchor that resolves", async () => {
  const { readFile } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");
  const refs = new Set();
  for (const name of ["compliant-adopter", "missing-sections", "naming-only"]) {
    for (const f of audit(fixture(name)).json.findings) refs.add(f.standardRef);
  }
  assert.ok(refs.size > 0, "the fixtures must produce findings to check");

  for (const ref of refs) {
    const [file, anchor] = ref.split("#");
    const full = path.join(REPO, file);
    assert.ok(existsSync(full), `standardRef points at a missing file: ${file}`);
    if (!anchor) continue;
    const text = await readFile(full, "utf8");
    // GitHub's slugger replaces each whitespace character individually rather than collapsing
    // runs, so "R1 — Every ..." (em-dash removed, its two surrounding spaces kept) becomes
    // "r1--every-...". Collapsing with \s+ here would produce a single hyphen and quietly disagree
    // with every anchor that actually works in a browser.
    const slugs = [...text.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) =>
      m[1]
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s/g, "-"),
    );
    assert.ok(slugs.includes(anchor), `anchor '${anchor}' does not resolve in ${file}`);
  }
});

// ---------------------------------------------------------------------------------------------
// Invocation contract
// ---------------------------------------------------------------------------------------------

test("bad invocations exit 2, not 1", () => {
  const run = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
  assert.equal(run([]).status, 2, "no subcommand");
  assert.equal(run(["frobnicate"]).status, 2, "unknown subcommand");
  assert.equal(run(["audit", "--dir=" + path.join(HERE, "no-such-dir")]).status, 2, "missing directory");
  assert.equal(run(["--help"]).status, 0, "--help is a successful invocation");
});

test("audit exits 0 without --strict and 1 with it when findings exist", () => {
  assert.equal(audit(MISSING).code, 0, "audit reports; it does not gate");
  assert.equal(audit(MISSING, ["--strict"]).code, 1, "--strict gates on non-info findings");
  assert.equal(audit(COMPLIANT, ["--strict"]).code, 0, "--strict passes when there is nothing to report");
});

test("audit output says it is evidence rather than a verdict", () => {
  const r = spawnSync(process.execPath, [CLI, "audit", `--dir=${COMPLIANT}`], { encoding: "utf8" });
  assert.match(r.stdout, /evidence, not a verdict/);
});

// ---------------------------------------------------------------------------------------------
// This repository holds itself to the standards it publishes
// ---------------------------------------------------------------------------------------------

/**
 * Asserted against `check`, not `audit`, and the difference is the point.
 *
 * `audit` reads no policy, so it reports that this repository has no interpretation records, no
 * fitness plan, and no nutrition plan — all true, and all irrelevant, because this repository
 * publishes standards rather than producing guidance and has declared those rules not-applicable
 * with reasons. Asserting on audit would force this repository either to fabricate a fitness plan
 * for a person who does not exist, or to weaken the test. Both are worse than asking the right
 * question.
 *
 * The right question is whether any rule that APPLIES here is failing, which is what the evaluation
 * answers. It is reached through `maintain` rather than `check`: this repository is not an adopter of
 * itself, and since the second stage-3 review `check` refuses to answer for it at all rather than
 * producing a verdict that reads like an adoption. The rules run identically; only what the result is
 * entitled to be called differs.
 */
test("this repository has no failing rules under its own policy", () => {
  const r = spawnSync(process.execPath, [CLI, "maintain", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  const result = JSON.parse(r.stdout);
  assert.deepEqual(
    result.results.filter((x) => x.status === "failed").map((x) => `${x.ruleId}: ${x.message}`),
    [],
    "the standards repository must satisfy the standards it publishes",
  );
  assert.equal(result.status, "SELF_MAINTENANCE", "the top-level status is never a compliance verdict here");
  assert.equal(
    result.workingTreeStatus,
    "COMPLIANT",
    "four human attestations are recorded — see project-policy.yml",
  );
  assert.equal(r.status, 0, "a satisfied working tree exits 0 — this repository's own green");

  // The shape of the state, not only its verdict. This survived a false green once: at ad6bdcb four
  // attestations were recorded, every gate stayed green, and the per-rule states matched the frozen
  // prediction exactly — while the reviewedBy identity rested on a draft rather than on the person
  // named. No test can detect that; provenance is not a property any of them can read. What these
  // assertions do is make the *set* of established rules explicit, so that a rule quietly moving
  // into or out of it is visible in a diff rather than absorbed into a verdict.
  const by = (s) => result.results.filter((x) => x.disposition === s).map((x) => x.ruleId).sort();
  assert.deepEqual(by("attested"), [
    "escalation.tier-language-calibrated",
    "health.no-fabricated-medical-facts",
    "nutrition.no-single-food-disease-claims",
    "trend.trends-over-events",
  ], "exactly the four rules a human decided; see artifacts/release-review/attestation-2026-08-11.md");
  assert.deepEqual(by("not-evaluated"), [
    "health.evidence-quality-noted",
  ], "a recommendation with no evidence, which COMPLIANT does not require and does not hide");
  assert.deepEqual(by("screened"), ["integrity.no-standards-manipulation"]);
});

test("this repository's audit findings are all absences, never violations", () => {
  const res = audit(REPO);
  const violations = res.json.findings.filter((f) => f.subjectExists === true);
  assert.deepEqual(
    violations.map((f) => f.message),
    [],
    "a finding about an artifact that exists here would contradict this repository's own scope declarations",
  );
});
