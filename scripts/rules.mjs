#!/usr/bin/env node
/**
 * Prove that the rule catalog has not been quietly edited.
 *
 * WHY THIS EXISTS (ADR 0003). The integrity invariant forbids weakening, removing, or reclassifying
 * a standard because it obstructs a desired conclusion. A rule stated only in prose is protected by
 * nobody, and the catalog is a JSON file that anyone can edit. The specific failure this guards
 * against is not malice so much as pressure: a prohibition is failing, a release is due, and
 * changing `"kind": "prohibition"` to `"kind": "recommendation"` makes the problem go away in one
 * character.
 *
 * So `artifacts/rule-inventory.json` records every rule id with its kind and severity, plus the
 * expected counts, and was reviewed by a human. This script derives the same enumeration from the
 * catalog and compares it AGAINST that file. A dropped rule, a changed kind, a changed severity, or
 * a changed count fails.
 *
 * The file is never regenerated from a run. That is the entire mechanism: the manipulation is not
 * made impossible — someone with commit access can edit anything — it is made LOUD. Downgrading a
 * prohibition now requires editing a reviewed file whose stated purpose is to prevent that, and
 * that edit is a visible line in a diff rather than an invisible change to a rule buried among
 * fifty-eight others.
 *
 * Usage:
 *   node scripts/rules.mjs           report, exit 1 on any disagreement
 *   node scripts/rules.mjs --json    machine-readable
 *
 * Exit: 0 clean · 1 a disagreement was found · 2 could not evaluate.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { loadCatalog, CatalogError } from "./catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Pure. `catalogRules` is an array of loaded rules; `inventory` is the reviewed enumeration.
 */
export function analyse({ inventory, catalogRules }) {
  const expected = new Map(inventory.rules.map((r) => [r.id, r]));
  const actual = new Map(catalogRules.map((r) => [r.id, r]));

  const missing = [...expected.keys()].filter((id) => !actual.has(id)).sort();
  const unknown = [...actual.keys()].filter((id) => !expected.has(id)).sort();

  const drifted = [];
  for (const [id, want] of expected) {
    const have = actual.get(id);
    if (!have) continue;
    for (const field of ["kind", "severity", "standard"]) {
      if (want[field] !== undefined && want[field] !== have[field]) {
        drifted.push({ id, field, expected: want[field], found: have[field] });
      }
    }
  }

  // Counts are recorded separately from the per-rule list so that the two have to agree with each
  // other as well as with the catalog. Editing one and forgetting the other is itself a signal.
  const countDrift = [];
  const wantCounts = inventory.expectedCounts ?? {};
  const haveCounts = { total: actual.size, prohibitions: {}, invariants: 0 };
  for (const rule of actual.values()) {
    if (rule.kind === "prohibition") {
      haveCounts.prohibitions[rule.category] = (haveCounts.prohibitions[rule.category] ?? 0) + 1;
    }
    if (rule.kind === "invariant") haveCounts.invariants++;
  }
  if (wantCounts.total !== undefined && wantCounts.total !== haveCounts.total) {
    countDrift.push({ what: "total rules", expected: wantCounts.total, found: haveCounts.total });
  }
  if (wantCounts.invariants !== undefined && wantCounts.invariants !== haveCounts.invariants) {
    countDrift.push({ what: "invariants", expected: wantCounts.invariants, found: haveCounts.invariants });
  }
  for (const [category, want] of Object.entries(wantCounts.prohibitions ?? {})) {
    const have = haveCounts.prohibitions[category] ?? 0;
    if (want !== have) {
      countDrift.push({ what: `${category} prohibitions`, expected: want, found: have });
    }
  }
  for (const [category, have] of Object.entries(haveCounts.prohibitions)) {
    if (!(category in (wantCounts.prohibitions ?? {}))) {
      countDrift.push({ what: `${category} prohibitions`, expected: 0, found: have });
    }
  }

  // The inventory must agree with itself, or it is not a review of anything.
  const selfInconsistent = [];
  if (wantCounts.total !== undefined && wantCounts.total !== inventory.rules.length) {
    selfInconsistent.push(
      `inventory declares ${wantCounts.total} total rules but lists ${inventory.rules.length}`,
    );
  }
  const declaredProhibitions = inventory.rules.filter((r) => r.kind === "prohibition").length;
  const declaredProhibitionCount = Object.values(wantCounts.prohibitions ?? {}).reduce((a, b) => a + b, 0);
  if (declaredProhibitions !== declaredProhibitionCount) {
    selfInconsistent.push(
      `inventory's expectedCounts total ${declaredProhibitionCount} prohibitions but its list contains ${declaredProhibitions}`,
    );
  }

  const problems =
    missing.length + unknown.length + drifted.length + countDrift.length + selfInconsistent.length;

  return {
    declaredRules: inventory.rules.length,
    catalogRules: actual.size,
    counts: haveCounts,
    missing,
    unknown,
    drifted,
    countDrift,
    selfInconsistent,
    problems,
    ok: problems === 0,
  };
}

export function render(r) {
  const line = (label, value) => `${label.padEnd(30)} ${value}`;
  const list = (xs) => (xs.length === 0 ? "none" : xs.join(", "));

  const out = [
    line("Rules in reviewed inventory:", r.declaredRules),
    line("Rules in catalog:", r.catalogRules),
    line("Prohibitions by category:", JSON.stringify(r.counts.prohibitions)),
    line("Invariants:", r.counts.invariants),
    "",
    line("Missing from catalog:", list(r.missing)),
    line("Not in the inventory:", list(r.unknown)),
    line("Changed since review:", list(r.drifted.map((d) => `${d.id}.${d.field}: '${d.found}' was '${d.expected}'`))),
    line("Count disagreements:", list(r.countDrift.map((c) => `${c.what}: found ${c.found}, expected ${c.expected}`))),
  ];

  if (r.selfInconsistent.length > 0) {
    out.push("", "! the reviewed inventory disagrees with itself:");
    for (const message of r.selfInconsistent) out.push(`    ${message}`);
  }

  if (r.problems > 0) {
    out.push(
      "",
      "The rule inventory was reviewed by a human and is the record of what these standards contain.",
      "A disagreement means the catalog changed. If the change was intended, say so by editing the",
      "inventory in the same commit — that edit is the visible record this guard exists to force.",
      "",
      "If a prohibition was removed, downgraded, or reclassified, treat that as an integrity question",
      "before treating it as a maintenance task (Standard 42).",
    );
  } else {
    out.push("", "The catalog matches the reviewed rule inventory.");
  }
  return out.join("\n") + "\n";
}

async function main() {
  const jsonOut = process.argv.includes("--json");

  let inventory;
  try {
    inventory = JSON.parse(await readFile(path.join(ROOT, "artifacts/rule-inventory.json"), "utf8"));
  } catch (error) {
    process.stderr.write(`rules: cannot read artifacts/rule-inventory.json: ${error.message}\n`);
    process.exit(2);
  }

  let catalogRules = [];
  let loadError = null;
  try {
    const catalog = await loadCatalog(path.join(ROOT, "rules"));
    catalogRules = [...catalog.rules.values()];
  } catch (error) {
    if (!(error instanceof CatalogError)) throw error;
    // A catalog that will not load is a disagreement with the inventory, not a crash: the inventory
    // says these rules exist and the catalog cannot produce them. Report it as such.
    loadError = error.message;
  }

  const report = analyse({ inventory, catalogRules });
  if (loadError) {
    report.selfInconsistent = [...report.selfInconsistent];
    report.catalogError = loadError;
    report.problems += 1;
    report.ok = false;
  }

  if (jsonOut) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write((loadError ? `! the catalog did not load: ${loadError}\n\n` : "") + render(report));
  }
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
