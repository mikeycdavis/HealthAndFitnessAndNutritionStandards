/**
 * FE-15 (#30): adoption testing covers the surfaces someone ACTS on before the ones that describe.
 *
 * ci/adoption-surfaces.json names those surfaces and the tests that cover each. This file holds the
 * inventory to what is actually on disk and in the test files, and adds the two surfaces that had no
 * test at all: CODEOWNERS and the branch-protection assumptions.
 *
 * What this does NOT do, on purpose: it does not decide whether an instruction makes a person do the
 * correct thing. The issue records that no reliable mechanical form of that property exists and that
 * a guard is justified by a mechanical property, not by a count of examples. What is mechanical is
 * coverage: that every actionable surface exists, is claimed, and has a named test that is really
 * there and really run.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS } from "../scripts/compliance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const read = (file) => readFile(path.join(REPO, file), "utf8");
const inventory = JSON.parse(await read("ci/adoption-surfaces.json"));
const pkg = JSON.parse(await read("package.json"));

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(path.join(REPO, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(rel)));
    else out.push(rel);
  }
  return out;
};

const CRITERIA = [1, 2, 3, 4, 5, 6, 7];
const hasTest = (text, title) => text.includes(`test(${JSON.stringify(title)}`);

// ---------------------------------------------------------------------------------------------
// The inventory is true
// ---------------------------------------------------------------------------------------------

test("every adoption criterion 1-7 is covered by a named surface with a covering test", () => {
  const byCriterion = new Map();
  const ids = new Set();
  for (const surface of inventory.actionable) {
    assert.ok(!ids.has(surface.id), `duplicate surface id ${surface.id}`);
    ids.add(surface.id);
    assert.ok(surface.tests.length > 0, `${surface.id} has no covering test`);
    if (surface.criterion !== null) byCriterion.set(surface.criterion, surface);
  }
  for (const n of CRITERIA) assert.ok(byCriterion.has(n), `criterion ${n} has no surface in the inventory`);
});

test("every surface file exists and every covering test is a real test that npm test runs", async () => {
  const command = pkg.scripts.test;
  for (const surface of inventory.actionable) {
    for (const file of surface.files) assert.ok(existsSync(path.join(REPO, file)), `${surface.id}: ${file} does not exist`);
    for (const { file, title } of surface.tests) {
      assert.ok(command.includes(`test/${file}`), `${surface.id}: test/${file} is not run by npm test`);
      const text = await read(`test/${file}`);
      assert.ok(hasTest(text, title), `${surface.id}: test/${file} has no test titled ${JSON.stringify(title)}`);
    }
  }
  for (const entry of inventory.descriptive) {
    for (const file of entry.files) assert.ok(existsSync(path.join(REPO, file)), `descriptive: ${file} does not exist`);
  }
});

test("MUTATION: a covering test renamed away is caught, and an unrelated edit is not", async () => {
  const title = "CLAUDE.md defers to AGENTS.md rather than restating it";
  const text = await read("test/templates.test.mjs");
  assert.ok(hasTest(text, title), "precondition: the real test is found");
  assert.ok(!hasTest(text.replace(title, "something else"), title), "renaming the test must be noticed");
  assert.ok(hasTest(`${text}\n// comment\n`, title), "an unrelated edit must not be");
});

test("every file in an actionable location is claimed by a surface, so a new one cannot slip in untested", async () => {
  const claimed = new Set(inventory.actionable.flatMap((s) => s.files));
  const present = [...inventory.claimedLocations.files];
  for (const dir of inventory.claimedLocations.directories) present.push(...(await walk(dir)));
  const unclaimed = present.filter((f) => !claimed.has(f));
  assert.deepEqual(unclaimed, [], `files someone acts on with no surface and no covering test: ${unclaimed.join(", ")}`);
});

// ---------------------------------------------------------------------------------------------
// Actionable surfaces come first
// ---------------------------------------------------------------------------------------------

test("the actionable surfaces are covered before any descriptive document is, in the inventory and in the test command", () => {
  const keys = Object.keys(inventory);
  assert.ok(keys.indexOf("actionable") < keys.indexOf("descriptive"), "the inventory lists what is acted on first");
  if (inventory.descriptive.length > 0) {
    assert.ok(inventory.actionable.every((s) => s.tests.length > 0), "descriptive coverage is claimed while an actionable surface has none");
  }
  // node --test runs files concurrently, so this is the declared priority and a failure that names the
  // actionable guard first, not an execution order. The honest limit is recorded in the evidence.
  const files = [...pkg.scripts.test.matchAll(/test\/([a-z-]+\.test\.mjs)/g)].map((m) => m[1]);
  assert.ok(files.indexOf("adoption-surfaces.test.mjs") >= 0, "this guard must be in the test command");
  assert.ok(files.indexOf("adoption-surfaces.test.mjs") < files.indexOf("instructions.test.mjs"), "the actionable-surface guard is listed ahead of the documentation-as-contract tests");
});

// ---------------------------------------------------------------------------------------------
// The two surfaces that had no test: CODEOWNERS and the branch-protection assumptions
// ---------------------------------------------------------------------------------------------

test("CODEOWNERS is well formed and covers the files that change what is enforced", async () => {
  const lines = (await read(".github/CODEOWNERS")).split(/\r?\n/).filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
  assert.ok(lines.length > 0, "CODEOWNERS declares no ownership");
  const rules = lines.map((line) => {
    const [pattern, ...owners] = line.trim().split(/\s+/);
    assert.ok(owners.length > 0, `no owner on: ${line}`);
    for (const owner of owners) assert.match(owner, /^(@[A-Za-z0-9][\w-]*(\/[\w-]+)?|[^\s@]+@[^\s@]+\.[^\s@]+)$/, `not a valid owner: ${owner}`);
    return pattern;
  });
  for (const pattern of rules) {
    assert.ok(existsSync(path.join(REPO, pattern.replace(/^\//, ""))), `CODEOWNERS pattern ${pattern} matches nothing in this repository`);
  }
  for (const guarded of ["/project-policy.yml", "/.github/workflows/", "/.github/CODEOWNERS"]) {
    assert.ok(rules.includes(guarded), `${guarded} is not owned: a change to it would need no one's review`);
  }
});

test("no actionable file claims branch protection or Code Owner review is in force", async () => {
  const mention = /branch[- ]protection|require review from code owners|code owner review/i;
  const hedge = /expectation|assum|owner's to apply|your .* to (apply|enable)|until /i;
  const files = [".github/CODEOWNERS", "INSTRUCTIONS.md", "README.md", ...(await walk("templates")), ...(await walk(".github/workflows"))];
  for (const file of files) {
    const text = await read(file);
    if (!mention.test(text)) continue;
    assert.match(text, hedge, `${file} mentions branch protection or Code Owner review but does not say it is an expectation the owner applies`);
    assert.ok(!/(is|are|has been|have been) (now )?(enabled|enforced|configured|in force)/i.test(text.split(/\n/).filter((l) => mention.test(l)).join("\n")), `${file} states protection is in force; this repository cannot read that setting`);
  }
});

// ---------------------------------------------------------------------------------------------
// Version and migration metadata
// ---------------------------------------------------------------------------------------------

test("the adapter manifest and the shipped templates agree with VERSION and with the evaluator", async () => {
  const version = (await read("VERSION")).trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.ok((await read("CHANGELOG.md")).includes(`## ${version} —`) || (await read("CHANGELOG.md")).includes("## Unreleased"), "the changelog records neither this version nor an unreleased section");

  const adapter = JSON.parse(await read("standards-adapter.json"));
  assert.ok(existsSync(path.join(REPO, adapter.evaluation.entrypoint)), "the adapter entrypoint does not exist");
  assert.ok(adapter.evaluation.arguments.includes("check"), "the adapter must call check, the evaluator, not maintain, the gate");
  const known = new Set([...Object.values(STATUS), "SELF_MAINTENANCE", "UNIDENTIFIED_RELEASE"]);
  for (const status of adapter.result.statuses) assert.ok(known.has(status), `adapter lists a status the evaluator never returns: ${status}`);
  for (const status of Object.values(STATUS)) assert.ok(adapter.result.statuses.includes(status), `adapter omits ${status}`);
  for (const status of adapter.result.passing) assert.ok(adapter.result.statuses.includes(status), `passing status ${status} is not a listed status`);
  assert.ok(!adapter.result.passing.includes("NOT_EVALUATED"), "NOT_EVALUATED is not a pass");

  // Every template that pins a release uses the placeholder or a real semver that init rewrites.
  const ci = await read("templates/standards-ci.yml");
  assert.ok(ci.includes("{{STANDARD_VERSION}}"), "the CI template must carry the pin token init resolves");
  assert.match(await read("templates/project-policy.yml"), /^standardVersion: "\d+\.\d+\.\d+"/m, "the policy template must carry a schema-valid pin");
});
