/**
 * Catalog integrity, and the frozen 1.0.0 baseline.
 *
 * The counts asserted here — 59 rules, 34 prohibitions split 13/11/10, one invariant — are the
 * reviewed baseline. They are pinned in artifacts/rule-inventory.json, checked by scripts/rules.mjs,
 * and asserted again here, because a number that matters should be wrong in more than one place
 * before it can be wrong silently.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadCatalog,
  CatalogError,
  coverage,
  assertBindings,
  isExemptible,
  mayBeNotApplicable,
  CANONICAL_ID,
} from "../scripts/catalog.mjs";
import { EVALUATED_RULES } from "../scripts/standards.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const catalog = await loadCatalog(path.join(REPO, "rules"));
const rules = [...catalog.rules.values()];
const inventory = JSON.parse(await readFile(path.join(REPO, "artifacts/rule-inventory.json"), "utf8"));

// ---------------------------------------------------------------------------------------------
// The frozen baseline
// ---------------------------------------------------------------------------------------------

test("the catalog holds 59 rules", () => {
  assert.equal(catalog.rules.size, 59);
});

test("34 prohibitions, split 13 health / 11 fitness / 10 nutrition", () => {
  const prohibitions = rules.filter((r) => r.kind === "prohibition");
  assert.equal(prohibitions.length, 34);
  const byCategory = {};
  for (const r of prohibitions) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  assert.deepEqual(byCategory, { health: 13, fitness: 11, nutrition: 10 });
});

test("exactly one invariant, and it is the integrity rule", () => {
  const invariants = rules.filter((r) => r.kind === "invariant");
  assert.equal(invariants.length, 1);
  assert.equal(invariants[0].id, "integrity.no-standards-manipulation");
});

test("the kinds sum to the total", () => {
  const counts = {};
  for (const r of rules) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  assert.deepEqual(counts, { prohibition: 34, requirement: 17, recommendation: 7, invariant: 1 });
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), 59);
});

test("the catalog agrees with the reviewed rule inventory", () => {
  assert.equal(inventory.rules.length, catalog.rules.size);
  for (const declared of inventory.rules) {
    const rule = catalog.rules.get(declared.id);
    assert.ok(rule, `the inventory declares ${declared.id}, which the catalog does not contain`);
    assert.equal(rule.kind, declared.kind, `${declared.id} kind drifted from the reviewed inventory`);
    assert.equal(rule.severity, declared.severity, `${declared.id} severity drifted`);
    assert.equal(rule.standard, declared.standard, `${declared.id} standard drifted`);
  }
});

// ---------------------------------------------------------------------------------------------
// Honesty invariants
// ---------------------------------------------------------------------------------------------

test("no manual-review rule claims full assurance", () => {
  const liars = rules.filter((r) => r.validationType === "manual-review" && r.assurance === "full");
  assert.deepEqual(liars.map((r) => r.id), []);
});

test("no rule at all claims full assurance in this release", () => {
  assert.deepEqual(
    rules.filter((r) => r.assurance === "full").map((r) => r.id),
    [],
    "a section existing proves nothing about whether its content is true",
  );
});

test("every prohibition and the invariant are error severity and manual-review", () => {
  for (const r of rules.filter((x) => x.kind === "prohibition" || x.kind === "invariant")) {
    assert.equal(r.severity, "error", `${r.id} must be an error`);
    assert.equal(r.validationType, "manual-review", `${r.id} must be evaluated by a human`);
    assert.equal(r.assurance, "none", `${r.id} must claim no mechanical assurance`);
  }
});

test("prohibitions and the invariant are never exemptible; the invariant is never attestable or N/A", () => {
  for (const r of rules) {
    if (r.kind === "prohibition" || r.kind === "invariant") {
      assert.equal(isExemptible(r), false, `${r.id} must not be exemptible`);
    } else {
      assert.equal(isExemptible(r), true, `${r.id} should be exemptible`);
    }
  }
  const invariant = catalog.rules.get("integrity.no-standards-manipulation");
  assert.equal(invariant.attestable, false, "self-certification of integrity is worth nothing");
  assert.equal(mayBeNotApplicable(invariant), false, "no project is exempt from integrity");
});

test("every prohibition is attestable, so a human review can establish it", () => {
  for (const r of rules.filter((x) => x.kind === "prohibition")) {
    assert.equal(r.attestable, true, `${r.id} must be establishable by recorded human review`);
  }
});

// ---------------------------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------------------------

test("every rule id is canonical and unique", () => {
  const seen = new Set();
  for (const r of rules) {
    assert.match(r.id, CANONICAL_ID, `${r.id} is not canonical`);
    assert.ok(!seen.has(r.id), `duplicate id ${r.id}`);
    seen.add(r.id);
  }
});

test("every rule carries the lifecycle fields, present even when null", () => {
  for (const r of rules) {
    for (const field of ["deprecatedIn", "supersededBy", "removedIn"]) {
      assert.ok(field in r, `${r.id} lacks ${field}`);
    }
    assert.ok(Array.isArray(r.aliases), `${r.id} aliases must be an array`);
    for (const field of ["title", "description", "rationale", "remediation", "introducedIn"]) {
      assert.ok(r[field]?.trim(), `${r.id} has an empty ${field}`);
    }
  }
});

test("every rule's standard resolves to a real standards document", async () => {
  const seriesInventory = JSON.parse(
    await readFile(path.join(REPO, "artifacts/standards-source-inventory.json"), "utf8"),
  );
  const byNumber = new Map(seriesInventory.standards.map((s) => [s.number, s.implementedBy]));
  for (const r of rules) {
    const file = byNumber.get(r.standard);
    assert.ok(file, `${r.id} names standard ${r.standard}, which is not in the series`);
    assert.ok(existsSync(path.join(REPO, file)), `${r.id} names ${file}, which does not exist`);
  }
});

test("every detector-bound rule carries an assurance note saying what the check cannot establish", () => {
  for (const id of EVALUATED_RULES) {
    const rule = catalog.rules.get(id);
    assert.ok(rule, `EVALUATED_RULES names ${id}, which the catalog does not define`);
    assert.ok(rule.$assuranceNote?.trim(), `${id} is detector-bound and must state what its check cannot claim`);
    assert.equal(rule.assurance, "partial", `${id} is checked by a detector that establishes presence only`);
  }
});

test("EVALUATED_RULES contains 21 rules, all of which the catalog defines", () => {
  assert.equal(EVALUATED_RULES.length, 21);
  assertBindings(catalog, EVALUATED_RULES);
  assert.equal(new Set(EVALUATED_RULES).size, 21, "no duplicates");
});

test("no prohibition or invariant is in EVALUATED_RULES", () => {
  for (const id of EVALUATED_RULES) {
    const rule = catalog.rules.get(id);
    assert.ok(
      rule.kind !== "prohibition" && rule.kind !== "invariant",
      `${id} is a ${rule.kind}; no detector may claim to evaluate one`,
    );
  }
});

test("assertBindings throws on a rule id the catalog does not define", () => {
  assert.throws(() => assertBindings(catalog, ["health.invented-by-a-detector"]), CatalogError);
});

// ---------------------------------------------------------------------------------------------
// Coverage reporting
// ---------------------------------------------------------------------------------------------

test("coverage reports framework maturity separately, and claims nothing about compliance", () => {
  const c = coverage(catalog, { evaluated: EVALUATED_RULES, totalStandards: 42 });
  assert.equal(c.cataloguedRules, 59);
  assert.equal(c.evaluatedRules, 21);
  assert.equal(c.standards, 42);
  assert.match(c.note, /NOT compliance/i);
  assert.ok(c.standardsWithRules <= 42);
});

// ---------------------------------------------------------------------------------------------
// Mutation tests — reintroduce the defect, and watch the loader object
// ---------------------------------------------------------------------------------------------

test("MUTATION: a prohibition downgraded to a warning fails to load", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  const rule = catalog.rules.get("nutrition.no-crash-dieting");
  await writeFile(
    path.join(dir, "nutrition.json"),
    JSON.stringify({ rules: [{ ...rule, severity: "warning", source: undefined }] }),
  );
  await assert.rejects(() => loadCatalog(dir), CatalogError, "a prohibition that is not an error must not load");
  await rm(dir, { recursive: true, force: true });
});

test("MUTATION: a manual-review rule claiming full assurance fails to load", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  const rule = catalog.rules.get("nutrition.no-crash-dieting");
  await writeFile(
    path.join(dir, "nutrition.json"),
    JSON.stringify({ rules: [{ ...rule, assurance: "full", source: undefined }] }),
  );
  await assert.rejects(() => loadCatalog(dir), CatalogError);
  await rm(dir, { recursive: true, force: true });
});

test("MUTATION: an attestable invariant fails to load", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  const rule = catalog.rules.get("integrity.no-standards-manipulation");
  await writeFile(
    path.join(dir, "integrity.json"),
    JSON.stringify({ rules: [{ ...rule, attestable: true, source: undefined }] }),
  );
  await assert.rejects(() => loadCatalog(dir), CatalogError, "the invariant must never be self-certifiable");
  await rm(dir, { recursive: true, force: true });
});

test("MUTATION: a non-canonical rule id fails to load", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  const rule = catalog.rules.get("nutrition.no-crash-dieting");
  await writeFile(
    path.join(dir, "n.json"),
    JSON.stringify({ rules: [{ ...rule, id: "nutrition.noCrashDieting", source: undefined }] }),
  );
  await assert.rejects(() => loadCatalog(dir), CatalogError, "camelCase was rejected on day one and stays rejected");
  await rm(dir, { recursive: true, force: true });
});

test("MUTATION: a missing lifecycle field fails to load", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  const rule = { ...catalog.rules.get("nutrition.no-crash-dieting"), source: undefined };
  delete rule.removedIn;
  await writeFile(path.join(dir, "n.json"), JSON.stringify({ rules: [rule] }));
  await assert.rejects(() => loadCatalog(dir), CatalogError);
  await rm(dir, { recursive: true, force: true });
});

test("MUTATION: an empty catalog directory fails to load rather than reporting zero rules", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises");
  const os = await import("node:os");
  const dir = await mkdtemp(path.join(os.tmpdir(), "cat-"));
  await assert.rejects(() => loadCatalog(dir), CatalogError, "an empty catalog must not silently shrink every count");
  await rm(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------------------------
// Every standard is accounted for
// ---------------------------------------------------------------------------------------------

test("a standard with no rule says so in its Implementation section", async () => {
  const seriesInventory = JSON.parse(
    await readFile(path.join(REPO, "artifacts/standards-source-inventory.json"), "utf8"),
  );
  const withRules = new Set(rules.map((r) => r.standard));

  for (const standard of seriesInventory.standards) {
    if (withRules.has(standard.number)) continue;
    const text = await readFile(path.join(REPO, standard.implementedBy), "utf8");
    const implementation = text.slice(text.indexOf("## Implementation"));
    assert.match(
      implementation,
      /No rule (in the catalog )?is (catalogued|bound)/i,
      `Standard ${standard.number} carries no rule and must say so, so a reader checking coverage does not read it as a gap`,
    );
  }
});

test("every standards file is claimed by the series inventory", async () => {
  const seriesInventory = JSON.parse(
    await readFile(path.join(REPO, "artifacts/standards-source-inventory.json"), "utf8"),
  );
  const claimed = new Set(seriesInventory.standards.map((s) => s.implementedBy));
  const files = (await readdir(path.join(REPO, "standards"))).filter((f) => f.endsWith(".md"));
  assert.equal(files.length, 42);
  for (const f of files) {
    assert.ok(claimed.has(`standards/${f}`), `standards/${f} is not claimed by the inventory`);
  }
});
