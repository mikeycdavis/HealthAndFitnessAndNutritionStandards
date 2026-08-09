/**
 * The rule catalog: the single source of machine truth for rule identity and metadata.
 *
 * The architectural rule this module exists to hold, and which the whole evaluation system rests on:
 *
 *   The catalog defines rule identity and metadata.
 *   project-policy.yml defines project applicability.
 *   The evaluator produces evidence.
 *   None of the three may redefine the others.
 *
 * So: a policy may select the strength at which a project adopts a requirement, but it may not
 * invent a rule the catalog does not define, and an evaluator may not report against an id the
 * catalog does not carry. `assertBindings` enforces the last of those mechanically, because a
 * detector reporting an unknown rule id is how an evaluator grows a private vocabulary one detector
 * at a time.
 *
 * KIND, NOT LEVEL. A rule's `kind` is what it *is*: a requirement, a recommendation, a prohibition,
 * or an invariant (ADR 0002). This replaces the more common `level` plus a `nonExemptible` boolean,
 * which fits a catalog where prohibitions are rare. Here 34 of 59 rules are prohibitions — they are
 * the reason the pack exists — and a boolean flag describes only what may not be done *to* a rule,
 * never what the rule is. Kind also gives the loader something to enforce: a prohibition that is not
 * an error, or an invariant that is attestable, fails to load.
 *
 * A catalog that loads partially would silently shrink the denominator of every count taken from it,
 * so a malformed entry throws rather than being skipped.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_DIR = path.join(ROOT, "rules");

/**
 * What a rule IS. Determines exemptibility, default severity floor, and how a failure is reported.
 *
 *   requirement    — must be done. Exemptible with an approved, time-bounded waiver.
 *   recommendation — should normally be done. Exemptible. A failure is a warning.
 *   prohibition    — must never be done. NEVER exemptible; may be declared not-applicable.
 *   invariant      — must always hold, including of the standards system itself. Never exemptible,
 *                    never attestable, never not-applicable.
 */
export const KINDS = new Set(["requirement", "recommendation", "prohibition", "invariant"]);

/**
 * What kind of check the rule calls for. Deliberately narrow: `configuration` and `code-analysis`
 * appear in comparable catalogs but no rule here uses them, and an enum value nothing uses is
 * surface that invites a rule to be catalogued as checkable by machinery that does not exist. They
 * can be added when a real rule needs one.
 */
export const VALIDATION_TYPES = new Set(["structural", "document", "manual-review"]);

/**
 * What the CURRENT implementation can actually establish — not what the rule deserves.
 *
 *   full    — the check establishes the requirement.
 *   partial — the check establishes something weaker (a file exists, a section is present).
 *   none    — nothing mechanical; a human evaluates it.
 *
 * Kept separate from `validationType` because conflating the two is how false-green compliance
 * happens: a rule can be catalogued as checkable while the checker that exists proves much less.
 */
export const ASSURANCE = new Set(["full", "partial", "none"]);

/** Reporting weight. Orthogonal to kind. */
export const SEVERITIES = new Set(["error", "warning", "info"]);

/** Canonical rule identity (ADR 0001). This exact pattern also appears in the policy schema. */
export const CANONICAL_ID = /^[a-z][a-z0-9]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

/** Kinds a project may waive with an exception. Prohibitions and invariants are absent by design. */
export const EXEMPTIBLE_KINDS = new Set(["requirement", "recommendation"]);

export class CatalogError extends Error {
  constructor(message) {
    super(message);
    this.name = "CatalogError";
  }
}

/** May a project write an `exceptions:` entry against this rule? */
export function isExemptible(rule) {
  return EXEMPTIBLE_KINDS.has(rule.kind);
}

/** May a project declare this rule not-applicable? Everything except the invariant. */
export function mayBeNotApplicable(rule) {
  return rule.kind !== "invariant";
}

/**
 * Load every rules/*.json file into one catalog.
 *
 * Returns { rules: Map<id, rule>, aliases: Map<alias, id>, byCategory: Map<category, rule[]>,
 * byKind: Map<kind, rule[]> }. Throws CatalogError on any malformed entry.
 */
export async function loadCatalog(dir = CATALOG_DIR) {
  const rules = new Map();
  const aliases = new Map();

  let files;
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  } catch (error) {
    throw new CatalogError(`cannot read the catalog directory ${dir}: ${error.message}`);
  }
  if (files.length === 0) throw new CatalogError(`no rule files found in ${dir}`);

  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    } catch (error) {
      throw new CatalogError(`${file}: ${error.message}`);
    }
    if (!Array.isArray(parsed.rules)) throw new CatalogError(`${file}: missing a 'rules' array`);

    for (const rule of parsed.rules) {
      const where = `${file}:${rule.id ?? "(no id)"}`;

      if (typeof rule.id !== "string" || !CANONICAL_ID.test(rule.id)) {
        throw new CatalogError(`${where}: id is not a canonical category.kebab-case-name (ADR 0001)`);
      }
      if (rules.has(rule.id)) throw new CatalogError(`${where}: duplicate rule id`);

      for (const [field, allowed] of [
        ["kind", KINDS],
        ["severity", SEVERITIES],
        ["validationType", VALIDATION_TYPES],
        ["assurance", ASSURANCE],
      ]) {
        if (!allowed.has(rule[field])) {
          throw new CatalogError(
            `${where}: ${field} '${rule[field]}' is not one of ${[...allowed].join(", ")}`,
          );
        }
      }
      for (const field of ["title", "description", "rationale", "remediation", "introducedIn"]) {
        if (typeof rule[field] !== "string" || rule[field].trim() === "") {
          throw new CatalogError(`${where}: ${field} is required and must not be empty`);
        }
      }
      if (typeof rule.standard !== "number") throw new CatalogError(`${where}: standard must be a number`);
      if (typeof rule.category !== "string" || rule.category.trim() === "") {
        throw new CatalogError(`${where}: category is required`);
      }

      // A prohibition or an invariant that reports as anything less than an error is a prohibition
      // in name only. Enforced here rather than left to review.
      if ((rule.kind === "prohibition" || rule.kind === "invariant") && rule.severity !== "error") {
        throw new CatalogError(`${where}: a ${rule.kind} must be severity 'error', found '${rule.severity}'`);
      }

      // The honesty invariant. A rule a human evaluates cannot claim the check establishes it.
      if (rule.validationType === "manual-review" && rule.assurance === "full") {
        throw new CatalogError(
          `${where}: a manual-review rule may not claim assurance 'full' — nothing mechanical establishes it`,
        );
      }

      // Present from the first release even when empty: adding them later means every existing rule
      // silently lacks them, and consumers come to treat their absence as meaningful.
      for (const field of ["deprecatedIn", "supersededBy", "removedIn"]) {
        if (!(field in rule)) throw new CatalogError(`${where}: lifecycle field '${field}' must be present`);
      }
      if (!Array.isArray(rule.aliases)) throw new CatalogError(`${where}: aliases must be an array`);

      for (const alias of rule.aliases) {
        if (aliases.has(alias)) throw new CatalogError(`${where}: alias '${alias}' is already claimed`);
        if (rules.has(alias)) throw new CatalogError(`${where}: '${alias}' is both a rule id and an alias`);
        aliases.set(alias, rule.id);
      }

      if ("attestable" in rule && typeof rule.attestable !== "boolean") {
        throw new CatalogError(`${where}: attestable must be a boolean when present`);
      }
      // Defaults to manual-review, because those are the rules whose own metadata says a human is
      // the evaluator. Anything else must opt in explicitly, so attestation cannot quietly become a
      // universal override.
      let attestable = rule.attestable ?? rule.validationType === "manual-review";
      if (rule.kind === "invariant") {
        // ADR 0003. Attesting "a human reviewed this and we are not manipulating standards" is
        // self-certification of precisely the thing under suspicion.
        if (rule.attestable === true) {
          throw new CatalogError(`${where}: an invariant may never be attestable (ADR 0003)`);
        }
        attestable = false;
      }

      rules.set(
        rule.id,
        Object.freeze({
          ...rule,
          attestable,
          exemptible: isExemptible(rule),
          source: file,
        }),
      );
    }
  }

  // A second pass: an alias must never collide with a rule id defined in a later file.
  for (const alias of aliases.keys()) {
    if (rules.has(alias)) throw new CatalogError(`'${alias}' is both a rule id and an alias`);
  }

  const byCategory = new Map();
  const byKind = new Map();
  for (const rule of rules.values()) {
    if (!byCategory.has(rule.category)) byCategory.set(rule.category, []);
    byCategory.get(rule.category).push(rule);
    if (!byKind.has(rule.kind)) byKind.set(rule.kind, []);
    byKind.get(rule.kind).push(rule);
  }

  return { rules, aliases, byCategory, byKind };
}

/** Resolve an id or a legacy alias to a canonical rule. Returns undefined if neither. */
export function resolve(catalog, id) {
  return catalog.rules.get(id) ?? catalog.rules.get(catalog.aliases.get(id));
}

/**
 * Assert every rule id an evaluator reports against exists in the catalog.
 *
 * This is the mechanical guard on the architectural rule at the top of this file. Without it an
 * evaluator grows its own vocabulary one detector at a time, and the day comes when the audit speaks
 * in finding categories while the policy speaks in rule ids.
 */
export function assertBindings(catalog, ids) {
  const unknown = [...new Set(ids)].filter((id) => !catalog.rules.has(id));
  if (unknown.length > 0) {
    throw new CatalogError(
      `evaluator reports against rule id(s) the catalog does not define: ${unknown.join(", ")}`,
    );
  }
}

/**
 * Framework maturity metadata — NOT part of the compliance verdict, and deliberately separate from
 * it.
 *
 * The hazard this counters: someone reads COMPLIANT and forgets that the catalog covers a subset of
 * the framework mechanically. A verdict is a statement about the rules that were evaluated; this is
 * a statement about how much of the framework can be evaluated at all. Mixing them would make a
 * coverage improvement read as a compliance improvement.
 *
 * `fullyMachineRepresented` is deliberately strict: a standard counts only when every one of its
 * catalogued rules is both evaluated AND carries assurance better than `none`. In this release that
 * number is expected to be zero, because every standard carrying an evaluated rule also carries a
 * prohibition that no machine evaluates. That is the honest answer, and a looser definition would
 * let the number rise without the tooling improving.
 */
export function coverage(catalog, { evaluated = [], totalStandards = null } = {}) {
  const examined = new Set(evaluated);
  const byStandard = new Map();
  for (const rule of catalog.rules.values()) {
    if (!byStandard.has(rule.standard)) byStandard.set(rule.standard, []);
    byStandard.get(rule.standard).push(rule);
  }

  let fullyMachineRepresented = 0;
  for (const rules of byStandard.values()) {
    if (rules.every((r) => examined.has(r.id) && r.assurance !== "none")) fullyMachineRepresented++;
  }

  const counts = {};
  for (const [kind, rules] of catalog.byKind) counts[kind] = rules.length;

  return {
    cataloguedRules: catalog.rules.size,
    evaluatedRules: [...catalog.rules.keys()].filter((id) => examined.has(id)).length,
    rulesByKind: counts,
    standards: totalStandards,
    standardsWithRules: byStandard.size,
    fullyMachineRepresentedStandards: fullyMachineRepresented,
    note: "Framework maturity, not compliance. A standard counts as fully machine-represented only when every rule it contributes is evaluated and carries assurance above none.",
  };
}
