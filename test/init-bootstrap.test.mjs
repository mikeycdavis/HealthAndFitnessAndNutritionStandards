/**
 * FE-14: the nine bootstrap criteria for `standards init`, one test per criterion.
 * (The dry-run and conflict contracts live in init.test.mjs.)
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { plan, apply, detectMode, briefing, packVersion, render, LOCATIONS } from "../scripts/init.mjs";
import { loadCatalog } from "../scripts/catalog.mjs";
import { parseYaml } from "../scripts/yaml.mjs";
import { validate } from "../scripts/jsonschema.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const schema = JSON.parse(await readFile(path.join(REPO, "schemas/project-policy.schema.json"), "utf8"));
const catalog = await loadCatalog(path.join(REPO, "rules"));

const temp = async () => mkdtemp(path.join(os.tmpdir(), "init-fe14-"));
const bootstrap = async (dir) => {
  const result = await plan({ dir });
  await apply({ dir, actions: result.actions });
  return result;
};
const cli = (dir, ...args) =>
  spawnSync(process.execPath, [path.join(REPO, "scripts", "standards.mjs"), "init", dir, ...args], { encoding: "utf8" });
const policyOf = async (dir) => parseYaml(await readFile(path.join(dir, "project-policy.yml"), "utf8"));
const output = async (dir, over = {}) =>
  render({ mode: await detectMode(dir), actions: [], conflicts: [], dryRun: false, briefing: await briefing({ dir, catalog }), ...over });

test("(1,4) the policy structure and the evidence and attestation locations are installed", async () => {
  const dir = await temp();
  await bootstrap(dir);
  const policy = await policyOf(dir);
  for (const key of ["rules", "applicability", "exceptions", "attestations"]) assert.ok(key in policy, key);
  assert.ok(existsSync(path.join(dir, "artifacts/evidence")));
  assert.ok(existsSync(path.join(dir, "artifacts/interpretations")));
  assert.ok(LOCATIONS.some(([what, where]) => /attestations/.test(what) && where === "project-policy.yml"));
  assert.match(await output(dir), /artifacts\/evidence\//);
  await rm(dir, { recursive: true, force: true });
});

test("(2) agent instructions for each supported agent are installed and carry the stop rule", async () => {
  const dir = await temp();
  await bootstrap(dir);
  for (const f of ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md"]) {
    assert.ok((await readFile(path.join(dir, f), "utf8")).length > 0, f);
  }
  assert.match(await readFile(path.join(dir, "AGENTS.md"), "utf8"), /Stop rule/);
  assert.match(await readFile(path.join(dir, "CLAUDE.md"), "utf8"), /AGENTS\.md/);
  await rm(dir, { recursive: true, force: true });
});

test("(3) a CI workflow is installed that runs check at the pinned release and does not mute the verdict", async () => {
  const dir = await temp();
  await bootstrap(dir);
  const wf = await readFile(path.join(dir, ".github/workflows/standards.yml"), "utf8");
  const code = wf.replace(/^\s*#.*$/gm, "");
  assert.ok(!wf.includes("{{STANDARD_VERSION}}"), "no unresolved placeholder");
  assert.ok(wf.includes(`refs/tags/v${packVersion()}`), "fetches the tag it pins");
  assert.match(code, /standards\.mjs" check \./);
  assert.ok(!/continue-on-error|\|\|\s*true|exit 0/.test(code), "must not turn a nonzero exit into a pass");
  await rm(dir, { recursive: true, force: true });
});

test("(5) the version pin is the pack's own VERSION in the policy and the workflow alike", async () => {
  const dir = await temp();
  await bootstrap(dir);
  const policy = await policyOf(dir);
  assert.equal(policy.standardVersion, packVersion());
  assert.deepEqual(validate(policy, schema), []);
  assert.ok((await readFile(path.join(dir, ".github/workflows/standards.yml"), "utf8")).includes(`v${packVersion()}`));
  const other = await plan({ dir: await temp(), version: "9.8.7" });
  assert.match(other.actions.find((a) => a.path === "project-policy.yml").content, /standardVersion: "9\.8\.7"/);
  assert.ok(other.actions.find((a) => a.path === ".github/workflows/standards.yml").content.includes("v9.8.7"));
  await rm(dir, { recursive: true, force: true });
});

test("(6) init never decides applicability: heuristic signals leave domains and applicability empty", async () => {
  const dir = await temp();
  await mkdir(path.join(dir, "artifacts"), { recursive: true });
  await writeFile(path.join(dir, "artifacts/fitness-plan.md"), "# a plan\n");
  const mode = await detectMode(dir);
  assert.ok(mode.evidence.some((e) => e.includes("fitness-plan")), "the signal is reported as evidence");
  await bootstrap(dir);
  const policy = await policyOf(dir);
  assert.deepEqual(policy.domains, []);
  assert.deepEqual(policy.applicability, {});
  const out = await output(dir);
  assert.match(out, /Which of them apply to YOUR project is your declaration/);
  assert.match(out, /not a judgement/);
  await rm(dir, { recursive: true, force: true });
});

test("(7) the prohibitions that bind before implementation are identified, all of them", async () => {
  const dir = await temp();
  const ids = [...catalog.byKind.get("prohibition")].map((r) => r.id).sort();
  assert.equal(ids.length, 34);
  const brief = await briefing({ dir, catalog });
  assert.deepEqual(brief.prohibitions.map((r) => r.id), ids);
  const out = await output(dir, { dryRun: true });
  for (const id of ids) assert.ok(out.includes(id), id);
  await rm(dir, { recursive: true, force: true });
});

test("(8) the initial NOT_EVALUATED says exactly what is missing, follows the policy, and is not claimed on a policy it could not read", async () => {
  const dir = await temp();
  await bootstrap(dir);
  const fresh = await briefing({ dir, catalog });
  assert.equal(fresh.unreviewed.length, 34);
  const out = await output(dir);
  assert.match(out, /NOT compliant yet/);
  assert.match(out, /NON_COMPLIANT \(exit 1\)/, "a fresh project lands on findings first, and init must say so");
  assert.ok(!/expect NOT_EVALUATED \(exit 4\)/.test(out));
  assert.match(out, /34 of 34 prohibitions have no recorded human review/);
  assert.match(out, /init does not compute the verdict/);

  await writeFile(
    path.join(dir, "project-policy.yml"),
    'standardVersion: "1.1.1"\nattestations:\n  health.no-catastrophizing:\n    status: approved\napplicability:\n  nutrition.no-crash-dieting:\n    status: not-applicable\n',
  );
  const partial = await briefing({ dir, catalog });
  assert.equal(partial.unreviewed.length, 32);
  assert.ok(!partial.unreviewed.some((r) => r.id === "health.no-catastrophizing" || r.id === "nutrition.no-crash-dieting"));

  await writeFile(
    path.join(dir, "project-policy.yml"),
    'standardVersion: "1.1.1"\nattestations:\n  health.no-catastrophizing:\n    status: approved\n    expires: "2000-01-01"\n  nutrition.no-crash-dieting:\n    status: rejected\n',
  );
  const lapsed = await briefing({ dir, catalog });
  assert.equal(lapsed.unreviewed.length, 34, "an expired approval and a rejected one are not reviews");

  await writeFile(path.join(dir, "project-policy.yml"), "standardVersion: [unclosed\n");
  const bad = await briefing({ dir, catalog });
  assert.equal(bad.unreadable, true);
  assert.match(await output(dir), /Initial status not established/);
  await rm(dir, { recursive: true, force: true });
});

test("(9) a re-run reconciles: it restores what is missing, never touches what differs, and never re-pins", async () => {
  const dir = await temp();
  await bootstrap(dir);
  const edited = 'standardVersion: "1.0.0"\nproject: "ours"\n';
  await writeFile(path.join(dir, "project-policy.yml"), edited);
  await rm(path.join(dir, "AGENTS.md"));
  await rm(path.join(dir, ".github/workflows/standards.yml"));

  const result = cli(dir);
  assert.equal(result.status, 1, "a differing file is reported with exit 1");
  assert.equal(await readFile(path.join(dir, "project-policy.yml"), "utf8"), edited, "the policy is untouched");
  assert.ok(existsSync(path.join(dir, "AGENTS.md")), "the missing file was restored despite the conflict");
  assert.ok(existsSync(path.join(dir, ".github/workflows/standards.yml")));
  assert.match(result.stdout, /left exactly as they are/);
  assert.match(result.stdout, /declares 1\.0\.0; this pack is /);

  const converged = await temp();
  await bootstrap(converged);
  assert.equal(cli(converged).status, 0, "a converged project exits 0");
  await rm(dir, { recursive: true, force: true });
  await rm(converged, { recursive: true, force: true });
});

test("the CLI dry run writes nothing and prints the briefing", async () => {
  const dir = await temp();
  const result = cli(dir, "--dry-run");
  assert.equal(result.status, 0);
  assert.deepEqual(await readdir(dir), []);
  assert.match(result.stdout, /Prohibitions that bind before any implementation \(34/);
  await rm(dir, { recursive: true, force: true });
});

test("a dry run and the real run print the same briefing", async () => {
  const dry = await temp();
  const real = await temp();
  const strip = (s) => s.split("\n").filter((l) => l.trim() !== "" && !/would|created|Dry run|Mode:|Evidence:/.test(l)).join("\n");
  const a = cli(dry, "--dry-run").stdout;
  const b = cli(real).stdout;
  assert.match(a, /58 of 59 rules are not mentioned/);
  assert.match(b, /58 of 59 rules are not mentioned/);
  assert.equal(strip(a), strip(b));
  await rm(dry, { recursive: true, force: true });
  await rm(real, { recursive: true, force: true });
});

test("--force-overwrite replaces exactly the named path and no other", async () => {
  const dir = await temp();
  await writeFile(path.join(dir, "PROJECT.md"), "# mine\n");
  await writeFile(path.join(dir, "AGENTS.md"), "# also mine\n");
  const result = cli(dir, "--force-overwrite=PROJECT.md");
  assert.equal(result.status, 1, "AGENTS.md is still a conflict");
  assert.notEqual(await readFile(path.join(dir, "PROJECT.md"), "utf8"), "# mine\n");
  assert.equal(await readFile(path.join(dir, "AGENTS.md"), "utf8"), "# also mine\n");
  await rm(dir, { recursive: true, force: true });
});

test("a policy template with no pin line is refused rather than shipping a stale pin", async () => {
  const dir = await temp();
  const templates = await temp();
  await writeFile(path.join(templates, "project-policy.yml"), "# Project policy\nproject: x\n");
  await assert.rejects(plan({ dir, templatesDir: templates }), /no standardVersion line/);
  await rm(dir, { recursive: true, force: true });
  await rm(templates, { recursive: true, force: true });
});
