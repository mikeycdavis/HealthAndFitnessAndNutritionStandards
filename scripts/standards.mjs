#!/usr/bin/env node
/**
 * standards — audit, check, explain, status, and init for a project adopting these standards.
 *
 * FIVE COMMANDS, chosen for the loop an operator actually works in:
 *
 *   init     bootstrap a project        (writes; dry-run derives from the same plan)
 *   audit    gather evidence            (no policy needed; never a verdict)
 *   check    reach a verdict            (the CI gate)
 *   explain  why a rule applies here    (and what evidence would satisfy it)
 *   status   what has gone stale        (expired, stale, due for revisit, missing)
 *
 * `audit` and `check` are separate because they answer different questions and have different
 * exit-code contracts (ADR 0005). A clean audit means nothing matched the checks that exist; it
 * does not mean the guidance is safe.
 *
 * WHAT THE DETECTORS CAN CLAIM. Every detector in this file establishes that an artifact or a
 * section EXISTS. None establishes that its content is correct, and every rule they bind to carries
 * `assurance: "partial"` and an $assuranceNote saying so. The 34 prohibitions and the integrity
 * invariant have no detector at all and report not-evaluated unless a human review is recorded.
 * That is the honest position for this domain: a confident green on unsafe health guidance is worse
 * than no answer, and a detector that read a `## Measurement Quality` heading and reported the
 * measurement-quality analysis as sound would produce exactly that.
 *
 * EXIT CODES (see docs/design/architecture.md):
 *   check:  0 compliant · 1 non-compliant · 2 config error · 3 blocked by invariant · 4 not evaluated
 *   audit:  0 completed · 1 --strict and something non-info found · 2 invocation error
 *   init:   0 completed · 1 conflicts, nothing written · 2 could not run
 *   others: 0 fine · 2 invocation error
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadCatalog, resolve as resolveRule, assertBindings, coverage } from "./catalog.mjs";
import { evaluate, envelope, STATUS, baselineStrength } from "./compliance.mjs";
import { parseYaml, YamlError } from "./yaml.mjs";
import { validate, assertSchemaSupported, SchemaError } from "./jsonschema.mjs";
import { plan as initPlan, apply as initApply, detectMode, render as initRender } from "./init.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXIT = {
  OK: 0,
  FINDINGS: 1,
  INVOCATION: 2,
  BLOCKED: 3,
  NOT_EVALUATED: 4,
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

async function loadPolicy(root) {
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
  const schema = JSON.parse(await readFile(path.join(ROOT, "schemas/project-policy.schema.json"), "utf8"));
  try {
    assertSchemaSupported(schema);
  } catch (error) {
    if (error instanceof SchemaError) return { error: error.message };
    throw error;
  }
  const errors = validate(policy, schema);
  if (errors.length > 0) {
    return { error: `project-policy.yml does not match the schema:\n${errors.map((e) => `  ${e.path || "(root)"}: ${e.message}`).join("\n")}` };
  }
  return { policy };
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
    schemaVersion: "1.0",
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

async function commandCheck(root, { json }) {
  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const loaded = await loadPolicy(root);
  if (loaded.error) {
    process.stderr.write(`standards check: ${loaded.error}\n`);
    return EXIT.INVOCATION;
  }
  const findings = await runDetectors(root);
  assertBindings(catalog, findings.map((f) => f.rule).filter(Boolean));

  const verdict = evaluate({
    catalog,
    policy: loaded.policy,
    findings,
    evaluated: EVALUATED_RULES,
    today: today(),
    digests: await attestationDigests(root, loaded.policy),
  });

  const version = (await readFile(path.join(ROOT, "VERSION"), "utf8").catch(() => "unknown")).trim();
  const result = envelope({
    verdict,
    project: loaded.policy.project ?? null,
    standardVersion: loaded.policy.standardVersion ?? version,
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

function renderCheck(r) {
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

  const s = r.summary;
  out.push(`Status: ${r.status}`);
  out.push(`Score:  ${r.score === null ? "n/a" : r.score + "%"}  (rules at required strength that were evaluated: ${r.denominator.scored})`);
  out.push(`Rules:  ${s.passed} passed, ${s.failed} failed, ${s.warnings} warning(s), ${s.skipped} skipped`);
  out.push(`Cover:  ${r.assurance.automated} automated, ${r.assurance.manualReview} manual-review, ${r.assurance.notEvaluated} not-evaluated`);
  out.push("");

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
  if (rule.attestable && !EVALUATED_RULES.includes(rule.id)) {
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

  const out = [`Project: ${payload.project ?? "(unnamed)"}`, `Status:  ${payload.status}`, ""];
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
  audit   0 completed · 1 --strict with findings · 2 invocation error
  init    0 completed · 1 conflicts, nothing written · 2 could not run

  4 is not a worse 0. It means the evaluation could not establish compliance, which in this
  domain is the expected first result: most rules are prohibitions only a human can evaluate.
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
