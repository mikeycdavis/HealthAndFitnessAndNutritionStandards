/**
 * FE-13 — the gate: what `check` does with release identity.
 *
 * Stages 1 to 3 have their own tests, and passing all of them would still leave the finding open.
 * Resolution, materialisation, and verification can each be perfect while `check` reaches a verdict
 * without consulting any of them; that gap is the defect, and this file is where it is closed.
 *
 * WHAT IS ASSERTED HERE, in one line each: identity is established before rules are evaluated, a
 * failure to establish it produces no verdict at all, the pack maintaining itself is a declared and
 * structurally-bounded case rather than a flag, and a shallow checkout is a named negative result
 * instead of an accident of the environment.
 *
 * THE SHALLOW TEST IS THE POINT OF THE WORKFLOW CHANGE. `actions/checkout@v4` fetches one commit and
 * no tags, so until this slice the hosted runner physically could not establish a release identity —
 * not because the check was lenient there, but because the evidence was absent. `fetch-depth: 0`
 * puts the tags on the runner; this test makes their absence a thing that is asserted rather than a
 * difference nobody noticed. Missing history is an unprovable identity, and unprovable fails closed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MATERIAL } from "../scripts/release-material.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(REPO, "scripts", "standards.mjs");

const EXIT = { OK: 0, BLOCKED: 3, UNIDENTIFIED_RELEASE: 5 };

function check(packDir, adopterDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(packDir, "scripts", "standards.mjs"), "check", `--dir=${adopterDir}`, "--json"],
    { encoding: "utf8" },
  );
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* a refusal is still JSON; a crash is not, and the assertions below should say which happened */
  }
  return { exit: r.status, json, stdout: r.stdout, stderr: r.stderr };
}

async function adopter(extraLines = []) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-gate-adopter-"));
  await writeFile(
    path.join(dir, "project-policy.yml"),
    [
      'standardVersion: "1.0.0"',
      'project: "GateAdopter"',
      "rules: {}",
      "applicability: {}",
      "exceptions: []",
      "attestations: {}",
      ...extraLines,
      "",
    ].join("\n"),
  );
  return dir;
}

/** A copy of the pack with no repository at all: the cached-copy row of FE-13's acceptance table. */
async function packWithoutGit() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-gate-pack-"));
  await cp(REPO, dir, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
  });
  return dir;
}

/**
 * A genuinely shallow checkout carrying this working tree's code.
 *
 * The clone supplies the repository state under test — one commit, no tags — and the material is
 * then copied over it so that the pack running is the one being developed rather than whatever the
 * default branch happened to hold. Cloning the branch instead would make the test depend on the
 * working tree being committed, which would turn a real refusal into an intermittent one.
 */
async function shallowPack() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-gate-shallow-"));
  const cloned = spawnSync(
    "git",
    ["clone", "--depth=1", "--quiet", `file://${REPO.split(path.sep).join("/")}`, dir],
    { encoding: "utf8" },
  );
  assert.equal(cloned.status, 0, `a shallow clone must be constructible: ${cloned.stderr}`);
  assert.equal(
    spawnSync("git", ["-C", dir, "rev-parse", "--is-shallow-repository"], { encoding: "utf8" }).stdout.trim(),
    "true",
    "the fixture must actually be shallow, or it proves nothing about a shallow runner",
  );
  for (const rel of MATERIAL) {
    await rm(path.join(dir, rel), { recursive: true, force: true });
    await cp(path.join(REPO, rel), path.join(dir, rel), { recursive: true });
  }
  return dir;
}

// ---------------------------------------------------------------------------------------------
// Fail closed
// ---------------------------------------------------------------------------------------------

test("a shallow checkout cannot establish a release identity, and says so instead of proceeding", async () => {
  const pack = await shallowPack();
  const project = await adopter();
  try {
    const { exit, json } = check(pack, project);

    assert.equal(exit, EXIT.UNIDENTIFIED_RELEASE, "missing history is not 'probably fine'");
    assert.equal(json?.status, "UNIDENTIFIED_RELEASE");
    assert.equal(json.releaseIdentity.established, false);
    assert.equal(json.releaseIdentity.stage, "resolution");
    assert.equal(json.releaseIdentity.reason, "tag-not-found");

    // The requested identity is still reported — it is what was asked for, and a refusal that could
    // not say what it refused would be unactionable.
    assert.equal(json.releaseIdentity.requestedRelease, "1.0.0");

    // And no verdict of any kind came with it.
    assert.deepEqual(json.results, []);
    assert.equal(json.standardVersion, null, "nothing evaluated it, so no version evaluated it");
    assert.equal(json.score, undefined);
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(project, { recursive: true, force: true });
  }
});

test("a pack with no repository fails closed rather than falling back to the files on disk", async () => {
  const pack = await packWithoutGit();
  const project = await adopter();
  try {
    const { exit, json } = check(pack, project);
    assert.equal(exit, EXIT.UNIDENTIFIED_RELEASE);
    assert.equal(json.releaseIdentity.reason, "no-repository");
    assert.equal(json.standardVersion, null);
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(project, { recursive: true, force: true });
  }
});

test("a pack whose material differs from the release refuses, naming the files", async () => {
  const project = await adopter();
  try {
    // The working tree of a development branch: the tag resolves, and the material is ahead of it.
    const { exit, json } = check(REPO, project);
    assert.equal(exit, EXIT.UNIDENTIFIED_RELEASE);
    assert.equal(json.releaseIdentity.stage, "verification");
    assert.equal(json.releaseIdentity.reason, "material-differs");
    assert.ok(json.releaseIdentity.differenceCount > 0);
    assert.ok(
      json.releaseIdentity.differences.every((d) => typeof d.path === "string" && d.difference),
      "a refusal has to say which files and how, or it cannot be acted on",
    );
    assert.notEqual(json.releaseIdentity.releaseDigest, json.releaseIdentity.materialDigest);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test("a version that is not a release is refused before anything is read", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-gate-dev-"));
  try {
    await writeFile(
      path.join(dir, "project-policy.yml"),
      ['standardVersion: "1.1.0-dev"', 'project: "TracksAPrerelease"', "", ].join("\n"),
    );
    const { exit, json } = check(REPO, dir);
    assert.equal(exit, EXIT.UNIDENTIFIED_RELEASE);
    assert.equal(json.releaseIdentity.reason, "not-a-release-version");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// The pack maintaining itself
// ---------------------------------------------------------------------------------------------

test("the pack evaluating itself reaches a verdict, and reports that it established no release", () => {
  const { exit, json } = check(REPO, REPO);
  assert.equal(exit, EXIT.OK, "this repository's own gate still runs");
  assert.equal(json.releaseIdentity.established, false, "self-maintenance establishes nothing");
  assert.equal(json.releaseIdentity.mode, "self-maintenance");
  assert.match(json.releaseIdentity.detail, /not an adoption/);
  assert.ok(json.results.length > 0, "and it is a real evaluation, not a refusal wearing a verdict");
});

/**
 * The exemption's boundary, and the reason it is not a waiver.
 *
 * `packSelfMaintenance` exists because a pack under development cannot prove it is a release. An
 * adopter declaring it is claiming to be the pack — which is a claim about applicability made to
 * escape a check, and Standard 42 names that directly. It stops the run at exit 3 rather than
 * degrading to a refusal, because the two are different events: one is an environment that cannot
 * prove something, the other is a policy asserting something untrue about itself.
 */
test("an adopter claiming to be the pack is blocked by the invariant, not merely unidentified", async () => {
  const project = await adopter(['packSelfMaintenance: "this-project-is-the-pack"']);
  try {
    const { exit, json } = check(REPO, project);
    assert.equal(exit, EXIT.BLOCKED, "exit 3: this is manipulation, not a missing tag");
    assert.equal(json.releaseIdentity.reason, "not-the-pack");
    assert.match(json.releaseIdentity.detail, /Standard 42/);
    assert.deepEqual(json.results, []);
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

/**
 * The mutation test for the exemption. If the structural half were dropped and the declaration alone
 * honoured, the test above would pass with the wrong exit code and this one would go quiet — so it
 * asserts the property from the other side: the declaration cannot buy a verdict anywhere but home.
 */
test("the self-maintenance declaration never yields a compliance verdict away from the pack", async () => {
  const pack = await packWithoutGit();
  const project = await adopter(['packSelfMaintenance: "this-project-is-the-pack"']);
  try {
    const { exit, json } = check(pack, project);
    assert.notEqual(exit, EXIT.OK);
    assert.deepEqual(json.results, []);
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(project, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// The envelope
// ---------------------------------------------------------------------------------------------

test("every verdict carries a releaseIdentity, so a genuine run differs by content and not by absence", () => {
  const { json } = check(REPO, REPO);
  assert.ok(Object.hasOwn(json, "releaseIdentity"), "present on the success path");
  const refused = spawnSync(process.execPath, [CLI, "check", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  assert.ok(Object.hasOwn(JSON.parse(refused.stdout), "releaseIdentity"));
});

test("the human rendering leads with which bytes produced the verdict", () => {
  const r = spawnSync(process.execPath, [CLI, "check", `--dir=${REPO}`], { encoding: "utf8" });
  assert.equal(r.status, EXIT.OK);
  assert.match(r.stdout.split("\n")[0], /^Release: /, "an identity a reader has to look for is an identity they will assume");
});

test("a refusal is rendered as a refusal, with no verdict vocabulary in it", async () => {
  const pack = await packWithoutGit();
  const project = await adopter();
  try {
    const r = spawnSync(
      process.execPath,
      [path.join(pack, "scripts", "standards.mjs"), "check", `--dir=${project}`],
      { encoding: "utf8" },
    );
    assert.equal(r.status, EXIT.UNIDENTIFIED_RELEASE);
    assert.match(r.stdout, /RELEASE IDENTITY NOT ESTABLISHED/);
    assert.match(r.stdout, /No verdict was produced/);
    assert.doesNotMatch(r.stdout, /COMPLIANT/, "no compliance word appears where there is no compliance claim");
    assert.doesNotMatch(r.stdout, /^Score:/m);
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(project, { recursive: true, force: true });
  }
});

test("the documented exit codes include the one this slice added", async () => {
  const cli = await readFile(CLI, "utf8");
  assert.match(cli, /5 release identity not established/);
});
