/**
 * The JSON output contract, and the number that is supposed to identify it.
 *
 * `CHANGELOG.md` states the rule in a table, in the repository's own words: the output schema
 * version is `schemaVersion` in JSON output, and it changes when **the output format changes**.
 *
 * FE-13 changed the output format three ways and moved nothing:
 *
 *   - every successful verdict gained `releaseIdentity`;
 *   - `check` gained a refusal envelope, with `status` values and a shape no 1.0 consumer had seen;
 *   - `maintain` introduced a third envelope, with `workingTreeStatus` beside a `status` that is
 *     deliberately not a verdict.
 *
 * All of them still announced `"1.0"`. A consumer pinned to 1.0 was therefore promised a format it
 * was no longer being sent, which is the same class of defect as the rest of this feature — a label
 * that outlived the thing it named — arriving on the field whose entire job is to name the format.
 *
 * WHY ONE NUMBER ACROSS ALL FOUR ENVELOPES rather than a version per envelope. A consumer asks one
 * question, "which contract does this build emit", and a single answer is checkable; four numbers
 * drifting independently is four contracts nobody tracks. So the audit envelope's version moves too,
 * although its own shape did not change: it reports the contract it belongs to, not a changelog of
 * itself.
 *
 * MUTATIONS RUN AGAINST THESE, from a committed baseline. `moved` and `same` are the two falsifiers
 * below; `one place` is the drift guard at the end of the file.
 *
 *   mutation                                          moved  same  one place
 *   SCHEMA_VERSION reverted to "1.0"                   x      ok    ok
 *   one envelope spells a version literal instead      ok     x     x
 *
 * The second fires two assertions rather than one, which is the same defect seen from two angles: a
 * literal both disagrees with the constant and puts the version in a second place. Neither mutation
 * leaves this file green.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCHEMA_VERSION, envelope } from "../scripts/compliance.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(REPO, "scripts", "standards.mjs");

/** The version that predates `releaseIdentity`. Named so the assertion below reads as what it means. */
const BEFORE_RELEASE_IDENTITY = "1.0";

function run(args) {
  const r = spawnSync(process.execPath, [CLI, ...args, "--json"], { encoding: "utf8" });
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* the assertions report which happened */
  }
  return { exit: r.status, json, stderr: r.stderr };
}

async function adopter() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-contract-adopter-"));
  await writeFile(
    path.join(dir, "project-policy.yml"),
    ['standardVersion: "1.0.0"', 'project: "ContractAdopter"', "rules: {}", ""].join("\n"),
  );
  return dir;
}

test("FALSIFIER: the output contract version moved when the output format changed", () => {
  assert.notEqual(
    SCHEMA_VERSION,
    BEFORE_RELEASE_IDENTITY,
    "releaseIdentity, the refusal envelope, and the maintain envelope are all format changes; " +
      "CHANGELOG.md says schemaVersion changes when the output format changes",
  );
});

test("FALSIFIER: every envelope the CLI emits reports the same contract version", async () => {
  const project = await adopter();
  try {
    // A verdict envelope. It is built directly rather than provoked, because reaching one through
    // the CLI needs a pack that can verify itself against its own release, and this working tree is
    // ahead of the tag it publishes by construction.
    assert.equal(envelope({ verdict: { status: "NOT_EVALUATED", results: [] } }).schemaVersion, SCHEMA_VERSION);

    const audit = run(["audit", `--dir=${project}`]);
    assert.equal(audit.json?.schemaVersion, SCHEMA_VERSION, "audit envelope");

    const refusal = run(["check", `--dir=${project}`]);
    assert.equal(refusal.exit, 5, `the fixture must provoke a refusal: ${refusal.stderr}`);
    assert.equal(refusal.json?.schemaVersion, SCHEMA_VERSION, "refusal envelope");

    const self = run(["maintain", `--dir=${REPO}`]);
    assert.equal(self.exit, 0, `the pack must maintain itself: ${self.stderr}`);
    assert.equal(self.json?.schemaVersion, SCHEMA_VERSION, "maintain envelope");
    assert.equal(self.json?.status, "SELF_MAINTENANCE");
  } finally {
    await rm(project, { recursive: true, force: true });
  }
});

test("the version lives in one place, so the envelopes cannot drift apart quietly", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const rel of ["scripts/standards.mjs", "scripts/compliance.mjs"]) {
    const source = await readFile(path.join(REPO, rel), "utf8");
    assert.doesNotMatch(
      source,
      /schemaVersion:\s*"/,
      `${rel} must reference SCHEMA_VERSION rather than spelling a version literal into an envelope`,
    );
  }
});
