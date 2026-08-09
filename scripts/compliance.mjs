/**
 * The evaluation engine: catalog + policy + observed findings → a verdict.
 *
 *   findings + applicability + exceptions + attestations + assurance
 *       → COMPLIANT | COMPLIANT_WITH_EXCEPTIONS | NON_COMPLIANT | NOT_EVALUATED
 *       | BLOCKED_BY_INVARIANT
 *
 * Four properties are load-bearing. Each exists because its absence produces a confident wrong
 * answer, which in this domain is worse than no answer at all.
 *
 *   1. STATUS IS COMPUTED FROM RULES, NEVER FROM THE SCORE. There is no percentage at which
 *      compliance is granted or withdrawn. The score is a summary statistic that ships beside the
 *      verdict.
 *
 *   2. A RULE NOTHING EVALUATED IS SKIPPED, NEVER PASSED. "No automated check complained" is not
 *      evidence that health guidance never gives false reassurance. Unknown is not a pass, and
 *      NOT_EVALUATED must remain reachable — the system is never forced to a positive conclusion.
 *
 *   3. THE SCORE'S DENOMINATOR IS WHAT WAS ACTUALLY EVALUATED, and the assurance breakdown ships
 *      with it so the number cannot imply coverage it does not have.
 *
 *   4. MANIPULATION IS NOT A COMPLIANCE FAILURE. Waiving a prohibition, lowering a rule's strength,
 *      or attesting past a finding are attacks on the evaluation itself, not poor results within
 *      it. They stop the run (ADR 0003). NON_COMPLIANT invites you to fix the failing rule;
 *      BLOCKED_BY_INVARIANT tells you the inputs are not trustworthy, which is a different
 *      instruction to a different person.
 */

import { resolve, isExemptible, mayBeNotApplicable } from "./catalog.mjs";

export const STATUS = {
  COMPLIANT: "COMPLIANT",
  COMPLIANT_WITH_EXCEPTIONS: "COMPLIANT_WITH_EXCEPTIONS",
  NON_COMPLIANT: "NON_COMPLIANT",
  NOT_EVALUATED: "NOT_EVALUATED",
  BLOCKED_BY_INVARIANT: "BLOCKED_BY_INVARIANT",
};

const RESULT = { passed: "passed", failed: "failed", warning: "warning", skipped: "skipped" };

/**
 * How strongly a project holds a rule. A policy may RAISE a recommendation to required; it may
 * never lower anything. Lowering a rule's strength and writing no exception produces the same
 * outcome as a waiver with none of the visibility, which is the manipulation Standard 42 names.
 */
export const STRENGTHS = { recommended: 1, required: 2 };

/** The strength a rule carries before any policy says anything. */
export function baselineStrength(rule) {
  return rule.kind === "recommendation" ? "recommended" : "required";
}

/**
 * Screen for attacks on the evaluation itself, before any rule is evaluated.
 *
 * Returns a list of violations; a non-empty list means the run is blocked. Each violation names the
 * rule, what was attempted, and what to do instead — because the remedy for an integrity violation
 * is usually "declare this honestly", not "delete the line".
 *
 * WHAT IS DELIBERATELY NOT HERE: a stale attestation digest. When the reviewed files change, the
 * attestation stops being current — that is ordinary staleness, the mechanism working as designed,
 * and it returns the rule to not-evaluated. Treating it as tampering would fire every time someone
 * edited a reviewed file, and a guard that cries wolf is a guard people learn to route around. This
 * repository's own subject matter says the same thing: these rules must not create alarmism.
 */
export function screenIntegrity({ catalog, policy, findings, today }) {
  const violations = [];
  if (!policy) return violations;

  const add = (ruleId, kind, message, remediation) =>
    violations.push({ ruleId, violation: kind, message, remediation });

  const findingsByRule = new Map();
  for (const finding of findings ?? []) {
    if (!finding.rule) continue;
    const rule = resolve(catalog, finding.rule);
    if (!rule) continue;
    if (!findingsByRule.has(rule.id)) findingsByRule.set(rule.id, []);
    findingsByRule.get(rule.id).push(finding);
  }

  // 1. An exception against a rule that admits none.
  for (const entry of Array.isArray(policy.exceptions) ? policy.exceptions : []) {
    const rule = resolve(catalog, entry.rule);
    if (!rule || isExemptible(rule)) continue;
    add(
      rule.id,
      "exception-against-non-exemptible",
      `${rule.id} is a ${rule.kind} and admits no exception. An exception was written against it anyway.`,
      rule.kind === "invariant"
        ? "Remove the exception. The integrity invariant is not waivable by anyone, for any reason."
        : "Remove the exception. If the prohibited behavior genuinely cannot occur in this project, declare the rule not-applicable with a reason saying so — that is a different claim, and a legitimate one.",
    );
  }

  // 2. A policy lowering a rule's strength, or setting one on a rule that has no strength to set.
  for (const [ruleId, setting] of Object.entries(policy.rules ?? {})) {
    const rule = resolve(catalog, ruleId);
    if (!rule || !setting?.strength) continue;
    if (rule.kind === "prohibition" || rule.kind === "invariant") {
      add(
        rule.id,
        "strength-change-on-non-negotiable",
        `${rule.id} is a ${rule.kind}. Its strength is not a project setting, and the policy attempts to set it to '${setting.strength}'.`,
        "Remove the strength declaration. A prohibition is held at one strength everywhere: never.",
      );
      continue;
    }
    const baseline = baselineStrength(rule);
    if ((STRENGTHS[setting.strength] ?? 0) < STRENGTHS[baseline]) {
      add(
        rule.id,
        "strength-lowered",
        `${rule.id} is a ${rule.kind} (${baseline}); the policy lowers it to '${setting.strength}'.`,
        "Raise it back. A project that cannot meet a rule writes a time-bounded exception, which is visible and expires — lowering the strength achieves the same relief silently.",
      );
    }
  }

  for (const [ruleId, declaration] of Object.entries(policy.applicability ?? {})) {
    const rule = resolve(catalog, ruleId);
    if (!rule || declaration?.status !== "not-applicable") continue;

    // 3. The invariant is never out of scope. "This project is exempt from integrity" is not a
    //    scope claim about a project; it is a claim about what rules are for.
    if (!mayBeNotApplicable(rule)) {
      add(
        rule.id,
        "not-applicable-invariant",
        `${rule.id} is an invariant and is declared not-applicable.`,
        "Remove the declaration. The integrity invariant binds every project that adopts these standards, including this one.",
      );
      continue;
    }

    // 4. A not-applicable declaration contradicted by evidence. The project says the behavior
    //    cannot occur here; a check observed it occurring. This is the one form of false
    //    not-applicable a machine can catch, and it is worth catching precisely because
    //    not-applicable is the only door left open on a prohibition.
    const hits = findingsByRule.get(rule.id) ?? [];
    if (hits.length > 0) {
      add(
        rule.id,
        "contradicted-applicability",
        `${rule.id} is declared not-applicable — the subject supposedly does not exist here — but a check observed it: ${hits[0].message}`,
        "Withdraw the not-applicable declaration and address the finding. A scope claim contradicted by evidence is not a scope claim.",
      );
    }
  }

  // 5. An attestation asserting what a check contradicts, or standing in for a rule no human is
  //    entitled to sign off. Both are the "falsify evidence for" clause of the invariant.
  for (const [ruleId, attestation] of Object.entries(policy.attestations ?? {})) {
    const rule = resolve(catalog, ruleId);
    if (!rule || !attestation) continue;

    if (rule.kind === "invariant") {
      add(
        rule.id,
        "attested-invariant",
        `${rule.id} is an invariant and carries an attestation.`,
        "Remove it. An attestation that we are not manipulating standards is self-certification of the thing under suspicion (ADR 0003).",
      );
      continue;
    }
    if (!rule.attestable) {
      add(
        rule.id,
        "attestation-on-non-attestable-rule",
        `${rule.id} is not attestable; the catalog says it is evaluated by ${rule.validationType}, not by human review.`,
        "Remove the attestation and let the check evaluate the rule.",
      );
      continue;
    }
    const hits = findingsByRule.get(rule.id) ?? [];
    if (attestation.status === "approved" && hits.length > 0) {
      add(
        rule.id,
        "contradicted-attestation",
        `${rule.id} is attested as satisfied, but a check observed: ${hits[0].message}`,
        "Fix the finding, then re-attest. An attestation records human evidence; it never overrules what a check observed.",
      );
    }
    if (attestation.expires && attestation.reviewedAt && attestation.expires < attestation.reviewedAt) {
      add(
        rule.id,
        "attestation-expired-before-review",
        `${rule.id} carries an attestation that expired (${attestation.expires}) before it was reviewed (${attestation.reviewedAt}).`,
        "Correct the dates. An attestation that was never valid is not evidence.",
      );
    }
  }

  return violations;
}

/**
 * @param catalog   from loadCatalog()
 * @param policy    a validated project-policy document, or null when the project declares none
 * @param findings  evaluator findings, each optionally carrying `rule` (a canonical id)
 * @param evaluated the set of rule ids the evaluator actually examined — the crucial input. A rule
 *                  absent from this set was not checked, and reporting it as passing because
 *                  nothing failed is the false green this whole system exists to prevent.
 * @param today     ISO date, for expiry
 * @param digests   Map<ruleId, currentDigest> for attestation staleness
 */
export function evaluate({ catalog, policy, findings, evaluated, today, digests }) {
  const integrityViolations = screenIntegrity({ catalog, policy, findings, today });
  if (integrityViolations.length > 0) {
    return {
      status: STATUS.BLOCKED_BY_INVARIANT,
      score: null,
      summary: { passed: 0, failed: 0, warnings: 0, skipped: 0 },
      assurance: { automated: 0, manualReview: 0, notEvaluated: 0 },
      denominator: { total: 0, applicable: 0, scored: 0, basis: "not evaluated — the run was blocked" },
      integrityViolations,
      results: [],
    };
  }

  const declaredRules = policy?.rules ?? {};
  const applicability = policy?.applicability ?? {};
  const exceptions = Array.isArray(policy?.exceptions) ? policy.exceptions : [];
  const attestations = policy?.attestations ?? {};
  const examined = new Set(evaluated ?? []);
  const currentDigests = digests ?? new Map();

  const byRule = new Map();
  for (const finding of findings) {
    if (!finding.rule) continue;
    const rule = resolve(catalog, finding.rule);
    if (!rule) continue;
    if (!byRule.has(rule.id)) byRule.set(rule.id, []);
    byRule.get(rule.id).push(finding);
  }

  // Exceptions against non-exemptible rules never reach here — screenIntegrity blocked the run.
  const activeExceptions = new Map();
  const expiredExceptions = [];
  for (const entry of exceptions) {
    const rule = resolve(catalog, entry.rule);
    if (!rule) continue;
    if (entry.expires && entry.expires < today) expiredExceptions.push({ ...entry, rule: rule.id });
    else activeExceptions.set(rule.id, entry);
  }

  const results = [];
  for (const rule of catalog.rules.values()) {
    const strength = declaredRules[rule.id]?.strength ?? baselineStrength(rule);
    const applies = applicability[rule.id];

    // Not applicable: the rule's subject does not exist here. Visible and reasoned, never a silent
    // exclusion. For a prohibition this is the only door open, so the reason carries real weight —
    // it must say the behavior CANNOT OCCUR here, not that it is wanted. A machine cannot judge
    // that; it can only ensure the claim is written down, surfaced, and contradicted when evidence
    // says otherwise (screenIntegrity, case 4).
    if (applies?.status === "not-applicable") {
      const r = base(rule, strength, RESULT.skipped, "not-applicable", applies.reason);
      r.revisitWhen = applies.revisitWhen ?? null;
      r.reviewedAt = applies.reviewedAt ?? null;
      results.push(r);
      continue;
    }

    // A recorded human judgement. Checked before not-evaluated, because an attestation is precisely
    // what turns "nobody looked" into "somebody looked" — but it can never outrank a finding, and
    // screenIntegrity has already blocked the case where it tries.
    const attestation = attestations[rule.id];
    if (attestation) {
      const verdict = judgeAttestation(rule, attestation, today, currentDigests);
      if (verdict) {
        results.push(verdict);
        continue;
      }
      // Falls through to not-evaluated: the attestation did not establish the rule (expired, stale,
      // or recorded as rejected). Silently ignoring it would be worse than falling through.
    }

    // A manual-review rule is never established by an automated run. Without a valid attestation it
    // is not-evaluated even when the evaluator examined it and found nothing, because "no automated
    // finding" is not evidence for a rule whose evaluator is a human. Every prohibition lands here,
    // and that is the honest answer rather than a convenient one.
    if (rule.validationType === "manual-review" || !examined.has(rule.id)) {
      results.push(
        base(
          rule,
          strength,
          RESULT.skipped,
          "not-evaluated",
          rule.validationType === "manual-review"
            ? `${rule.id} is evaluated by human review; no attestation records that review.`
            : `No implemented check evaluates ${rule.id}.`,
        ),
      );
      continue;
    }

    const hits = byRule.get(rule.id) ?? [];
    if (hits.length === 0) {
      results.push(base(rule, strength, RESULT.passed, "evaluated", `No violation of ${rule.id} was observed.`));
      continue;
    }

    const exception = activeExceptions.get(rule.id);
    const outcome = strength === "required" ? RESULT.failed : RESULT.warning;
    const result = base(rule, strength, outcome, exception ? "excepted" : "evaluated", hits[0].message);
    result.evidence = hits.flatMap((h) => h.evidence ?? []);
    if (exception) {
      result.exception = {
        reason: exception.reason,
        approvedBy: exception.approvedBy,
        approvedAt: exception.approvedAt,
        expires: exception.expires ?? null,
        reference: exception.reference ?? null,
      };
    }
    results.push(result);
  }

  for (const entry of expiredExceptions) {
    results.push({
      ruleId: entry.rule,
      status: RESULT.failed,
      severity: "error",
      strength: "required",
      kind: "requirement",
      validationType: "document",
      assurance: "partial",
      disposition: "expired-exception",
      message: `The exception for ${entry.rule} expired on ${entry.expires}.`,
      evidence: ["project-policy.yml"],
      remediation: "Renew the exception with a fresh approval, or satisfy the rule.",
    });
  }

  return summarise(results, policy);
}

/**
 * Decide what an attestation establishes. Returns a result, or null to fall through to normal
 * evaluation — never a silent success.
 *
 * The contradiction and non-attestable cases are handled earlier by screenIntegrity, which blocks
 * the run rather than recording a failure. What remains here are the honest outcomes: a recorded
 * rejection is a failure; an expired or stale attestation returns the rule to not-evaluated.
 */
function judgeAttestation(rule, attestation, today, digests) {
  if (attestation.status === "rejected") {
    return {
      ruleId: rule.id,
      status: RESULT.failed,
      severity: rule.severity,
      strength: "required",
      kind: rule.kind,
      validationType: "manual-review",
      assurance: "none",
      disposition: "attested-rejected",
      message: `${rule.id} was reviewed by ${attestation.reviewedBy} on ${attestation.reviewedAt} and found unmet.`,
      evidence: attestation.reviewedAgainst?.paths ?? ["project-policy.yml"],
      remediation: "Satisfy the rule, then re-attest. A recorded rejection is a failure, not silence.",
    };
  }

  // Expired: not a failure — it is unreviewed again. The distinction matters, because a lapsed
  // review is a prompt to look, whereas a failure is a claim that something is wrong.
  if (attestation.expires && attestation.expires < today) return null;

  // Stale: what was reviewed is not what is there now. Same reasoning as expiry.
  const against = attestation.reviewedAgainst;
  if (against?.digest) {
    const current = digests.get(rule.id);
    if (current && current !== against.digest) return null;
  }

  return {
    ruleId: rule.id,
    status: RESULT.passed,
    severity: rule.severity,
    strength: "required",
    kind: rule.kind,
    validationType: "manual-review",
    // Human judgement establishes the rule, and does so without a machine. It is counted under
    // manualReview in the assurance breakdown — never under automated.
    assurance: "none",
    disposition: "attested",
    message: `Attested by ${attestation.reviewedBy} on ${attestation.reviewedAt}: ${attestation.evidence}`,
    evidence: against?.paths ?? [],
    remediation: rule.remediation,
    attestation: {
      reviewedBy: attestation.reviewedBy,
      reviewedAt: attestation.reviewedAt,
      evidence: attestation.evidence,
      reference: attestation.reference ?? null,
      expires: attestation.expires ?? null,
    },
  };
}

function base(rule, strength, status, disposition, message) {
  return {
    ruleId: rule.id,
    status,
    severity: rule.severity,
    strength,
    kind: rule.kind,
    validationType: rule.validationType,
    assurance: status === RESULT.skipped ? "none" : rule.assurance,
    disposition,
    message,
    evidence: [],
    remediation: rule.remediation,
  };
}

function summarise(results, policy) {
  const counts = { passed: 0, failed: 0, warnings: 0, skipped: 0 };
  for (const r of results) {
    if (r.status === RESULT.passed) counts.passed++;
    else if (r.status === RESULT.failed) counts.failed++;
    else if (r.status === RESULT.warning) counts.warnings++;
    else counts.skipped++;
  }

  // Assurance accounts for every applicable rule, and the three MUST sum to that number. An
  // attested rule counts as manualReview, never automated: a human established it.
  const assurance = { automated: 0, manualReview: 0, notEvaluated: 0 };
  for (const r of results) {
    if (r.disposition === "not-applicable") continue;
    if (r.status === RESULT.skipped) assurance.notEvaluated++;
    else if (r.validationType === "manual-review") assurance.manualReview++;
    else assurance.automated++;
  }

  const applicable = results.filter((r) => r.disposition !== "not-applicable");
  const scored = applicable.filter((r) => r.status !== RESULT.skipped && r.strength === "required");
  const scoredPassed = scored.filter((r) => r.status === RESULT.passed).length;
  const score = scored.length === 0 ? null : Math.round((scoredPassed / scored.length) * 100);

  const failures = results.filter((r) => r.status === RESULT.failed && r.disposition !== "excepted");
  const excepted = results.filter((r) => r.disposition === "excepted");

  // Rules that apply, are held at required strength, and that nothing established either way.
  // These are the reason COMPLIANT is not reachable by default in this domain: 34 of the 59 rules
  // are prohibitions no machine evaluates, so a project that has recorded no human review has not
  // demonstrated compliance — it has demonstrated that nobody looked.
  const unevaluated = results.filter(
    (r) => r.disposition === "not-evaluated" && r.strength === "required",
  );

  let status;
  if (!policy) status = STATUS.NOT_EVALUATED;
  else if (failures.length > 0) status = STATUS.NON_COMPLIANT;
  // Ordered AFTER failures on purpose: a project with both a real failure and missing evidence
  // should be told about the failure, which is actionable now. Ordered BEFORE compliance because
  // "nothing failed" is not evidence that anything passed.
  else if (unevaluated.length > 0) status = STATUS.NOT_EVALUATED;
  else if (excepted.length > 0) status = STATUS.COMPLIANT_WITH_EXCEPTIONS;
  else status = STATUS.COMPLIANT;

  return {
    status,
    score,
    summary: counts,
    assurance,
    denominator: {
      total: results.length,
      applicable: applicable.length,
      scored: scored.length,
      unevaluatedRequired: unevaluated.length,
      basis: "rules held at required strength that were actually evaluated",
    },
    integrityViolations: [],
    results,
  };
}

/** The output envelope. `schemaVersion` versions this format, independently of the others. */
export function envelope({ verdict, project, standardVersion, auditedAt, frameworkCoverage }) {
  return {
    schemaVersion: "1.0",
    standardVersion: standardVersion ?? null,
    project: project ?? null,
    status: verdict.status,
    score: verdict.score,
    summary: verdict.summary,
    assurance: verdict.assurance,
    denominator: verdict.denominator,
    integrityViolations: verdict.integrityViolations ?? [],
    // Framework maturity, sitting outside the verdict on purpose. It says how much of the framework
    // can be evaluated by machine at all — never how compliant this project is.
    frameworkCoverage: frameworkCoverage ?? null,
    auditedAt,
    results: verdict.results,
  };
}
