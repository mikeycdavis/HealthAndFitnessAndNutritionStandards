/**
 * Documentation as contract.
 *
 * INSTRUCTIONS.md and README.md make checkable claims: that certain commands exist, that certain
 * files are where they say, that the counts are what they say. Documentation that has drifted from
 * the system is worse than none, because it is believed — so the claims are asserted here rather
 * than trusted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalog } from "../scripts/catalog.mjs";
import { EVALUATED_RULES } from "../scripts/standards.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const read = (file) => readFile(path.join(REPO, file), "utf8");
const catalog = await loadCatalog(path.join(REPO, "rules"));

const instructions = await read("INSTRUCTIONS.md");
const readme = await read("README.md");
const project = await read("PROJECT.md");
const changelog = await read("CHANGELOG.md");
const packageJson = JSON.parse(await read("package.json"));

// ---------------------------------------------------------------------------------------------
// Claims about the system
// ---------------------------------------------------------------------------------------------

test("every npm script the documentation names actually exists", () => {
  const named = new Set();
  for (const text of [instructions, readme, project]) {
    for (const m of text.matchAll(/npm run ([a-z:]+)/g)) named.add(m[1]);
  }
  assert.ok(named.size >= 5, "the documentation should name the commands a reader will run");
  for (const script of named) {
    assert.ok(packageJson.scripts[script], `documentation names 'npm run ${script}', which does not exist`);
  }
});

test("every standards subcommand the documentation names is implemented", async () => {
  const cli = await read("scripts/standards.mjs");
  // Matched against the known subcommands only. A trailing `[a-z]+` alternative would turn ordinary
  // prose — "the standards documents", "the standards repository" — into a false positive.
  const SUBCOMMANDS = ["init", "audit", "check", "explain", "status"];
  const named = new Set();
  for (const text of [instructions, readme, project]) {
    for (const m of text.matchAll(new RegExp(`standards (${SUBCOMMANDS.join("|")})\\b`, "g"))) named.add(m[1]);
  }
  assert.equal(named.size, SUBCOMMANDS.length, "the documentation should name every subcommand");
  for (const sub of named) {
    assert.match(cli, new RegExp(`case "${sub}"`), `documentation names 'standards ${sub}', which the CLI does not handle`);
  }
});

test("every repository path the documentation links to exists", async () => {
  for (const [name, text] of [["INSTRUCTIONS.md", instructions], ["README.md", readme], ["PROJECT.md", project]]) {
    for (const m of text.matchAll(/\]\(([^)#:]+?)(?:#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^https?:/.test(target)) continue;
      assert.ok(existsSync(path.join(REPO, target)), `${name} links to ${target}, which does not exist`);
    }
  }
});

test("the rule counts in the documentation match the catalog", () => {
  const prohibitions = [...catalog.rules.values()].filter((r) => r.kind === "prohibition").length;
  for (const [name, text] of [["README.md", readme], ["INSTRUCTIONS.md", instructions]]) {
    if (text.includes("59 rules")) assert.equal(catalog.rules.size, 59, `${name} says 59 rules`);
    if (/34 prohibitions/.test(text)) assert.equal(prohibitions, 34, `${name} says 34 prohibitions`);
  }
  assert.match(readme, /59 rules/);
  assert.match(readme, /Thirty-four things/);
});

test("the machine-evaluated count in the README matches EVALUATED_RULES", () => {
  assert.equal(EVALUATED_RULES.length, 21);
  assert.match(readme, /\| \*\*Machine-evaluated\*\* \| 21 \|/);
  assert.match(readme, /\| \*\*Judgment-based\*\* \| 38 \|/);
  assert.equal(catalog.rules.size - EVALUATED_RULES.length, 38);
});

test("the README's standards table lists all 42, with links that resolve", async () => {
  const inventory = JSON.parse(await read("artifacts/standards-source-inventory.json"));
  for (const standard of inventory.standards) {
    assert.ok(
      readme.includes(`(${standard.implementedBy})`),
      `the README does not link Standard ${standard.number}`,
    );
  }
  const files = (await readdir(path.join(REPO, "standards"))).filter((f) => f.endsWith(".md"));
  assert.equal(files.length, 42);
});

test("the exit-code table matches what the CLI actually returns", async () => {
  const cli = await read("scripts/standards.mjs");
  assert.match(cli, /BLOCKED: 3/);
  assert.match(cli, /NOT_EVALUATED: 4/);
  for (const text of [readme, instructions]) {
    assert.match(text, /BLOCKED_BY_INVARIANT/);
    assert.match(text, /NOT_EVALUATED/);
  }
  assert.match(readme, /4 is not a worse 0/i);
});

// ---------------------------------------------------------------------------------------------
// Claims the adoption guide must make
// ---------------------------------------------------------------------------------------------

test("the guide prohibits copying the standards, and says a clean audit is not compliance", () => {
  assert.match(instructions, /Do not copy the standards/i);
  assert.match(instructions, /clean audit is \*\*not\*\* compliance|not treat a clean audit as compliance/i);
});

test("the guide explains why NOT_EVALUATED is the expected first result", () => {
  assert.match(instructions, /## 4\. Why your first result is NOT_EVALUATED/);
  assert.match(instructions, /nothing failing is not evidence that anything passed/i);
});

test("the guide spells out the not-applicable semantics with the worked example", () => {
  assert.match(instructions, /cannot occur within the evaluated scope/i);
  assert.match(instructions, /nutrition\.no-crash-dieting/);
  assert.match(instructions, /BLOCKED_BY_INVARIANT/);
  assert.match(instructions, /some users want rapid weight loss/);
});

test("the guide carries the agent stop rule and the right to conclude nothing is known", () => {
  assert.match(instructions, /## 7\. For AI agents/);
  assert.match(instructions, /stop and report/i);
  assert.match(instructions, /never be forced to produce a positive recommendation/i);
});

test("the guide states the tooling's limitations rather than implying it has none", () => {
  assert.match(instructions, /## 10\. Current limitations/);
  assert.match(instructions, /presence, never correctness/i);
  assert.match(instructions, /substring scans/i);
  assert.match(instructions, /allergen check does not exist/i);
  assert.match(instructions, /loud, not impossible|not against a determined editor/i);
});

test("the README carries the not-medical-advice statement escalation.scope-disclosed looks for", () => {
  assert.match(readme, /not medical advice/i);
  assert.match(readme, /does not diagnose/i);
  assert.match(readme, /not a substitute for evaluation by a qualified clinician/i);
});

// ---------------------------------------------------------------------------------------------
// Honesty about this repository's own state
// ---------------------------------------------------------------------------------------------

test("PROJECT.md reports this repository's own status honestly", () => {
  assert.match(project, /NOT_EVALUATED/);
  assert.match(project, /no human has reviewed them/i);
  assert.match(project, /## Current state/);
  assert.match(project, /Known gaps/i);
});

/**
 * A hand-maintained count drifts. This one did: PROJECT.md, CHANGELOG.md, and the CI comment all
 * said "four" while the tool reported five, because `nutrition.no-single-food-disease-claims` was
 * added to the applicable set and the prose was never updated. Nothing caught it until a release
 * review ran `standards status` and read the output.
 */
test("the documented count of rules awaiting review matches what the tool reports", async () => {
  const { spawnSync } = await import("node:child_process");
  const cli = path.join(REPO, "scripts", "standards.mjs");
  const r = spawnSync(process.execPath, [cli, "status", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  const status = JSON.parse(r.stdout);
  const actual = status.missingEvidence;
  assert.ok(actual.length > 0, "this repository should have rules awaiting review");

  const WORDS = { 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };
  const expected = WORDS[actual.length];

  for (const [name, text] of [["PROJECT.md", project], ["CHANGELOG.md", changelog]]) {
    const flattened = text.replace(/\s+/g, " ");
    const claims = [...flattened.matchAll(/\b(one|two|three|four|five|six|seven) rules apply here|\b(One|Two|Three|Four|Five|Six|Seven) rules apply here/gi)];
    for (const claim of claims) {
      assert.match(
        claim[0].toLowerCase(),
        new RegExp(`^${expected} rules apply here`),
        `${name} claims "${claim[0]}" but the tool reports ${actual.length}`,
      );
    }
  }

  // And every rule the prose names must actually be one the tool is waiting on.
  for (const text of [project, changelog]) {
    for (const m of text.matchAll(/`((?:health|fitness|nutrition|escalation|trend|integrity)\.[a-z0-9-]+)`/g)) {
      if (!actual.includes(m[1])) continue; // prose may mention rules for other reasons
      assert.ok(catalog.rules.has(m[1]));
    }
  }
  for (const id of actual) {
    assert.ok(
      project.includes("`" + id + "`"),
      `PROJECT.md does not name ${id}, which the tool reports as awaiting review`,
    );
  }
});

test("the changelog records what the guards caught, not only what was added", () => {
  assert.match(changelog, /### Found while building/);
  assert.match(changelog, /### Dogfooded/);
  assert.match(changelog, /### Known limitations/);
  assert.match(changelog, /subjectExists/, "the integrity-screen bug is worth recording");
});

test("the version in package.json matches VERSION", async () => {
  const version = (await read("VERSION")).trim();
  assert.equal(packageJson.version, version);
});

test("package.json declares no dependencies, which is the policy made structural", async () => {
  assert.ok(!packageJson.dependencies, "a dependency here would need arguing for");
  assert.ok(!packageJson.devDependencies);
  // Only the executable lines. The workflow's own comment explains that an `npm ci` appearing here
  // would mean the dependency policy changed, and a naive scan of the whole file matches that
  // explanation — flagging the documentation of the rule as a violation of it.
  const ci = await read(".github/workflows/ci.yml");
  const commands = ci.split("\n").filter((line) => /^\s*(run:|-\s*run:)/.test(line));
  assert.ok(commands.length > 0, "the workflow should run something");
  for (const line of commands) {
    assert.ok(!/npm ci|npm install|yarn |pnpm /.test(line), `an install step in CI means the policy changed: ${line.trim()}`);
  }
});

test("CI runs the guards before the tests, and gates on check", async () => {
  const ci = await read(".github/workflows/ci.yml");
  const order = ["npm run inventory", "npm run rules", "npm run fidelity", "npm run policy", "npm run diagrams", "npm test", "npm run audit", "npm run check"];
  let previous = -1;
  for (const step of order) {
    const at = ci.indexOf(step);
    assert.ok(at > previous, `CI must run ${step} after the previous step`);
    previous = at;
  }
  assert.ok(!ci.includes("audit . --strict"), "audit runs without --strict; the error gate is the test suite");
});
