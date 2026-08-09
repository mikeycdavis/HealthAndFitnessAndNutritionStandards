#!/usr/bin/env node
/**
 * Validate a project policy: is this file well-formed, and does it say what its author thinks?
 *
 * This is deliberately NOT a compliance check. It answers "is this policy valid", never "is this
 * project compliant" — those are different questions with different inputs, and a tool that blurred
 * them would let a valid policy read as a passing project. `standards check` answers the second.
 *
 * Three layers, in order:
 *
 *   1. The YAML parses under a strict subset. Anything outside it is an error rather than a guess.
 *   2. The document validates against schemas/project-policy.schema.json, evaluated by a validator
 *      that throws on any keyword it does not implement rather than skipping it.
 *   3. Semantic checks the schema cannot express, because the schema does not know the catalog:
 *      unknown rule ids, a rule declared both not-applicable and excepted, an exception against a
 *      prohibition or the invariant, a lowered strength, a not-applicable declaration with no
 *      revisit trigger, and rules the policy never mentions at all.
 *
 * The last of those matters more than it looks. A rule absent from a policy is undeclared, not
 * accepted — reporting the count is what stops silence from being mistaken for a decision.
 *
 * Usage:
 *   node scripts/policy.mjs [path/to/project-policy.yml] [--json] [--schema <path>]
 *
 * Exit: 0 valid · 1 a problem was found · 2 malformed or unreadable.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { parseYaml, YamlError } from "./yaml.mjs";
import { validate, assertSchemaSupported, SchemaError } from "./jsonschema.mjs";
import { loadCatalog, resolve, isExemptible, mayBeNotApplicable } from "./catalog.mjs";
import { baselineStrength, STRENGTHS } from "./compliance.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Pure. Semantic checks that need the catalog — everything the schema structurally cannot see.
 * Severity `error` fails the run; `warning` is reported and does not.
 */
export function inspect({ policy, catalog }) {
  const problems = [];
  const note = (severity, where, message, remediation) =>
    problems.push({ severity, where, message, remediation });

  const seen = new Set();
  const checkId = (id, where) => {
    seen.add(id);
    const rule = resolve(catalog, id);
    if (!rule) {
      note(
        "error",
        where,
        `'${id}' is not a rule in this catalog.`,
        "Check the spelling against PROHIBITIONS.md or `standards explain`. A policy cannot declare anything about a rule that does not exist.",
      );
      return null;
    }
    if (rule.id !== id) {
      note(
        "warning",
        where,
        `'${id}' is a legacy alias for '${rule.id}'.`,
        `Rewrite the key as '${rule.id}'. Aliases resolve on read and are never emitted.`,
      );
    }
    return rule;
  };

  for (const [id, setting] of Object.entries(policy.rules ?? {})) {
    const rule = checkId(id, `rules.${id}`);
    if (!rule || !setting?.strength) continue;
    if (rule.kind === "prohibition" || rule.kind === "invariant") {
      note(
        "error",
        `rules.${id}.strength`,
        `${rule.id} is a ${rule.kind}; its strength is not a project setting.`,
        "Remove the strength declaration. A prohibition is held at one strength everywhere.",
      );
    } else if ((STRENGTHS[setting.strength] ?? 0) < STRENGTHS[baselineStrength(rule)]) {
      note(
        "error",
        `rules.${id}.strength`,
        `${rule.id} is a ${rule.kind} (${baselineStrength(rule)}); this lowers it to '${setting.strength}'.`,
        "Raise it back and write a time-bounded exception if the rule cannot be met. Lowering a strength achieves a waiver's relief without its visibility (Standard 42).",
      );
    }
  }

  const notApplicable = new Set();
  for (const [id, declaration] of Object.entries(policy.applicability ?? {})) {
    const rule = checkId(id, `applicability.${id}`);
    if (!rule) continue;
    if (declaration?.status !== "not-applicable") continue;
    notApplicable.add(rule.id);

    if (!mayBeNotApplicable(rule)) {
      note(
        "error",
        `applicability.${id}`,
        `${rule.id} is an invariant and can never be out of scope.`,
        "Remove the declaration. The integrity invariant binds every project that adopts these standards.",
      );
      continue;
    }
    if (!declaration.revisitWhen) {
      note(
        "warning",
        `applicability.${id}`,
        "not-applicable with no revisitWhen trigger.",
        "Add a revisitWhen. A scope claim is true of a project at a moment; with no trigger it outlives its truth silently.",
      );
    }
    if (rule.kind === "prohibition" && declaration.reason) {
      // A weak heuristic, and reported as a warning precisely because it is one. It cannot judge
      // honesty; it can notice a reason phrased as a preference rather than as a limit of scope,
      // which is the shape a waiver takes when it is dressed as a scope claim.
      if (/\b(want|wants|wanted|prefer|prefers|prefer to|too (hard|difficult|slow|strict)|inconvenient|business|commercial|customers? (want|ask)|users? (want|ask))\b/i.test(declaration.reason)) {
        note(
          "warning",
          `applicability.${id}`,
          "the not-applicable reason reads as a preference rather than a limit of scope.",
          "A prohibition is not-applicable only when the prohibited behavior CANNOT OCCUR in the evaluated scope. That someone wants it is a reason it applies, not a reason it does not (Standard 42).",
        );
      }
    }
  }

  for (const entry of Array.isArray(policy.exceptions) ? policy.exceptions : []) {
    const rule = checkId(entry.rule, `exceptions[${entry.rule}]`);
    if (!rule) continue;
    if (!isExemptible(rule)) {
      note(
        "error",
        `exceptions[${entry.rule}]`,
        `${rule.id} is a ${rule.kind} and admits no exception.`,
        "Remove it. `standards check` will not record this — it stops with BLOCKED_BY_INVARIANT and exit code 3.",
      );
    }
    if (notApplicable.has(rule.id)) {
      note(
        "error",
        `exceptions[${entry.rule}]`,
        `${rule.id} is declared not-applicable AND carries an exception. These are contradictory claims.`,
        "Choose one: either the rule has no subject here (not-applicable), or it applies and is knowingly unmet (exception).",
      );
    }
    if (!entry.expires) {
      note(
        "warning",
        `exceptions[${entry.rule}]`,
        "exception has no expiry, so it is indefinite.",
        "Add an expires date. An indefinite waiver is a stronger claim than it looks.",
      );
    }
  }

  for (const [id, attestation] of Object.entries(policy.attestations ?? {})) {
    const rule = checkId(id, `attestations.${id}`);
    if (!rule) continue;
    if (!rule.attestable) {
      note(
        "error",
        `attestations.${id}`,
        `${rule.id} is not attestable (${rule.kind}, ${rule.validationType}).`,
        rule.kind === "invariant"
          ? "Remove it. Attesting that we are not manipulating standards is self-certification of the thing under suspicion (ADR 0003)."
          : "Remove it and let the check evaluate the rule.",
      );
    }
    if (notApplicable.has(rule.id)) {
      note(
        "error",
        `attestations.${id}`,
        `${rule.id} is declared not-applicable AND attested as satisfied. These are contradictory claims.`,
        "A rule with no subject here cannot also have been reviewed and found satisfied. Choose one.",
      );
    }
    if (!attestation?.reviewedAgainst?.paths) {
      note(
        "warning",
        `attestations.${id}`,
        "attestation names no reviewedAgainst paths, so it can never go stale.",
        "List what was examined. Without it the attestation stands forever, including after the thing reviewed has changed.",
      );
    }
  }

  const undeclared = [...catalog.rules.keys()].filter((id) => !seen.has(id));

  return {
    problems,
    errors: problems.filter((p) => p.severity === "error").length,
    warnings: problems.filter((p) => p.severity === "warning").length,
    declared: seen.size,
    undeclared,
    catalogSize: catalog.rules.size,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes("--json");
  const schemaFlag = args.indexOf("--schema");
  const schemaPath =
    schemaFlag >= 0 ? args[schemaFlag + 1] : path.join(ROOT, "schemas/project-policy.schema.json");
  const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--schema");
  const policyPath = positional[0] ? path.resolve(positional[0]) : path.join(ROOT, "project-policy.yml");

  const die = (message) => {
    process.stderr.write(`policy: ${message}\n`);
    process.exit(2);
  };

  if (!existsSync(policyPath)) die(`no policy at ${policyPath}`);
  if (!existsSync(schemaPath)) die(`no schema at ${schemaPath}`);

  let policy;
  try {
    policy = parseYaml(await readFile(policyPath, "utf8"));
  } catch (error) {
    if (error instanceof YamlError) die(`${path.relative(ROOT, policyPath)}: ${error.message}`);
    throw error;
  }

  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  let schemaErrors;
  try {
    assertSchemaSupported(schema);
    schemaErrors = validate(policy, schema);
  } catch (error) {
    if (error instanceof SchemaError) die(error.message);
    throw error;
  }

  const catalog = await loadCatalog(path.join(ROOT, "rules"));
  const semantic = schemaErrors.length === 0 ? inspect({ policy, catalog }) : null;

  const ok = schemaErrors.length === 0 && (semantic?.errors ?? 1) === 0;

  if (jsonOut) {
    process.stdout.write(
      JSON.stringify(
        {
          policy: path.relative(ROOT, policyPath).replace(/\\/g, "/"),
          schemaErrors,
          problems: semantic?.problems ?? [],
          declared: semantic?.declared ?? 0,
          undeclared: semantic?.undeclared ?? [],
          catalogSize: catalog.rules.size,
          ok,
        },
        null,
        2,
      ) + "\n",
    );
    process.exit(ok ? 0 : 1);
  }

  const out = [];
  if (schemaErrors.length > 0) {
    out.push(`Schema errors: ${schemaErrors.length}`, "");
    for (const e of schemaErrors) out.push(`  ! ${e.path || "(root)"}: ${e.message}`);
    out.push("", "The policy does not match schemas/project-policy.schema.json.");
    process.stdout.write(out.join("\n") + "\n");
    process.exit(1);
  }

  out.push(`Valid against ${path.relative(ROOT, schemaPath).replace(/\\/g, "/")}.`);
  out.push(`Rules declared:   ${semantic.declared} of ${semantic.catalogSize}`);
  out.push(`Undeclared rules: ${semantic.undeclared.length}`);
  if (semantic.undeclared.length > 0) {
    out.push("  An undeclared rule is one this project has not considered — not one it accepted.");
  }
  out.push("");

  for (const p of semantic.problems) {
    out.push(`${p.severity === "error" ? "!" : "?"} ${p.where}: ${p.message}`);
    out.push(`    ${p.remediation}`);
    out.push("");
  }

  out.push(
    semantic.errors === 0
      ? "The policy is well-formed. This says nothing about whether the project complies — run `standards check` for that."
      : "The policy is not usable as written.",
  );

  process.stdout.write(out.join("\n") + "\n");
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
