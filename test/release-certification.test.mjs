/**
 * R2's own refusals — the release-certification script, tested where it decides.
 *
 * WHY THIS FILE EXISTS. `ci/certify-release.mjs` runs once, by hand, at the one moment in a release
 * where being wrong is least recoverable: after signing and before pushing. Everything it decides is
 * therefore decided by code nobody has watched fail. This file watches it fail.
 *
 * WHAT IT GUARDS, AND THE FINDING THAT PROMPTED IT. Independent review of PR #8 found that a run
 * which could not reach `origin` recorded the unpushed precondition as `unknown` and then went on to
 * print `R2 PASSED` and exit 0. Offline, or with expired credentials, the script would authorise a
 * push without ever establishing that the tag was unpublished — and would certify an already-public
 * tag with equal confidence.
 *
 * That is this repository's own distinction, applied everywhere except here: **unavailable evidence is
 * not contradicted evidence, and neither is confirming evidence.** The same script already gets it
 * right for the signature — no trust anchor means INCOMPLETE, exit 2, never PASSED — and got it wrong
 * one check earlier. A rule obeyed in one branch and forgotten in the next is exactly what a test is
 * for; the reasoning that produced the first branch plainly did not produce the second.
 *
 * MUTATIONS RUN, recorded as observed:
 *
 *   mutation                                                            unqueryable  published  usage
 *   ------------------------------------------------------------------ ------------ ---------- -----
 *   C1  an unqueryable origin is treated as "no" rather than unknown    red          ok         ok
 *   C2  the `publishedAtR2 === "YES"` refusal is removed                ok           red        ok
 *   C3  the semver guard accepts any argument                           ok           ok         red
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MATERIAL } from "../scripts/release-material.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * A pack with a real annotated tag and an `origin` the caller chooses. Self-contained for the same
 * reason `test/helpers/scratch-release.mjs` is: a fixture that borrows the host repository's remote
 * would be testing the developer's network, and would answer differently on a machine that had one.
 */
async function packWithOrigin(originUrl) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-r2-fixture-"));
  for (const entry of MATERIAL) {
    await mkdir(path.dirname(path.join(dir, entry)), { recursive: true });
    await cp(path.join(REPO, entry), path.join(dir, entry), { recursive: true });
  }
  // `.gitattributes` is not in MATERIAL and the fixture needs it anyway: R2 CLONES and CHECKS OUT,
  // so without `eol=lf` a Windows checkout under core.autocrlf rewrites every line ending and the
  // material comparison fails for a reason that has nothing to do with the release. Caught when this
  // control went red with `material-differs` on an unmodified fixture. A real release carries it.
  await cp(path.join(REPO, ".gitattributes"), path.join(dir, ".gitattributes"));
  await mkdir(path.join(dir, "ci"), { recursive: true });
  await cp(path.join(REPO, "ci", "certify-release.mjs"), path.join(dir, "ci", "certify-release.mjs"));

  const git = (...args) => {
    const r = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args[0]}: ${r.stderr}`);
    return r;
  };
  git("init", "--quiet", "-b", "main");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "R2 Fixture");
  git("config", "commit.gpgsign", "false");
  git("config", "tag.gpgsign", "false");
  git("add", "-A");
  git("commit", "--quiet", "-m", "candidate");
  // THE TAG IS SIGNED, with a key made and discarded here. Without it every run below would be
  // INCOMPLETE for want of a trust anchor, and each test would pass without exercising the condition
  // it names — the failure mode ADR 0012 retired a falsifier over. Signing the fixture makes the
  // remote check the only variable, which is what these tests are about.
  const key = path.join(dir, "..", path.basename(dir) + "-key");
  assert.equal(spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "fixture", "-f", key]).status, 0);
  git("config", "gpg.format", "ssh");
  git("config", "user.signingkey", key);
  git("tag", "-s", "-a", "v1.1.0", "-m", "candidate v1.1.0");
  git("remote", "add", "origin", originUrl);
  const publicKey = (await readFile(key + ".pub", "utf8")).trim();
  return { dir, publicKey, key };
}

const certify = (dir, publicKey, args = []) =>
  spawnSync(process.execPath, [path.join(dir, "ci", "certify-release.mjs"), ...args], {
    encoding: "utf8",
    env: { ...process.env, ...(publicKey ? { HFN_TRUSTED_PUBLIC_KEY: publicKey } : {}) },
  });

test("an origin that cannot be queried makes R2 incomplete, never passed", async () => {
  // THE FINDING. The unpushed precondition is the entire reason R2 runs when it does. A run that could
  // not check it has not established it, and "could not check" must not travel as "checked and fine".
  // Everything else here is satisfiable — the tag is signed and the anchor is supplied — so the only
  // thing standing between this run and exit 0 is the unreachable remote.
  const { dir, publicKey } = await packWithOrigin(path.join(tmpdir(), "hfn-no-such-remote-ever.git"));
  try {
    const r = certify(dir, publicKey, ["v1.1.0"]);
    assert.notEqual(r.status, 0, "a run that could not establish the precondition must not authorise a push");
    assert.ok(!r.stdout.includes("R2 PASSED"), "and must not print PASSED");
    assert.match(r.stdout, /R2 INCOMPLETE/u);
    assert.match(
      r.stdout,
      /could not be queried|could not reach origin/iu,
      "the operator has to be told which fact was not established, not merely that something failed",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a tag already published on origin is refused outright", async () => {
  // Distinct from the case above, and the distinction is the point: here the evidence is available and
  // says no. That is a failure, not an incompleteness, and the exit code says so.
  const bare = await mkdtemp(path.join(tmpdir(), "hfn-origin-"));
  spawnSync("git", ["init", "--quiet", "--bare", bare], { encoding: "utf8" });
  const { dir, publicKey } = await packWithOrigin(bare);
  try {
    assert.equal(spawnSync("git", ["-C", dir, "push", "--quiet", "origin", "v1.1.0"], { encoding: "utf8" }).status, 0);
    const r = certify(dir, publicKey, ["v1.1.0"]);
    assert.equal(r.status, 1, "an established violation is a failure, not an incompleteness");
    assert.match(r.stdout, /R2 FAILED/u);
    assert.match(r.stdout, /already published/u);
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(bare, { recursive: true, force: true });
  }
});

test("POSITIVE CONTROL: reachable, unpublished, signed and anchored certifies", async () => {
  // Without this the two refusals above are satisfied by a script that refuses everything, and the
  // whole file would be evidence of nothing. This is the only configuration that may reach exit 0.
  const bare = await mkdtemp(path.join(tmpdir(), "hfn-origin-"));
  spawnSync("git", ["init", "--quiet", "--bare", bare], { encoding: "utf8" });
  const { dir, publicKey } = await packWithOrigin(bare);
  try {
    const r = certify(dir, publicKey, ["v1.1.0"]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /R2 PASSED/u);
    assert.match(r.stdout, /tag pushed at time of R2 +no/u);
    assert.match(r.stdout, /signature present on the tag +yes/u);
    assert.match(r.stdout, /local external verification result +verified/u);
    assert.match(r.stdout, /R2 result +PASS/u, "the material binding was actually exercised");
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(bare, { recursive: true, force: true });
  }
});

test("a signature by a key the anchor does not name is refused", async () => {
  // The anchor has to be doing work. A verifier that approves of whatever it is shown would pass the
  // positive control above and this one too.
  const bare = await mkdtemp(path.join(tmpdir(), "hfn-origin-"));
  spawnSync("git", ["init", "--quiet", "--bare", bare], { encoding: "utf8" });
  const { dir } = await packWithOrigin(bare);
  const other = await mkdtemp(path.join(tmpdir(), "hfn-other-key-"));
  try {
    const key = path.join(other, "attacker");
    spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", "attacker", "-f", key]);
    const attacker = (await readFile(key + ".pub", "utf8")).trim();
    const r = certify(dir, attacker, ["v1.1.0"]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /did not verify under the supplied trust anchor/u);
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(bare, { recursive: true, force: true });
    await rm(other, { recursive: true, force: true });
  }
});

test("R2 refuses an argument that is not a release version", async () => {
  const { dir, publicKey } = await packWithOrigin(path.join(tmpdir(), "unused.git"));
  try {
    for (const bad of ["main", "v1.1", "1.1.0", "v1.1.0-rc1"]) {
      assert.equal(certify(dir, publicKey, [bad]).status, 2, bad + " is not an adoptable release version");
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
