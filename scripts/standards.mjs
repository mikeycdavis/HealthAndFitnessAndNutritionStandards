#!/usr/bin/env node
/**
 * standards — audit, check, explain, status, and init for a project adopting these standards.
 *
 * SIX COMMANDS, chosen for the loop an operator actually works in:
 *
 *   init     bootstrap a project        (writes; dry-run derives from the same plan)
 *   audit    gather evidence            (no policy needed; never a verdict)
 *   check    reach a verdict            (the CI gate, for a project adopting the standards)
 *   maintain the pack's own gate        (this repository only; never reports COMPLIANT)
 *   explain  why a rule applies here    (and what evidence would satisfy it)
 *   status   what has gone stale        (expired, stale, due for revisit, missing)
 *
 * `audit` and `check` are separate because they answer different questions and have different
 * exit-code contracts (ADR 0005). A clean audit means nothing matched the checks that exist; it
 * does not mean the guidance is safe.
 *
 * WHAT THE DETECTORS CAN CLAIM. Every detector in this file establishes that an artifact or a
 * section EXISTS. None establishes that its content is correct, and every rule they bind to carries
 * `assurance: "partial"` and an $assuranceNote saying so. The 34 prohibitions have no detector at
 * all and report not-evaluated unless a human review is recorded. That is the honest position for
 * this domain: a confident green on unsafe health guidance is worse than no answer, and a detector
 * that read a `## Measurement Quality` heading and reported the measurement-quality analysis as
 * sound would produce exactly that.
 *
 * The integrity invariant is the one exception, and not a detector: it is screened by
 * `screenIntegrity` in compliance.mjs and reports `screened` when every bound check ran and none
 * fired (ADR 0007). Screened is not passed.
 *
 * EXIT CODES (see docs/design/architecture.md):
 *   check:  0 compliant · 1 non-compliant · 2 config error · 3 blocked by invariant · 4 not evaluated
 *           · 5 release identity not established
 *   audit:  0 completed · 1 --strict and something non-info found · 2 invocation error
 *   init:   0 completed · 1 conflicts, nothing written · 2 could not run
 *   others: 0 fine · 2 invocation error
 *
 * 5 IS ITS OWN CODE RATHER THAN A CONFIG ERROR (FE-13). "You invoked this wrongly" and "the pack
 * running cannot prove it is the release you asked for" are different events with different remedies,
 * and folding the second into the second-most-ignored exit code would make the system's most
 * important refusal indistinguishable from a typo.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadCatalog, resolve as resolveRule, assertBindings, coverage } from "./catalog.mjs";
import { evaluate, envelope, SCHEMA_VERSION, STATUS, baselineStrength, INVARIANT_SCREENS, SCREENED_MEANING } from "./compliance.mjs";
import { parseYaml, YamlError } from "./yaml.mjs";
import { validate, assertSchemaSupported, SchemaError } from "./jsonschema.mjs";
import { plan as initPlan, apply as initApply, detectMode, render as initRender } from "./init.mjs";
import { resolveRelease, gitIn } from "./release-identity.mjs";
import { materialise } from "./release-material.mjs";
import { verifyRelease } from "./release-verify.mjs";
import { packLineage } from "./pack-lineage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXIT = {
  OK: 0,
  FINDINGS: 1,
  INVOCATION: 2,
  BLOCKED: 3,
  NOT_EVALUATED: 4,
  UNIDENTIFIED_RELEASE: 5,
  // `check` refused because this is the pack maintaining itself, which is not an adoption and has no
  // compliance verdict to give. Distinct from 5: there is nothing wrong here and nothing to obtain --
  // the caller asked the wrong command. `standards maintain` is the right one, and its success is 0
  // under a status that is not a compliance word, so no exit code means both things at once.
  SELF_MAINTENANCE: 6,
};

/** Directories never scanned. `fixtures` is here so deliberately broken test data cannot indict the tool. */
const SKIP_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", "coverage", ".next", ".nuxt",
  ".venv", "venv", "__pycache__", "target", "vendor", ".turbo", ".idea", ".vs", ".vscode",
  "fixtures",
]);

const MAX_FILES = 20000;
const MAX_READ_BYTES = 400_000;
const MAX_EVIDENCE = 12;

/**
 * The rules a detector in this file actually examines. Anything in the catalog and not in this list
 * reports skipped/not-evaluated — never passed. This list and the detectors are asserted to agree in
 * the test suite, so a detector cannot quietly start or stop covering a rule.
 */
export const EVALUATED_RULES = [
  "escalation.scope-disclosed",
  "escalation.tier-model-documented",
  "trend.principle-documented",
  "health.interpretation-record",
  "health.symptom-context-recorded",
  "health.measurement-quality-recorded",
  "health.baseline-recorded",
  "health.uncertainty-recorded",
  "health.escalation-tier-assigned",
  "health.modifiers-recorded",
  "fitness.plan-documented",
  "fitness.baseline-recorded",
  "fitness.progression-recorded",
  "fitness.recovery-planned",
  "fitness.pain-response-protocol",
  "fitness.review-cadence-defined",
  "nutrition.plan-documented",
  "nutrition.targets-recorded",
  "nutrition.adequacy-considered",
  "nutrition.restrictions-recorded",
  "nutrition.value-provenance",
];

/** The four canonical escalation tier labels (Standard 3 R1). */
export const TIER_LABELS = [
  "normal variation",
  "worth monitoring",
  "worth discussing with a professional",
  "potentially urgent",
];

/** Where the domain artifacts live in an adopting project. */
const PATHS = {
  interpretations: "artifacts/interpretations",
  fitnessPlan: "artifacts/fitness-plan.md",
  nutritionPlan: "artifacts/nutrition-plan.md",
  tierDoc: "docs/escalation-tiers.md",
};

// ---------------------------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------------------------

async function collectFiles(root) {
  const out = [];
  const walk = async (dir) => {
    if (out.length >= MAX_FILES) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= MAX_FILES) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(full);
      } else if (/\.(md|markdown|txt|ya?ml|json)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  };
  await walk(root);
  return out;
}

async function readCapped(file) {
  try {
    const info = await stat(file);
    if (info.size > MAX_READ_BYTES) return null;
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

/**
 * Extract the body of a `## Heading` section. Returns null when the heading is absent, and the
 * trimmed body when present — so an empty section is distinguishable from a missing one, which is
 * the distinction every section rule turns on.
 */
export function sectionBody(text, heading) {
  const pattern = new RegExp(`^#{2,3}\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im");
  const match = pattern.exec(text);
  if (!match) return null;
  const rest = text.slice(match.index + match[0].length);
  const next = /^#{1,3}\s+\S/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

/** Strip HTML comments, so a heading mentioned in a template's explanatory comment does not count. */
const stripComments = (text) => text.replace(/<!--[\s\S]*?-->/g, "");

// ---------------------------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------------------------

/**
 * Every finding declares `subjectExists`: whether it establishes that the rule's subject is present
 * in this project.
 *
 *   false — the finding reports an ABSENCE ("no fitness plan at ..."). Consistent with, and indeed
 *           evidence for, a not-applicable declaration.
 *   true  — the finding presupposes the artifact exists ("this plan has no Progression section"),
 *           so the subject demonstrably IS here.
 *
 * Only the second kind can contradict a not-applicable declaration (compliance.mjs, screenIntegrity
 * case 4). Without the distinction, every correctly-scoped project would be reported as committing
 * an integrity violation, because a nutrition-only project legitimately has no fitness plan.
 */
function makeFinder() {
  const findings = [];
  const add = ({ id, category, severity, label, evidence, message, standardRef, rule, remediation, subjectExists }) => {
    if (typeof subjectExists !== "boolean") {
      throw new Error(`detector '${id}' must declare subjectExists — see makeFinder()`);
    }
    findings.push({
      id,
      category,
      severity,
      label,
      evidence: (evidence ?? []).slice(0, MAX_EVIDENCE),
      message,
      standardRef,
      rule: rule ?? null,
      remediation: remediation ?? null,
      subjectExists,
    });
  };
  return { findings, add };
}

/**
 * Required sections per artifact. The headings are the ones the templates define, so the templates
 * and the detectors share one vocabulary — a test asserts they still agree.
 */
const INTERPRETATION_SECTIONS = [
  { heading: "Context", rule: "health.symptom-context-recorded", standard: "04-symptom-context.md" },
  { heading: "Measurement Quality", rule: "health.measurement-quality-recorded", standard: "06-measurement-quality.md" },
  { heading: "Baseline", rule: "health.baseline-recorded", standard: "07-individual-baseline.md" },
  { heading: "Uncertainty", rule: "health.uncertainty-recorded", standard: "11-uncertainty.md" },
  { heading: "Medications and Contextual Factors", rule: "health.modifiers-recorded", standard: "09-medications-where-relevant.md" },
  { heading: "Escalation Tier", rule: "health.escalation-tier-assigned", standard: "13-appropriate-escalation.md" },
];

const FITNESS_SECTIONS = [
  { heading: "Goals", rule: "fitness.plan-documented", standard: "16-goals.md" },
  { heading: "Baseline", rule: "fitness.baseline-recorded", standard: "17-baseline-fitness.md" },
  { heading: "Progression", rule: "fitness.progression-recorded", standard: "18-progressive-overload.md" },
  { heading: "Recovery and Rest", rule: "fitness.recovery-planned", standard: "20-recovery.md" },
  { heading: "Pain and Injury Response", rule: "fitness.pain-response-protocol", standard: "24-pain-injury-signals.md" },
  { heading: "Review Cadence", rule: "fitness.review-cadence-defined", standard: "31-trend-based-progress.md" },
];

const NUTRITION_SECTIONS = [
  { heading: "Targets", rule: "nutrition.targets-recorded", standard: "32-energy-balance.md" },
  { heading: "Adequacy", rule: "nutrition.adequacy-considered", standard: "36-micronutrient-adequacy.md" },
  { heading: "Restrictions and Context", rule: "nutrition.restrictions-recorded", standard: "41-dietary-restrictions-and-context.md" },
];

export async function runDetectors(root) {
  const { findings, add } = makeFinder();
  const files = await collectFiles(root);
  const rel = (p) => path.relative(root, p).replace(/\\/g, "/");
  const contents = new Map();
  for (const file of files) {
    const text = await readCapped(file);
    if (text !== null) contents.set(rel(file), stripComments(text));
  }
  const read = (p) => contents.get(p) ?? null;

  // D1 — interpretation records exist.
  const interpretationFiles = [...contents.keys()]
    .filter((p) => p.startsWith(PATHS.interpretations + "/") && p.endsWith(".md"))
    .sort();

  if (interpretationFiles.length === 0) {
    add({
      id: "no-interpretation-records",
      category: "health",
      severity: "error",
      label: "OBSERVED",
      evidence: [PATHS.interpretations + "/"],
      message: `No interpretation records found under ${PATHS.interpretations}/.`,
      standardRef: "standards/15-limits-of-interpretation.md#r5--interpretation-is-recorded-so-it-can-be-revisited",
      rule: "health.interpretation-record",
      remediation: "Record interpretations using templates/interpretation-record.md, or declare the rule not-applicable if this project interprets no personal health data.",
      subjectExists: false,
    });
  }

  // D2/D3 — required sections in each record, and exactly one canonical tier label.
  for (const file of interpretationFiles) {
    const text = read(file);
    for (const section of INTERPRETATION_SECTIONS) {
      const body = sectionBody(text, section.heading);
      if (body === null || body === "") {
        add({
          id: `interpretation-section-${section.heading.toLowerCase().replace(/\s+/g, "-")}`,
          category: "health",
          severity: section.rule === "health.modifiers-recorded" ? "warning" : "error",
          label: "OBSERVED",
          evidence: [file],
          message: `${file} has ${body === null ? "no" : "an empty"} '## ${section.heading}' section.`,
          standardRef: `standards/${section.standard}`,
          rule: section.rule,
          remediation: `Add a non-empty '## ${section.heading}' section, per templates/interpretation-record.md.`,
          subjectExists: true,
        });
      }
    }

    // D3 — exactly one tier. Two labels means the tier was not decided, which is the failure
    // Standard 13 R1 names; the detector reports it as such rather than accepting the first match.
    const tierBody = sectionBody(text, "Escalation Tier");
    if (tierBody) {
      const matched = TIER_LABELS.filter((label) => tierBody.toLowerCase().includes(label));
      if (matched.length !== 1) {
        add({
          id: "escalation-tier-not-exactly-one",
          category: "health",
          severity: "error",
          label: "OBSERVED",
          evidence: [file],
          message:
            matched.length === 0
              ? `${file} assigns no canonical escalation tier.`
              : `${file} names ${matched.length} escalation tiers (${matched.join("; ")}); exactly one is required.`,
          standardRef: "standards/13-appropriate-escalation.md#r1--every-interpretation-carries-exactly-one-tier-explicitly",
          rule: "health.escalation-tier-assigned",
          remediation: `Name exactly one of: ${TIER_LABELS.join(" / ")}.`,
          subjectExists: true,
        });
      }
    }
  }

  // D4 — the tier model is documented, naming all four tiers.
  const tierDoc = read(PATHS.tierDoc);
  if (!tierDoc) {
    add({
      id: "no-escalation-tier-doc",
      category: "escalation",
      severity: "error",
      label: "OBSERVED",
      evidence: [PATHS.tierDoc],
      message: `No escalation tier model at ${PATHS.tierDoc}.`,
      standardRef: "standards/03-safety-and-escalation-tiers.md#r6--the-tier-model-is-documented",
      rule: "escalation.tier-model-documented",
      remediation: "Document the four tiers. docs/escalation-tiers.md in this repository may be copied.",
      subjectExists: false,
    });
  } else {
    const missing = TIER_LABELS.filter((label) => !tierDoc.toLowerCase().includes(label));
    if (missing.length > 0) {
      add({
        id: "escalation-tier-doc-incomplete",
        category: "escalation",
        severity: "error",
        label: "OBSERVED",
        evidence: [PATHS.tierDoc],
        message: `${PATHS.tierDoc} does not name: ${missing.join("; ")}.`,
        standardRef: "standards/03-safety-and-escalation-tiers.md#r1--the-four-tiers",
        rule: "escalation.tier-model-documented",
        remediation: `Name all four tiers: ${TIER_LABELS.join(" / ")}.`,
          subjectExists: true,
      });
    }
  }

  // D5 — a wellness-scope disclosure appears somewhere a reader would meet it.
  const SCOPE_SIGNALS = [/not\s+(a\s+substitute\s+for\s+)?medical\s+advice/i, /general\s+wellness/i, /does\s+not\s+diagnose/i, /not\s+medical\s+assessment/i];
  const scopeCandidates = ["README.md", "readme.md", "PROJECT.md", ...[...contents.keys()].filter((p) => p.startsWith("templates/") || p.startsWith("docs/"))];
  const scopeFound = scopeCandidates.some((p) => {
    const text = read(p);
    return text && SCOPE_SIGNALS.some((re) => re.test(text));
  });
  if (!scopeFound) {
    add({
      id: "no-scope-disclosure",
      category: "escalation",
      severity: "error",
      label: "OBSERVED",
      evidence: ["README.md"],
      message: "No wellness-scope disclosure found in the README, manifest, docs, or guidance templates.",
      standardRef: "standards/01-wellness-vs-medical-assessment.md#r2--scope-is-disclosed-where-the-guidance-is-delivered",
      rule: "escalation.scope-disclosed",
      remediation: "State plainly that this produces general wellness guidance rather than medical assessment, where a reader will encounter the guidance.",
      subjectExists: false,
    });
  }

  // D6 — the trend-over-event principle is stated somewhere.
  const TREND_SIGNAL = /individual\s+observations\s+inform\s+decisions|trends\s+establish\s+patterns/i;
  const trendFound = [...contents.values()].some((text) => TREND_SIGNAL.test(text));
  if (!trendFound) {
    add({
      id: "no-trend-principle",
      category: "trend",
      severity: "warning",
      label: "OBSERVED",
      evidence: ["docs/"],
      message: "The trend-over-event principle is not stated in the documentation or templates.",
      standardRef: "standards/02-trend-over-event.md#r6--the-principle-is-written-down",
      rule: "trend.principle-documented",
      remediation: 'State it: "Individual observations inform decisions; trends establish patterns."',
      subjectExists: false,
    });
  }

  // D7 — the fitness plan and its sections.
  const fitnessPlan = read(PATHS.fitnessPlan);
  if (!fitnessPlan) {
    add({
      id: "no-fitness-plan",
      category: "fitness",
      severity: "error",
      label: "OBSERVED",
      evidence: [PATHS.fitnessPlan],
      message: `No fitness plan at ${PATHS.fitnessPlan}.`,
      standardRef: "standards/16-goals.md#r1--the-goal-is-stated-and-it-is-the-plans-first-content",
      rule: "fitness.plan-documented",
      remediation: "Write the plan using templates/fitness-plan.md, or declare the fitness rules not-applicable if this project plans no training.",
      subjectExists: false,
    });
  } else {
    for (const section of FITNESS_SECTIONS) {
      const body = sectionBody(fitnessPlan, section.heading);
      if (body === null || body === "") {
        add({
          id: `fitness-section-${section.heading.toLowerCase().replace(/\s+/g, "-")}`,
          category: "fitness",
          severity: ["fitness.pain-response-protocol", "fitness.review-cadence-defined"].includes(section.rule) ? "warning" : "error",
          label: "OBSERVED",
          evidence: [PATHS.fitnessPlan],
          message: `${PATHS.fitnessPlan} has ${body === null ? "no" : "an empty"} '## ${section.heading}' section.`,
          standardRef: `standards/${section.standard}`,
          rule: section.rule,
          remediation: `Add a non-empty '## ${section.heading}' section, per templates/fitness-plan.md.`,
          subjectExists: true,
        });
      }
    }
  }

  // D8 — the nutrition plan, its sections, its three named targets, and value provenance.
  const nutritionPlan = read(PATHS.nutritionPlan);
  if (!nutritionPlan) {
    add({
      id: "no-nutrition-plan",
      category: "nutrition",
      severity: "error",
      label: "OBSERVED",
      evidence: [PATHS.nutritionPlan],
      message: `No nutrition plan at ${PATHS.nutritionPlan}.`,
      standardRef: "standards/32-energy-balance.md#r6--energy-balance-is-not-the-whole-of-a-plan",
      rule: "nutrition.plan-documented",
      remediation: "Write the plan using templates/nutrition-plan.md, or declare the nutrition rules not-applicable if this project plans no diet.",
      subjectExists: false,
    });
  } else {
    for (const section of NUTRITION_SECTIONS) {
      const body = sectionBody(nutritionPlan, section.heading);
      if (body === null || body === "") {
        add({
          id: `nutrition-section-${section.heading.toLowerCase().replace(/\s+/g, "-")}`,
          category: "nutrition",
          severity: section.rule === "nutrition.adequacy-considered" ? "warning" : "error",
          label: "OBSERVED",
          evidence: [PATHS.nutritionPlan],
          message: `${PATHS.nutritionPlan} has ${body === null ? "no" : "an empty"} '## ${section.heading}' section.`,
          standardRef: `standards/${section.standard}`,
          rule: section.rule,
          remediation: `Add a non-empty '## ${section.heading}' section, per templates/nutrition-plan.md.`,
          subjectExists: true,
        });
      }
    }

    const targets = sectionBody(nutritionPlan, "Targets");
    if (targets) {
      const required = ["energy", "protein", "fiber"];
      const missing = required.filter((t) => !new RegExp(t === "fiber" ? "fibre|fiber" : t, "i").test(targets));
      if (missing.length > 0) {
        add({
          id: "nutrition-targets-incomplete",
          category: "nutrition",
          severity: "error",
          label: "OBSERVED",
          evidence: [PATHS.nutritionPlan],
          message: `The Targets section does not name: ${missing.join(", ")}.`,
          standardRef: "standards/32-energy-balance.md#r6--energy-balance-is-not-the-whole-of-a-plan",
          rule: "nutrition.targets-recorded",
          remediation: "State energy, protein, and fiber targets with the basis for each.",
          subjectExists: true,
        });
      }

      // Provenance: a heuristic, and reported as one. It looks for numeric values carrying no
      // (measured)/(estimated)/(unknown) marker. It can miss unmarked values elsewhere and cannot
      // judge whether a label is honest, which is why the rule it binds to is a recommendation.
      const numbers = [...targets.matchAll(/^[^\n]*?\b\d[\d,.]*\s*(kcal|cal|g|mg|kJ)\b[^\n]*$/gim)].map((m) => m[0].trim());
      const unmarked = numbers.filter((line) => !/\((measured|estimated|unknown)\)/i.test(line));
      if (numbers.length > 0 && unmarked.length > 0) {
        add({
          id: "nutrition-values-without-provenance",
          category: "nutrition",
          severity: "warning",
          label: "INFERRED",
          evidence: unmarked.slice(0, MAX_EVIDENCE),
          message: `${unmarked.length} numeric value(s) in the Targets section carry no provenance marker.`,
          standardRef: "standards/32-energy-balance.md#r3--values-carry-their-provenance",
          rule: "nutrition.value-provenance",
          remediation: "Mark values (measured), (estimated), or (unknown). This scan is heuristic; its findings are advisory.",
          subjectExists: true,
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------------------------
// Policy loading and attestation digests
// ---------------------------------------------------------------------------------------------

/**
 * READING THE REQUEST, WHICH IS NOT THE SAME ACT AS JUDGING IT.
 *
 * This reads the adopter's policy far enough to learn which release they are asking to be evaluated
 * against, and no further. It does not consult `schemas/project-policy.schema.json`.
 *
 * WHY THE SPLIT EXISTS. That schema is pack material — it is in `MATERIAL`, its bytes are part of
 * what release verification proves. Validating the whole policy through it first meant an unverified
 * pack could reject a perfectly valid adopter policy as a configuration error, the adopter's fault,
 * before anything had established that the schema making the judgement belonged to the release the
 * adopter actually asked for. Independent review named it: unverified pack material influencing the
 * evaluation before identity is established, which is the class of defect FE-13 exists to remove,
 * arriving one step earlier in the sequence than the place it was removed.
 *
 * WHAT IS CHECKED HERE, AND WHY IT IS NOT THE SAME PROBLEM. Only the fields this stage consumes, and
 * only as shapes: a request that cannot be read is the adopter's own document being unreadable, and
 * saying so is not the pack asserting authority over the adopter's contract. `standardVersion` in
 * particular has to be legible before identity can be established at all — you cannot verify which
 * release was requested without reading the request.
 *
 * THE LIMIT, STATED RATHER THAN IMPLIED. The evaluator running these lines is itself pack material,
 * and no ordering of this file changes that; `scripts/release-material.mjs` records the same limit
 * for the same reason. What the split buys is narrower and real: the pack's *declarative contract*,
 * the part that can reject an adopter for reasons having nothing to do with identity, no longer runs
 * before identity is established.
 */
async function readPolicyRequest(root) {
  const policyPath = path.join(root, "project-policy.yml");
  if (!existsSync(policyPath)) {
    return { error: "no project-policy.yml — a verdict requires a policy declaring what applies here" };
  }
  let policy;
  try {
    policy = parseYaml(await readFile(policyPath, "utf8"));
  } catch (error) {
    if (error instanceof YamlError) return { error: `project-policy.yml: ${error.message}` };
    throw error;
  }
  if (policy === null || typeof policy !== "object" || Array.isArray(policy)) {
    return { error: "project-policy.yml: expected a mapping at the top level" };
  }
  for (const field of ["standardVersion", "project", "packSelfMaintenance"]) {
    if (field in policy && typeof policy[field] !== "string") {
      return { error: `project-policy.yml: ${field} must be a string` };
    }
  }
  if (typeof policy.standardVersion !== "string") {
    return { error: "project-policy.yml: standardVersion is required — it names the release to evaluate against" };
  }
  return { policy };
}

/**
 * The complete contract, applied through the pack's schema. Callers that produce a verdict must not
 * reach this until release identity is established, so that the schema doing the judging is material
 * whose identity has been proven. Returns an error string, or null when the policy is well-formed.
 */
async function validatePolicyContract(policy) {
  const schema = JSON.parse(await readFile(path.join(ROOT, "schemas/project-policy.schema.json"), "utf8"));
  try {
    assertSchemaSupported(schema);
  } catch (error) {
    if (error instanceof SchemaError) return error.message;
    throw error;
  }
  const errors = validate(policy, schema);
  if (errors.length > 0) {
    return `project-policy.yml does not match the schema:\n${errors.map((e) => `  ${e.path || "(root)"}: ${e.message}`).join("\n")}`;
  }
  return null;
}

/**
 * Read and validate in one step, for the commands that reach no verdict. `explain` and `status`
 * report on a policy rather than adjudicating a project against a release, so there is no identity
 * for them to establish first and nothing for the ordering above to protect.
 */
async function loadPolicy(root) {
  const loaded = await readPolicyRequest(root);
  if (loaded.error) return loaded;
  const invalid = await validatePolicyContract(loaded.policy);
  return invalid ? { error: invalid } : { policy: loaded.policy };
}

/** Content digest over the paths an attestation says were reviewed. */
async function attestationDigests(root, policy) {
  const digests = new Map();
  for (const [ruleId, attestation] of Object.entries(policy?.attestations ?? {})) {
    const paths = attestation?.reviewedAgainst?.paths;
    if (!Array.isArray(paths) || paths.length === 0) continue;
    const hash = createHash("sha256");
    for (const rel of [...paths].sort()) {
      const full = path.join(root, rel);
      hash.update(rel);
      // A missing reviewed path is itself a change worth digesting: if a file the reviewer examined
      // has since been deleted, the attestation should go stale rather than silently still match.
      hash.update(existsSync(full) ? await readFile(full, "utf8") : "<file absent at digest time>");
    }
    digests.set(ruleId, hash.digest("hex").slice(0, 32));
  }
  return digests;
}

const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

async function commandAudit(root, { json, strict }) {
  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const findings = await runDetectors(root);
  assertBindings(catalog, findings.map((f) => f.rule).filter(Boolean));

  const payload = {
    schemaVersion: SCHEMA_VERSION,
    auditedAt: new Date().toISOString(),
    root: path.resolve(root),
    findings,
    note: "This is evidence, not a verdict. Run `standards check` for a compliance status.",
  };

  if (json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } else {
    const bySeverity = { error: 0, warning: 0, info: 0 };
    for (const f of findings) bySeverity[f.severity]++;
    const out = [`Findings: ${findings.length}  (${bySeverity.error} error, ${bySeverity.warning} warning, ${bySeverity.info} info)`, ""];
    for (const f of findings) {
      out.push(`${f.severity === "error" ? "!" : "?"} [${f.rule ?? f.category}] ${f.message}`);
      if (f.evidence.length) out.push(`    evidence: ${f.evidence.join(", ")}`);
      if (f.remediation) out.push(`    ${f.remediation}`);
      out.push("");
    }
    out.push(`Coverage: ${EVALUATED_RULES.length} of ${catalog.rules.size} rules have an implemented check.`);
    out.push("The rest — every prohibition, and the integrity invariant — are evaluated by human review.");
    out.push("");
    out.push("This is evidence, not a verdict. Run `standards check` for a compliance status.");
    process.stdout.write(out.join("\n") + "\n");
  }

  const actionable = findings.filter((f) => f.severity !== "info");
  return strict && actionable.length > 0 ? EXIT.FINDINGS : EXIT.OK;
}

// ---------------------------------------------------------------------------------------------
// Release identity (FE-13)
// ---------------------------------------------------------------------------------------------

/**
 * Establish that the pack producing this verdict is the immutable release the adopter asked for.
 *
 * Three stages, kept in three files, called in order here and nowhere else:
 *
 *   resolveRelease   what immutable object does the requested version designate?
 *   materialise      what bytes are we about to evaluate?
 *   verifyRelease    are those bytes exactly that object?
 *
 * IDENTITY COMES BEFORE RULES, and the ordering is the whole design. A run that evaluated first and
 * appended "by the way, identity was unverified" would be offering a verdict it has no authority to
 * reach; there would be nothing for the caveat to attach to. So this returns before the catalog is
 * loaded, and a refusal carries no compliance result at all.
 *
 * `policy.standardVersion` is the REQUESTED identity throughout. It is what the adopter claims, it is
 * never evidence, and after this function returns the reported version comes from what was verified
 * rather than from what was asked.
 */
const SELF_MAINTENANCE = "self-maintenance";

/**
 * Is this run the pack maintaining itself, and if it claims to be, may it?
 *
 * THREE CONDITIONS, ALL NECESSARY, and the third is the one independent review of PR #2 said was
 * missing. The declaration makes the claim visible in a reviewed file. The root test says the tree
 * being evaluated is the evaluator's own. Neither is authority: the first is a sentence anyone can
 * copy, and the second is satisfied by anyone who copies the evaluator into a directory they control,
 * which is precisely the escape that was found. The third asks Git whether this working tree descends
 * from this pack's certified release, which a copied evaluator does not.
 *
 * Returns a disposition rather than a verdict, because two commands consume it and they want
 * different things from the same answer: `check` refuses when it is eligible, `maintain` proceeds.
 */
async function selfMaintenance(root, policy) {
  const declared = policy.packSelfMaintenance === "this-project-is-the-pack";
  const isRoot = path.resolve(root) === ROOT;
  if (!declared) return { kind: "not-declared", isRoot };

  const identity = (extra) => ({ established: false, mode: SELF_MAINTENANCE, packRoot: ROOT, ...extra });

  if (!isRoot) {
    return {
      kind: "blocked",
      exit: EXIT.BLOCKED,
      releaseIdentity: identity({
        stage: "declaration",
        reason: "not-the-pack",
        detail:
          `this policy declares packSelfMaintenance, which exempts the standards pack from proving it ` +
          `is a release — but ${path.resolve(root)} is not the pack. Claiming to be the thing an ` +
          `exemption was written for is a manipulation of an applicability determination ` +
          `(integrity.no-standards-manipulation, Standard 42), not a configuration mistake.`,
      }),
    };
  }

  let record = null;
  try {
    record = JSON.parse(await readFile(path.join(ROOT, "scripts/certified-releases.json"), "utf8"));
  } catch {
    /* packLineage reports an unreadable record itself; it must not be treated as permission */
  }
  const lineage = packLineage(gitIn(ROOT), record);
  if (lineage.ok === false) {
    return {
      kind: "blocked",
      // Contradicted evidence is an accusation and absent evidence is not. Reporting "no repository
      // here" as a Standard 42 violation would be a false accusation, and a gate that cries
      // manipulation at ordinary conditions is a gate people learn to route around.
      exit: lineage.kind === "contradicted" ? EXIT.BLOCKED : EXIT.UNIDENTIFIED_RELEASE,
      releaseIdentity: identity({ stage: "eligibility", reason: lineage.reason, detail: lineage.detail }),
    };
  }

  const packVersion = (await readFile(path.join(ROOT, "VERSION"), "utf8").catch(() => "")).trim();
  return {
    kind: "eligible",
    packVersion: packVersion || null,
    releaseIdentity: identity({
      packVersion: packVersion || null,
      lineage: lineage.lineage,
      detail:
        "the pack is evaluating itself, so no independent release identity exists to establish. This " +
        "run says whether the working tree satisfies its own standards; it is not an adoption, it " +
        "carries no authority for one, and no compliance verdict is produced from it.",
    }),
  };
}

async function establishRelease(root, policy) {
  const requested = policy.standardVersion;
  const git = gitIn(ROOT);

  const resolved = resolveRelease(requested, git);
  if (resolved.ok === false) {
    return unidentified("resolution", resolved.reason, resolved.detail, requested);
  }

  const material = await materialise(ROOT);
  if (material.ok === false) {
    return unidentified("materialisation", material.reason, material.detail, requested);
  }

  const verified = verifyRelease({ identity: resolved.identity, material: material.material, git });
  if (verified.ok === false) {
    return unidentified("verification", verified.reason, verified.detail, requested, {
      resolvedCommit: resolved.identity.resolvedCommit,
      resolvedTree: resolved.identity.resolvedTree,
      differences: verified.differences ?? [],
      differenceCount: verified.differenceCount ?? 0,
      releaseDigest: verified.releaseDigest ?? null,
      materialDigest: verified.materialDigest ?? null,
    });
  }

  return {
    ok: true,
    // Reported from what was verified, not from what was claimed. That substitution is the entire
    // finding FE-13 was opened for: `standardVersion: policy.standardVersion ?? version` let the
    // adopter's own assertion become the tool's answer.
    standardVersion: requested,
    releaseIdentity: { established: true, ...verified.verification },
  };
}

function unidentified(stage, reason, detail, requested, extra = {}) {
  return {
    ok: false,
    exit: EXIT.UNIDENTIFIED_RELEASE,
    releaseIdentity: {
      established: false,
      stage,
      reason,
      requestedRelease: requested ?? null,
      detail,
      ...extra,
    },
  };
}

/**
 * The refusal document. It is a JSON envelope so that a machine reading `--json` gets an answer
 * rather than a parse error, and it deliberately has no `status`, `score`, or `results`: there is no
 * verdict here to report, and an empty results array beside a compliance-shaped status is exactly the
 * "nothing failed, therefore compliant" reading this repository refuses everywhere else.
 */
function refusalEnvelope({ project, releaseIdentity, auditedAt, status = "UNIDENTIFIED_RELEASE" }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    standardVersion: null,
    project: project ?? null,
    status,
    releaseIdentity,
    auditedAt,
    results: [],
  };
}

function renderRefusal(r) {
  const id = r.releaseIdentity;

  // The pack asking `check` about itself is not a failure of anything. It gets its own rendering so
  // that an operator is not told an identity could not be established when nothing was ever meant to
  // establish one, and so the remedy printed is the command that answers the question.
  if (r.status === "SELF_MAINTENANCE") {
    return [
      "NO VERDICT — SELF-MAINTENANCE",
      "",
      ...wrap(id.detail, 96, ""),
      "",
      "`check` answers one question: does this project comply with a release of these standards that",
      "it can prove it is running? The pack is not an adopter of itself, so there is no such release",
      "and no verdict to give. Run `standards maintain` for the pack's own gate; it reports whether",
      "this working tree satisfies its own standards, and it never reports COMPLIANT.",
      "",
    ].join("\n") + "\n";
  }

  const out = [
    id.reason === "not-the-pack" || id.reason === "lineage-contradicted" || id.reason === "lineage-record-unreadable"
      ? "BLOCKED BY INVARIANT"
      : "RELEASE IDENTITY NOT ESTABLISHED",
    "",
    `Requested release: ${id.requestedRelease ?? "(none declared)"}`,
    `Failed at:         ${id.stage} (${id.reason})`,
    "",
    ...wrap(id.detail, 96, ""),
    "",
  ];

  if (id.differenceCount) {
    out.push(`${id.differenceCount} file(s) of pack material differ; showing ${id.differences.length}:`);
    for (const d of id.differences) out.push(`  ${d.difference}  ${d.path}`);
    out.push("");
  }

  out.push("No verdict was produced. This is not a compliance failure — it is the evaluation refusing");
  out.push("to speak for a release it cannot show it is running. Fixing the rules is not the remedy;");
  out.push("obtaining the release is (INSTRUCTIONS.md, 'Adoption pins an immutable release').");
  return out.join("\n") + "\n";
}

function emitRefusal({ project, releaseIdentity, status, exit, json }) {
  const refusal = refusalEnvelope({
    project: project ?? null,
    releaseIdentity,
    status,
    auditedAt: new Date().toISOString(),
  });
  process.stdout.write(json ? JSON.stringify(refusal, null, 2) + "\n" : renderRefusal(refusal));
  return exit;
}

/**
 * Run the rules. Shared by `check` and `maintain` deliberately: the two commands differ in what they
 * are entitled to conclude, never in how thoroughly they look. A maintenance mode with its own softer
 * evaluation path would be the bypass wearing a second costume.
 */
async function evaluateProject(root, policy) {
  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const findings = await runDetectors(root);
  assertBindings(catalog, findings.map((f) => f.rule).filter(Boolean));

  const verdict = evaluate({
    catalog,
    policy,
    findings,
    evaluated: EVALUATED_RULES,
    today: today(),
    digests: await attestationDigests(root, policy),
  });
  return { verdict, catalog };
}

async function commandCheck(root, { json }) {
  // The request, not the contract. `readPolicyRequest` explains why those are separate acts and why
  // the second one waits until the schema performing it is material whose identity has been proven.
  const loaded = await readPolicyRequest(root);
  if (loaded.error) {
    process.stderr.write(`standards check: ${loaded.error}\n`);
    return EXIT.INVOCATION;
  }

  // SELF-MAINTENANCE IS NOT AN OUTCOME OF THIS COMMAND. It used to be, and that was the second defect
  // independent review found: the mode returned ok, ran the ordinary evaluator, and emitted the
  // ordinary envelope, so it could answer COMPLIANT with exit 0 while `releaseIdentity.established`
  // sat beside it as metadata. A consumer reading the exit code or the status -- the two things every
  // consumer actually reads -- was told an adoption had been verified when none had. Routing the mode
  // out of `check` entirely is what makes COMPLIANT from `check` mean "identity established", with no
  // field anyone has to remember to consult.
  const self = await selfMaintenance(root, loaded.policy);
  if (self.kind === "blocked") {
    return emitRefusal({
      project: loaded.policy.project,
      releaseIdentity: self.releaseIdentity,
      status: self.exit === EXIT.BLOCKED ? "BLOCKED_BY_INVARIANT" : "UNIDENTIFIED_RELEASE",
      exit: self.exit,
      json,
    });
  }
  if (self.kind === "eligible") {
    return emitRefusal({
      project: loaded.policy.project,
      releaseIdentity: self.releaseIdentity,
      status: "SELF_MAINTENANCE",
      exit: EXIT.SELF_MAINTENANCE,
      json,
    });
  }

  // Before the catalog is read, let alone evaluated.
  const release = await establishRelease(root, loaded.policy);
  if (release.ok === false) {
    return emitRefusal({
      project: loaded.policy.project,
      releaseIdentity: release.releaseIdentity,
      status: "UNIDENTIFIED_RELEASE",
      exit: release.exit,
      json,
    });
  }

  // Identity is established, so the schema below is verified material rather than whatever this
  // directory happened to contain. Only now may the pack judge the adopter's policy.
  const invalid = await validatePolicyContract(loaded.policy);
  if (invalid) {
    process.stderr.write(`standards check: ${invalid}\n`);
    return EXIT.INVOCATION;
  }

  const { verdict, catalog } = await evaluateProject(root, loaded.policy);

  const result = envelope({
    verdict,
    project: loaded.policy.project ?? null,
    standardVersion: release.standardVersion,
    releaseIdentity: release.releaseIdentity,
    auditedAt: new Date().toISOString(),
    frameworkCoverage: coverage(catalog, { evaluated: EVALUATED_RULES, totalStandards: 42 }),
  });

  if (json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(renderCheck(result));
  }

  if (verdict.status === STATUS.BLOCKED_BY_INVARIANT) return EXIT.BLOCKED;
  if (verdict.status === STATUS.NON_COMPLIANT) return EXIT.FINDINGS;
  if (verdict.status === STATUS.NOT_EVALUATED) return EXIT.NOT_EVALUATED;
  return EXIT.OK;
}

/**
 * `header: false` is for `maintain`, which has already printed what this run is and what it is not.
 * Reprinting a `Release:` line there would answer a question nobody asked, and reprinting `Status:`
 * would put a compliance word at the top of an output that is deliberately not a compliance verdict.
 */
function renderCheck(r, { header = true } = {}) {
  const out = [];

  if (r.status === STATUS.BLOCKED_BY_INVARIANT) {
    out.push("BLOCKED BY INVARIANT");
    out.push("");
    out.push("Evaluation stopped. The inputs to the verdict have been manipulated, so no verdict is");
    out.push("produced — this is not a compliance failure, and fixing the rules below is not the");
    out.push("remedy (Standard 42).");
    out.push("");
    for (const v of r.integrityViolations) {
      out.push(`! ${v.ruleId} — ${v.violation}`);
      out.push(`    ${v.message}`);
      out.push(`    ${v.remediation}`);
      out.push("");
    }
    return out.join("\n") + "\n";
  }

  // Which bytes produced what follows. Printed first and unconditionally: a reader who has to go
  // looking for the identity of an evaluation will assume it, and assuming it is the defect.
  const id = r.releaseIdentity;
  if (header) {
    if (id?.established) {
      out.push(`Release: ${id.requestedRelease} — MATCH (${id.files} files of pack material)`);
      out.push(`         ${id.resolvedCommit}`);
      out.push(`         ${id.materialDigest}`);
    } else {
      out.push("Release: none established.");
    }
    out.push("");
  }

  const s = r.summary;
  if (header) out.push(`Status: ${r.status}`);
  out.push(`Score:  ${r.score === null ? "n/a" : r.score + "%"}  (rules at required strength that were evaluated: ${r.denominator.scored})`);
  out.push(`Rules:  ${s.passed} passed, ${s.failed} failed, ${s.warnings} warning(s), ${s.skipped} skipped`);
  out.push(`Cover:  ${r.assurance.automated} automated, ${r.assurance.manualReview} manual-review, ${r.assurance.notEvaluated} not-evaluated, ${r.assurance.screened} screened`);
  out.push("");

  // The integrity invariant is reported explicitly rather than folded into the verdict, so that
  // COMPLIANT never quietly stands in for "and Standard 42 is satisfied" — which no run establishes.
  const screened = r.results.filter((x) => x.status === "screened");
  for (const x of screened) {
    out.push(`Integrity: ${x.ruleId} — screened`);
    out.push(`  ${x.checks.length} integrity check(s) ran; none detected a violation.`);
    out.push("  Screened is not passed. Absence of detected manipulation is weak evidence;");
    out.push("  detected manipulation is decisive and would have stopped this run (exit 3).");
    out.push("  No run establishes that no undetectable manipulation occurred.");
    out.push("");
  }
  if (r.integrityScreen && !r.integrityScreen.executed) {
    out.push("Integrity: the screen did not execute, so the invariant is not-evaluated.");
    out.push("");
  }

  const failures = r.results.filter((x) => x.status === "failed");
  const warnings = r.results.filter((x) => x.status === "warning");
  for (const f of [...failures, ...warnings]) {
    out.push(`${f.status === "failed" ? "!" : "?"} ${f.ruleId} — ${f.message}`);
    if (f.remediation) out.push(`    ${f.remediation}`);
    out.push("");
  }

  const notApplicable = r.results.filter((x) => x.disposition === "not-applicable");
  if (notApplicable.length > 0) {
    out.push(`Not applicable (${notApplicable.length}): declared with a reason and a revisit trigger.`);
    out.push("  Run `standards explain <rule>` to see the reasoning for any of them.");
    out.push("");
  }

  const unevaluated = r.results.filter((x) => x.disposition === "not-evaluated");
  if (unevaluated.length > 0) {
    out.push(`Not evaluated (${unevaluated.length}): no implemented check, and no recorded human review.`);
    if (r.status === STATUS.NOT_EVALUATED) {
      out.push("  This is why the status is NOT_EVALUATED rather than COMPLIANT. Nothing failed —");
      out.push("  but nothing failing is not evidence that anything passed, and in this domain most");
      out.push("  rules are prohibitions that only a human can establish.");
      out.push("  Record reviews as attestations in project-policy.yml. See INSTRUCTIONS.md.");
    }
    out.push("");
  }

  const c = r.frameworkCoverage;
  if (c) {
    out.push(`Framework: ${c.cataloguedRules} rules across ${c.standardsWithRules} of ${c.standards} standards;`);
    out.push(`           ${c.evaluatedRules} have an implemented check; ${c.fullyMachineRepresentedStandards} standards are fully machine-represented.`);
    out.push("           Framework maturity, NOT compliance. A verdict says what was checked passed;");
    out.push("           this says how much can be checked at all. Never read them as one number.");
  }

  return out.join("\n") + "\n";
}

/**
 * `standards maintain` -- the pack's own gate, and the only place self-maintenance produces a result.
 *
 * IT IS A SEPARATE COMMAND FOR ONE REASON. Independent review of PR #2 established that a
 * self-maintenance run emitting the ordinary verdict envelope could be consumed as an adoption
 * result: exit 0 and `status: "COMPLIANT"` are what consumers read, and both were reachable. Every
 * softer fix keeps that shape and asks the consumer to also check a field. This one removes the shape
 * -- there is no code path by which `check` returns a verdict for the pack, and no output of this
 * command carries the word COMPLIANT as its status. The compliance result is still reported, because
 * the pack does need to know it, under `workingTreeStatus`: a name that cannot be mistaken for a
 * statement about anybody's adoption of anything.
 *
 * Its exit 0 means "this working tree satisfies its own standards", which is what the repository's
 * pipeline gates on. That is a different sentence from "this project complies with release X of the
 * standards", and it is now impossible to obtain one while asking for the other.
 */
async function commandMaintain(root, { json }) {
  // Same ordering as `check`, and for the same reason. Eligibility here is lineage rather than
  // material, but a command that validated the contract first would still be letting the pack's own
  // schema decide an outcome before anything established which pack this is.
  const loaded = await readPolicyRequest(root);
  if (loaded.error) {
    process.stderr.write(`standards maintain: ${loaded.error}\n`);
    return EXIT.INVOCATION;
  }

  const self = await selfMaintenance(root, loaded.policy);
  if (self.kind === "not-declared") {
    process.stderr.write(
      "standards maintain: this command is for the standards pack maintaining itself, and this policy " +
        "does not declare packSelfMaintenance.\nProjects adopting the standards run `standards check`, " +
        "which establishes which release produced the verdict.\n",
    );
    return EXIT.INVOCATION;
  }
  if (self.kind === "blocked") {
    return emitRefusal({
      project: loaded.policy.project,
      releaseIdentity: self.releaseIdentity,
      status: self.exit === EXIT.BLOCKED ? "BLOCKED_BY_INVARIANT" : "UNIDENTIFIED_RELEASE",
      exit: self.exit,
      json,
    });
  }

  const invalid = await validatePolicyContract(loaded.policy);
  if (invalid) {
    process.stderr.write(`standards maintain: ${invalid}\n`);
    return EXIT.INVOCATION;
  }

  const { verdict, catalog } = await evaluateProject(root, loaded.policy);

  const result = {
    schemaVersion: SCHEMA_VERSION,
    standardVersion: self.packVersion,
    project: loaded.policy.project ?? null,
    releaseIdentity: self.releaseIdentity,
    // Never a compliance verdict, and never absent: a reader that finds no status at all invents one.
    status: "SELF_MAINTENANCE",
    // The compliance result of the working tree, named so that it says what it is about. It is not
    // `status`, it is not promoted when it is good, and nothing downstream can read it as an adoption.
    workingTreeStatus: verdict.status,
    score: verdict.score,
    summary: verdict.summary,
    assurance: verdict.assurance,
    denominator: verdict.denominator,
    integrityScreen: verdict.integrityScreen ?? { executed: false, checks: [] },
    integrityViolations: verdict.integrityViolations ?? [],
    frameworkCoverage: coverage(catalog, { evaluated: EVALUATED_RULES, totalStandards: 42 }),
    auditedAt: new Date().toISOString(),
    results: verdict.results,
  };

  process.stdout.write(json ? JSON.stringify(result, null, 2) + "\n" : renderMaintain(result));

  if (verdict.status === STATUS.BLOCKED_BY_INVARIANT) return EXIT.BLOCKED;
  if (verdict.status === STATUS.NON_COMPLIANT) return EXIT.FINDINGS;
  if (verdict.status === STATUS.NOT_EVALUATED) return EXIT.NOT_EVALUATED;
  return EXIT.OK;
}

function renderMaintain(r) {
  const id = r.releaseIdentity;
  const out = [
    "SELF-MAINTENANCE — the pack evaluating itself",
    "",
    `Pack:         ${id.packRoot}`,
    `Version:      ${id.packVersion ?? "?"} (working tree, not a release)`,
    `Lineage:      descends from ${id.lineage.tag} ${id.lineage.certifiedCommit.slice(0, 12)}`,
    `Working tree: ${r.workingTreeStatus}`,
    "",
    "This is not an adoption result and no release identity was established. It says whether this",
    "working tree satisfies the standards it publishes — nothing about any project's compliance with",
    "a release of them. `standards check` is the command that can say that, and it refuses here.",
    "",
  ];
  // Everything below the identity block is the ordinary reporting, reused rather than reworded so
  // that a maintainer reads the same failure text an adopter would.
  return out.join("\n") + "\n" + renderCheck({ ...r, status: r.workingTreeStatus }, { header: false });
}

async function commandExplain(root, target, { json }) {
  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const rule = resolveRule(catalog, target);
  if (!rule) {
    process.stderr.write(`standards explain: '${target}' is not a rule in this catalog.\n`);
    process.stderr.write("Run `standards explain --list` to see them, or see PROHIBITIONS.md.\n");
    return EXIT.INVOCATION;
  }

  const inv = JSON.parse(await readFile(path.join(ROOT, "artifacts/standards-source-inventory.json"), "utf8"));
  const standard = inv.standards.find((s) => s.number === rule.standard);

  let applicability = null;
  let attestation = null;
  if (root) {
    const loaded = await loadPolicy(root);
    if (loaded.policy) {
      applicability = loaded.policy.applicability?.[rule.id] ?? null;
      attestation = loaded.policy.attestations?.[rule.id] ?? null;
    }
  }

  const payload = {
    id: rule.id,
    kind: rule.kind,
    title: rule.title,
    severity: rule.severity,
    strength: baselineStrength(rule),
    exemptible: rule.exemptible,
    attestable: rule.attestable,
    validationType: rule.validationType,
    assurance: rule.assurance,
    evaluated: EVALUATED_RULES.includes(rule.id),
    standard: standard ? { number: standard.number, title: standard.title, path: standard.implementedBy } : null,
    description: rule.description,
    rationale: rule.rationale,
    remediation: rule.remediation,
    assuranceNote: rule.$assuranceNote ?? null,
    appliesHere: applicability ? applicability.status !== "not-applicable" : true,
    applicability,
    attestation,
  };

  if (json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return EXIT.OK;
  }

  const out = [];
  out.push(`${rule.id}`);
  out.push(`  ${rule.title}`);
  out.push("");
  out.push(`Kind:       ${rule.kind}${rule.kind === "prohibition" ? " — never exemptible" : ""}${rule.kind === "invariant" ? " — never exemptible, attestable, or not-applicable" : ""}`);
  out.push(`Severity:   ${rule.severity}`);
  out.push(`Standard:   ${standard ? `${standard.number} — ${standard.title} (${standard.implementedBy})` : rule.standard}`);
  out.push(`Checked by: ${rule.validationType}, assurance ${rule.assurance}`);
  out.push(`            ${EVALUATED_RULES.includes(rule.id) ? "A detector examines this rule." : "No detector examines this rule; a human review establishes it."}`);
  out.push("");
  out.push("The rule");
  out.push(`  ${rule.description}`);
  out.push("");
  out.push("Why");
  out.push(`  ${wrap(rule.rationale, 76, "  ")}`);
  out.push("");
  out.push("What evidence would satisfy it");
  if (rule.kind === "invariant") {
    out.push("  Nothing establishes this rule, and nothing is permitted to. It is never attestable —");
    out.push("  self-certifying one's own integrity is worth nothing — and never not-applicable.");
    out.push("");
    out.push(`  On a run where the integrity screen executes fully, it reports 'screened': all`);
    out.push(`  ${(INVARIANT_SCREENS[rule.id] ?? []).length} implemented checks ran and detected no violation. That is weak evidence and`);
    out.push("  deliberately not a pass. Detected manipulation is decisive and stops the run (exit 3).");
  } else if (rule.attestable && !EVALUATED_RULES.includes(rule.id)) {
    out.push("  A recorded human review: an attestation in project-policy.yml naming who reviewed it,");
    out.push("  when, what they examined, and what they concluded. Without one this reports");
    out.push("  not-evaluated — never passed.");
  } else if (EVALUATED_RULES.includes(rule.id)) {
    out.push(`  ${wrap(rule.$assuranceNote ?? "A detector examines this rule.", 76, "  ")}`);
  } else {
    out.push("  Nothing available establishes this rule. It reports not-evaluated.");
  }
  out.push("");
  out.push("To remediate");
  out.push(`  ${wrap(rule.remediation, 76, "  ")}`);

  if (applicability) {
    out.push("");
    out.push(`In this project: ${applicability.status}`);
    out.push(`  Reason:      ${wrap(applicability.reason, 74, "               ")}`);
    if (applicability.reviewedAt) out.push(`  Reviewed:    ${applicability.reviewedAt}`);
    if (applicability.revisitWhen) out.push(`  Revisit when: ${wrap(applicability.revisitWhen, 74, "                ")}`);
    if (applicability.status === "not-applicable" && rule.kind === "prohibition") {
      out.push("");
      out.push("  A not-applicable declaration on a prohibition asserts that the prohibited behavior");
      out.push("  CANNOT OCCUR in the evaluated scope. It is not a waiver, and a reason stating that");
      out.push("  the behavior is wanted would be an integrity violation (Standard 42 R3).");
    }
  }
  if (attestation) {
    out.push("");
    out.push(`Attested: ${attestation.status} by ${attestation.reviewedBy} on ${attestation.reviewedAt}`);
    out.push(`  ${wrap(attestation.evidence, 76, "  ")}`);
  }

  process.stdout.write(out.join("\n") + "\n");
  return EXIT.OK;
}

function wrap(text, width, indent) {
  const words = String(text ?? "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n" + indent);
}

async function commandStatus(root, { json }) {
  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const loaded = await loadPolicy(root);
  if (loaded.error) {
    process.stderr.write(`standards status: ${loaded.error}\n`);
    return EXIT.INVOCATION;
  }
  const policy = loaded.policy;
  const now = today();
  const digests = await attestationDigests(root, policy);

  const expiredExceptions = (policy.exceptions ?? [])
    .filter((e) => e.expires && e.expires < now)
    .map((e) => ({ rule: e.rule, expired: e.expires }));

  const staleAttestations = [];
  const expiredAttestations = [];
  for (const [ruleId, a] of Object.entries(policy.attestations ?? {})) {
    if (a.expires && a.expires < now) expiredAttestations.push({ rule: ruleId, expired: a.expires });
    const recorded = a.reviewedAgainst?.digest;
    const current = digests.get(ruleId);
    if (recorded && current && recorded !== current) {
      staleAttestations.push({ rule: ruleId, recorded, current });
    }
    if (!recorded && current) {
      staleAttestations.push({ rule: ruleId, recorded: null, current, note: "no digest recorded; add this one to enable staleness detection" });
    }
  }

  const noTrigger = Object.entries(policy.applicability ?? {})
    .filter(([, d]) => d.status === "not-applicable" && !d.revisitWhen)
    .map(([rule]) => rule);

  const findings = await runDetectors(root);
  const verdict = evaluate({ catalog, policy, findings, evaluated: EVALUATED_RULES, today: now, digests });
  const missingEvidence = verdict.results
    .filter((r) => r.disposition === "not-evaluated" && r.strength === "required")
    .map((r) => r.ruleId);

  const payload = {
    project: policy.project ?? null,
    status: verdict.status,
    integrityScreen: verdict.integrityScreen,
    screenedInvariants: verdict.results.filter((r) => r.status === "screened").map((r) => r.ruleId),
    expiredExceptions,
    expiredAttestations,
    staleAttestations,
    notApplicableWithoutTrigger: noTrigger,
    missingEvidence,
    undeclaredRules: [...catalog.rules.keys()].filter(
      (id) => !(id in (policy.rules ?? {}) || id in (policy.applicability ?? {}) || id in (policy.attestations ?? {})),
    ),
  };

  if (json) {
    process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return EXIT.OK;
  }

  const out = [
    `Project: ${payload.project ?? "(unnamed)"}`,
    `Status:  ${payload.status}`,
    `Screen:  ${payload.integrityScreen.executed ? `${payload.integrityScreen.checks.length} integrity check(s) ran, none fired` : "did not execute"}`,
    "",
  ];
  const section = (title, items, render) => {
    out.push(`${title}: ${items.length}`);
    for (const item of items.slice(0, 20)) out.push(`  ${render(item)}`);
    if (items.length > 20) out.push(`  ... and ${items.length - 20} more`);
    out.push("");
  };
  section("Expired exceptions", expiredExceptions, (e) => `${e.rule} (expired ${e.expired})`);
  section("Expired attestations", expiredAttestations, (a) => `${a.rule} (expired ${a.expired})`);
  section("Stale attestations", staleAttestations, (a) => `${a.rule} — ${a.note ?? "reviewed files have changed since review"}`);
  section("Not-applicable without a revisit trigger", noTrigger, (r) => r);
  section("Rules awaiting evidence", missingEvidence, (r) => r);
  section("Rules this policy never mentions", payload.undeclaredRules, (r) => r);

  out.push("An undeclared rule is one this project has not considered — not one it accepted.");
  process.stdout.write(out.join("\n") + "\n");
  return EXIT.OK;
}

async function commandInit(root, { dryRun, forceOverwrite, mode: statedMode }) {
  const mode = await detectMode(root, statedMode);
  const { actions, conflicts } = await initPlan({ dir: root, forceOverwrite });

  if (!dryRun && conflicts.length === 0) await initApply({ dir: root, actions });

  process.stdout.write(initRender({ mode, actions, conflicts, dryRun }));
  return conflicts.length > 0 ? EXIT.FINDINGS : EXIT.OK;
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

const USAGE = `standards — evaluate a project against the health, fitness, and nutrition standards

  standards init    [path] [--dry-run] [--force-overwrite=<path>] [--mode=<mode>]
  standards audit   [path] [--json] [--strict]
  standards check   [path] [--json]
  standards maintain [path] [--json]      the standards pack only; not an adoption check
  standards explain <rule-id> [path] [--json]
  standards status  [path] [--json]

Options
  --dir=<path>            target directory (alternative to the positional path)
  --json                  machine-readable output, deterministically ordered
  --strict                audit only: exit 1 when any non-info finding is present
  --dry-run               init only: show the action list without writing
  --force-overwrite=<p>   init only: replace exactly this path; one path per flag

Exit codes
  check   0 compliant · 1 non-compliant · 2 config error · 3 blocked by invariant
          4 insufficient evidence to reach a verdict
          5 release identity could not be established, so no verdict was produced
          6 this is the standards pack maintaining itself; run 'standards maintain'
  maintain 0 the working tree satisfies its own standards · 1 it does not
          2 not the pack, or no declaration · 3 blocked by invariant · 4 insufficient evidence
          5 eligibility could not be established
  audit   0 completed · 1 --strict with findings · 2 invocation error
  init    0 completed · 1 conflicts, nothing written · 2 could not run

  4 is not a worse 0. It means the evaluation could not establish compliance, which in this
  domain is the expected first result: most rules are prohibitions only a human can evaluate.

  0 from 'check' means one thing and only one thing: this project complies with a release of
  these standards that the evaluator proved it was running. 0 from 'maintain' is a different
  sentence about a different subject, and no output of it reports a status of COMPLIANT.
`;

async function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(USAGE);
    return args.length === 0 ? EXIT.INVOCATION : EXIT.OK;
  }

  const subcommand = args[0];
  const flags = args.filter((a) => a.startsWith("--"));
  const positional = args.slice(1).filter((a) => !a.startsWith("--"));
  const dirFlag = flags.find((f) => f.startsWith("--dir="));
  const json = flags.includes("--json");

  const forceOverwrite = flags.filter((f) => f.startsWith("--force-overwrite=")).map((f) => f.slice("--force-overwrite=".length));
  const modeFlag = flags.find((f) => f.startsWith("--mode="));

  const explicitTarget = subcommand === "explain" ? positional[1] : positional[0];
  const root = path.resolve(dirFlag ? dirFlag.slice("--dir=".length) : (explicitTarget ?? "."));

  if (subcommand !== "explain" || positional[1] || dirFlag) {
    if (!existsSync(root)) {
      process.stderr.write(`standards: no such directory: ${root}\n`);
      return EXIT.INVOCATION;
    }
  }

  switch (subcommand) {
    case "audit":
      return commandAudit(root, { json, strict: flags.includes("--strict") });
    case "check":
      return commandCheck(root, { json });
    case "maintain":
      return commandMaintain(root, { json });
    case "explain": {
      if (!positional[0]) {
        process.stderr.write("standards explain: name a rule id. See PROHIBITIONS.md.\n");
        return EXIT.INVOCATION;
      }
      const scope = positional[1] || dirFlag ? root : null;
      return commandExplain(scope, positional[0], { json });
    }
    case "status":
      return commandStatus(root, { json });
    case "init":
      return commandInit(root, { dryRun: flags.includes("--dry-run"), forceOverwrite, mode: modeFlag?.slice("--mode=".length) });
    default:
      process.stderr.write(`standards: unknown subcommand '${subcommand}'\n\n${USAGE}`);
      return EXIT.INVOCATION;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(await main(process.argv));
  } catch (error) {
    process.stderr.write(`standards: ${error.message}\n`);
    process.exit(EXIT.INVOCATION);
  }
}
