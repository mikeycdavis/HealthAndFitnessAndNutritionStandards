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

test("PROJECT.md reports this repository's own status honestly", async () => {
  const { spawnSync } = await import("node:child_process");
  const cli = path.join(REPO, "scripts", "standards.mjs");
  const r = spawnSync(process.execPath, [cli, "check", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  const result = JSON.parse(r.stdout);

  const flat = project.replace(/\s+/g, " ");

  // The verdict is read from the tool rather than written into this test. It was NOT_EVALUATED for
  // the whole of the build and became COMPLIANT when four attestations were recorded; either way,
  // what PROJECT.md must not do is describe a different repository than the one that exists.
  assert.match(flat, new RegExp(`current status is \\*\\*\`${result.status}\`\\*\\*`));

  // A green verdict has to be reported with what it does not cover, or the honesty is decorative.
  const unevaluated = result.results.filter((x) => x.disposition === "not-evaluated").map((x) => x.ruleId);
  for (const id of unevaluated) {
    assert.ok(project.includes("`" + id + "`"), `PROJECT.md does not name ${id}, which has no evidence`);
  }

  assert.match(project, /## Current state/);
  assert.match(flat, /Known gaps/i);
  assert.match(flat, /screened/, "the invariant's state must be reported, not folded into the verdict");
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

  const WORDS = { 0: "no", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven" };
  const expected = WORDS[actual.length];

  for (const [name, text] of [["PROJECT.md", project], ["CHANGELOG.md", changelog]]) {
    const flattened = text.replace(/\s+/g, " ");
    const claims = [...flattened.matchAll(/\b(no|one|two|three|four|five|six|seven) rules apply here/gi)];
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

/**
 * The same drift, in the file where it does the most damage.
 *
 * project-policy.yml's attestations comment listed the rules a human must establish, and it was
 * wrong twice over: it named integrity.no-standards-manipulation, which is not attestable, and it
 * omitted nutrition.no-single-food-disease-claims. A human following it would have written an
 * attestation against the invariant, which does not produce a green — it produces
 * BLOCKED_BY_INVARIANT and exit 3.
 *
 * The earlier drift test covers PROJECT.md and CHANGELOG.md, which describe the repository. This
 * one covers the file someone acts on.
 */
test("project-policy.yml names exactly the rules the tool is waiting on", async () => {
  const { spawnSync } = await import("node:child_process");
  const cli = path.join(REPO, "scripts", "standards.mjs");
  const r = spawnSync(process.execPath, [cli, "status", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  const awaiting = JSON.parse(r.stdout).missingEvidence;

  const policyText = await readFile(path.join(REPO, "project-policy.yml"), "utf8");
  const comment = policyText.slice(policyText.indexOf("# Recorded human judgement."));

  for (const id of awaiting) {
    assert.ok(
      comment.includes(id),
      `project-policy.yml's attestations comment does not name ${id}, which awaits evidence`,
    );
  }

  // The invariant is never attestable, so naming it as something to attest is the specific error
  // this test exists to prevent. It may be mentioned — but only to say it needs no attestation.
  const invariantMentions = [...comment.matchAll(/integrity\.no-standards-manipulation/g)];
  for (const _ of invariantMentions) {
    assert.match(
      comment,
      /needs no attestation|NOT attestable|not attestable/,
      "if the comment names the invariant it must say the invariant is not attestable",
    );
  }

  // And no rule the comment presents as awaiting evidence may be one the tool is not waiting on.
  const listed = [...comment.matchAll(/^#\s{3}((?:health|fitness|nutrition|escalation|trend)\.[a-z0-9-]+)$/gm)]
    .map((m) => m[1]);
  assert.deepEqual(
    [...listed].sort(),
    [...awaiting].sort(),
    "the comment's indented list must be exactly the tool's awaiting-evidence set",
  );

  // Once attestations exist, the awaiting list is empty and the assertions above go quiet. What
  // replaces them: the attestations actually recorded in this file must be exactly the rules the
  // evaluator reports as attested. An entry that establishes a rule nobody can see here, or a
  // recorded attestation the evaluator ignores, is the same drift in the other direction.
  const check = spawnSync(process.execPath, [cli, "check", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  const attested = JSON.parse(check.stdout).results
    .filter((x) => x.disposition === "attested")
    .map((x) => x.ruleId)
    .sort();
  const block = policyText.slice(policyText.indexOf("\nattestations:"));
  const recorded = [...block.matchAll(/^ {2}((?:health|fitness|nutrition|escalation|trend|integrity)\.[a-z0-9-]+):$/gm)]
    .map((m) => m[1])
    .sort();
  assert.deepEqual(recorded, attested, "the recorded attestations and the attested rules must be the same set");
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

  // And in the file that now holds the pipeline, where an install step would actually be executed.
  // The same care as above about matching only executable lines: the comments in both files explain
  // the rule, and a naive scan flags the explanation as a violation of it.
  const pipeline = await read("ci/run-checks.sh");
  for (const line of pipeline.split("\n").filter((l) => !/^\s*#/.test(l))) {
    assert.ok(!/npm ci|npm install|yarn |pnpm /.test(line), `an install step in the pipeline means the policy changed: ${line.trim()}`);
  }
});

/**
 * The pipeline order, asserted where the pipeline now lives.
 *
 * This assertion used to read .github/workflows/ci.yml, because that file was the only place the
 * stages existed. It is not weakened by moving: ci/run-checks.sh is what GitHub runs, what the local
 * Docker pipeline runs, and what a self-hosted runner would run, so asserting the order there covers
 * every surface at once instead of one of them. The companion assertion below — that the workflow
 * delegates rather than enumerating — is what stops the old duplication coming back.
 */
test("CI runs the guards before the tests, and gates on check", async () => {
  const pipeline = await read("ci/run-checks.sh");
  const order = ["npm run inventory", "npm run rules", "npm run fidelity", "npm run policy", "npm run diagrams", "npm test", "npm run audit", "npm run check"];
  let previous = -1;
  for (const step of order) {
    const at = pipeline.indexOf(step);
    assert.ok(at > previous, `CI must run ${step} after the previous step`);
    previous = at;
  }
  assert.ok(!pipeline.includes("audit . --strict"), "audit runs without --strict; the error gate is the test suite");
});

test("the GitHub workflow invokes the pipeline rather than restating it", async () => {
  const ci = await read(".github/workflows/ci.yml");
  assert.match(ci, /ci\/run-checks\.sh/, "the workflow must invoke the authoritative pipeline");

  // A second enumeration of the stages here is exactly the duplication this arrangement removes: two
  // definitions that agree until one is edited.
  for (const step of ["npm run inventory", "npm run rules", "npm run fidelity", "npm run diagrams", "npm run check"]) {
    assert.ok(!ci.includes(step), `the workflow names '${step}' itself; the pipeline belongs in ci/run-checks.sh`);
  }
});
