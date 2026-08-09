/**
 * The guards, and a mutation test for each: reintroduce the defect it exists to catch, and assert it
 * fails.
 *
 * This is the mechanism ADR 0003 rests on. The guards do not make manipulating the standards
 * impossible — anyone with commit access can edit anything — they make it LOUD. A guard nobody has
 * watched fail is a guard nobody knows works, and a comparable system shipped a freshness checker
 * that compared only first lines and therefore reported clean on precisely the edit it existed to
 * catch. It was found by writing a test like these.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyse as analyseInventory, extract, isPrerelease } from "../scripts/inventory.mjs";
import { analyse as analyseFidelity } from "../scripts/fidelity.mjs";
import { analyse as analyseRules } from "../scripts/rules.mjs";
import { normalize, mermaidBlocks } from "../scripts/diagrams.mjs";
import { loadCatalog } from "../scripts/catalog.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");

const seriesInventory = JSON.parse(
  await readFile(path.join(REPO, "artifacts/standards-source-inventory.json"), "utf8"),
);
const spec = await readFile(path.join(REPO, seriesInventory.source), "utf8");
const ruleInventory = JSON.parse(await readFile(path.join(REPO, "artifacts/rule-inventory.json"), "utf8"));
const catalog = await loadCatalog(path.join(REPO, "rules"));
const catalogRules = [...catalog.rules.values()];

const inventoryBase = {
  inventory: seriesInventory,
  sourceText: spec,
  standardFiles: [],
  version: "1.0.0-dev",
  exists: () => true,
};

// ---------------------------------------------------------------------------------------------
// The series inventory
// ---------------------------------------------------------------------------------------------

test("the specification and the reviewed series inventory agree", () => {
  const r = analyseInventory(inventoryBase);
  assert.equal(r.expectedCount, 42);
  assert.equal(r.detectedCount, 42);
  assert.equal(r.problems, 0);
});

test("MUTATION: dropping a standard from the specification is caught", () => {
  const r = analyseInventory({ ...inventoryBase, sourceText: spec.replace(/^8\. Trends$/m, "") });
  assert.ok(r.problems > 0);
  assert.deepEqual(r.missing, [8]);
});

test("MUTATION: renaming a standard in the specification is caught", () => {
  const r = analyseInventory({
    ...inventoryBase,
    sourceText: spec.replace("6. Measurement Quality", "6. Measurement Notes"),
  });
  assert.equal(r.titleMismatches.length, 1);
  assert.equal(r.titleMismatches[0].number, 6);
});

test("MUTATION: shrinking the reviewed inventory to match a short build is caught", () => {
  const shrunk = {
    ...seriesInventory,
    expectedCount: 41,
    standards: seriesInventory.standards.filter((s) => s.number !== 42),
  };
  const r = analyseInventory({ ...inventoryBase, inventory: shrunk });
  assert.ok(r.problems > 0, "removing Standard 42 from the inventory must not go unnoticed");
  assert.deepEqual(r.unknown, [42]);
});

test("MUTATION: a standards file no inventory entry claims is caught", () => {
  const r = analyseInventory({ ...inventoryBase, standardFiles: ["99-smuggled-in.md"] });
  assert.deepEqual(r.unclaimedFiles, ["standards/99-smuggled-in.md"]);
  assert.ok(r.problems > 0);
});

test("an unwritten standard is progress at a prerelease and a defect at a release", () => {
  const pre = analyseInventory({ ...inventoryBase, exists: () => false });
  assert.equal(pre.unimplemented.length, 42);
  assert.equal(pre.problems, 0, "a prerelease may have unwritten standards");

  const released = analyseInventory({ ...inventoryBase, version: "1.0.0", exists: () => false });
  assert.equal(released.problems, 42, "a released series that does not exist is a false claim");
  assert.equal(isPrerelease("1.0.0"), false);
  assert.equal(isPrerelease("1.0.0-dev"), true);
});

test("the must-never lists stay out of the extracted series", () => {
  const { found } = extract(spec);
  assert.equal(found.size, 42, "numbering the prohibitions would put 34 spurious entries in the series");
  for (const title of found.values()) assert.ok(!/^never /i.test(title));
});

// ---------------------------------------------------------------------------------------------
// Fidelity
// ---------------------------------------------------------------------------------------------

test("every verbatim claim in the standards is verified, and all 34 prohibitions are checked", async () => {
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(path.join(REPO, "standards"))).filter((f) => f.endsWith(".md")).sort();
  const documents = [];
  for (const f of files) {
    documents.push({ path: `standards/${f}`, text: await readFile(path.join(REPO, "standards", f), "utf8") });
  }
  const r = analyseFidelity({ sourceText: spec, documents, rules: catalogRules });
  assert.deepEqual(r.failures, []);
  assert.equal(r.prohibitions, 34);
  assert.ok(r.claims >= 34);
});

test("MUTATION: softening a prohibition's wording in the catalog is caught", () => {
  const softened = catalogRules.map((r) =>
    r.id === "nutrition.no-crash-dieting"
      ? { ...r, description: "Never recommend crash dieting without appropriate justification" }
      : r,
  );
  const result = analyseFidelity({ sourceText: spec, documents: [], rules: softened });
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0].where, /nutrition\.no-crash-dieting/);
});

test("MUTATION: a reworded verbatim quotation in a standard is caught", () => {
  const doc = {
    path: "standards/99-probe.md",
    text: "Reproduced verbatim from the source:\n\n> Individual observations inform decisions; trends usually establish patterns.\n",
  };
  const r = analyseFidelity({ sourceText: spec, documents: [doc], rules: [] });
  assert.equal(r.failures.length, 1);
  assert.match(r.failures[0].diverges, /usually/);
});

test("MUTATION: formatting added inside a verbatim quotation is caught", () => {
  const doc = {
    path: "standards/99-probe.md",
    text: "Reproduced verbatim from the source:\n\n> Individual observations inform decisions; `trends` establish patterns.\n",
  };
  assert.equal(analyseFidelity({ sourceText: spec, documents: [doc], rules: [] }).failures.length, 1);
});

test("prose that claims nothing is not checked — the point is to hold a document to its own word", () => {
  const doc = {
    path: "standards/99-probe.md",
    text: "This standard says something entirely of its own invention.\n\n> A quote nobody claimed was verbatim.\n",
  };
  assert.deepEqual(analyseFidelity({ sourceText: spec, documents: [doc], rules: [] }).failures, []);
});

// ---------------------------------------------------------------------------------------------
// The rule inventory — the tamper evidence of ADR 0003
// ---------------------------------------------------------------------------------------------

test("the catalog matches the reviewed rule inventory", () => {
  const r = analyseRules({ inventory: ruleInventory, catalogRules });
  assert.equal(r.problems, 0);
  assert.equal(r.catalogRules, 59);
  assert.deepEqual(r.counts.prohibitions, { health: 13, fitness: 11, nutrition: 10 });
  assert.equal(r.counts.invariants, 1);
});

test("MUTATION: silently deleting a prohibition is caught", () => {
  const r = analyseRules({
    inventory: ruleInventory,
    catalogRules: catalogRules.filter((x) => x.id !== "health.no-false-reassurance"),
  });
  assert.ok(r.problems > 0);
  assert.deepEqual(r.missing, ["health.no-false-reassurance"]);
  assert.ok(r.countDrift.some((c) => c.what === "health prohibitions"));
});

test("MUTATION: downgrading a prohibition to a recommendation is caught", () => {
  const r = analyseRules({
    inventory: ruleInventory,
    catalogRules: catalogRules.map((x) =>
      x.id === "nutrition.no-crash-dieting" ? { ...x, kind: "recommendation" } : x,
    ),
  });
  assert.ok(r.drifted.some((d) => d.id === "nutrition.no-crash-dieting" && d.field === "kind"));
  assert.ok(r.countDrift.some((c) => c.what === "nutrition prohibitions"));
});

test("MUTATION: removing the integrity invariant is caught", () => {
  const r = analyseRules({
    inventory: ruleInventory,
    catalogRules: catalogRules.filter((x) => x.kind !== "invariant"),
  });
  assert.ok(r.problems > 0);
  assert.ok(r.countDrift.some((c) => c.what === "invariants" && c.expected === 1 && c.found === 0));
});

test("MUTATION: adding a rule the inventory never reviewed is caught", () => {
  const r = analyseRules({
    inventory: ruleInventory,
    catalogRules: [...catalogRules, { ...catalogRules[0], id: "health.slipped-in-quietly" }],
  });
  assert.deepEqual(r.unknown, ["health.slipped-in-quietly"]);
});

test("MUTATION: an inventory edited to agree with a weakened catalog still disagrees with itself", () => {
  // Someone removes a prohibition from both the catalog AND the inventory list, but forgets the
  // separately-pinned counts. That is the point of pinning them separately.
  const r = analyseRules({
    inventory: { ...ruleInventory, rules: ruleInventory.rules.filter((x) => x.id !== "health.no-false-reassurance") },
    catalogRules: catalogRules.filter((x) => x.id !== "health.no-false-reassurance"),
  });
  assert.ok(r.problems > 0, "the pinned counts must catch what the edited list no longer does");
  assert.ok(r.selfInconsistent.length > 0 || r.countDrift.length > 0);
});

// ---------------------------------------------------------------------------------------------
// Diagram freshness
// ---------------------------------------------------------------------------------------------

test("normalize ignores incidental whitespace but not content", () => {
  assert.equal(normalize("flowchart TB\n  a --> b  \n"), normalize("flowchart TB\n  a --> b\n"));
  assert.notEqual(normalize("flowchart TB"), normalize("flowchart LR"));
});

test("MUTATION: editing only the first line of a diagram is still a change", () => {
  // The exact defect a comparable implementation shipped: it matched a host document on first lines
  // and therefore reported clean on this edit.
  const source = "flowchart TB\n  a --> b\n";
  const edited = "flowchart LR\n  a --> b\n";
  const embedded = [normalize(source)];
  assert.ok(embedded.includes(normalize(source)));
  assert.ok(!embedded.includes(normalize(edited)), "a first-line edit must not match");
});

test("mermaidBlocks extracts whole fenced blocks", () => {
  const md = "text\n\n```mermaid\nflowchart TB\n  a --> b\n```\n\nmore\n";
  assert.deepEqual(mermaidBlocks(md), ["flowchart TB\n  a --> b\n"]);
});
