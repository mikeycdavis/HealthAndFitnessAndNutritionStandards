/**
 * WHO IS RUNNING THE VERIFIER — the question ST-12's cryptography does not answer.
 *
 * `test/ssh-tag-verification.test.mjs` proves that a fork substituting its own signing key is refused
 * when the anchor comes from outside. That is true and it is not enough, because it assumes the fork
 * runs the verifier honestly. A hostile fork has no such obligation: `scripts/pack-origin.mjs` and
 * `scripts/ssh-tag-verifier.mjs` live inside the pack whose origin they authenticate, so a fork
 * replaces them along with everything else and has its own copy report ESTABLISHED without going near
 * `ssh-keygen`. The externally supplied key does not prevent that. The key is external; the code
 * interpreting the evidence was not.
 *
 * THE FALSIFIER, in the owner's words: a full fork modifies the in-pack origin/verifier
 * implementation to always report ESTABLISHED, signs its own release, and is given the real
 * operator-controlled public key. A trusted consumer must still reject it.
 *
 * WHAT THIS TEST MAKES OBSERVABLE, and it is the whole point: the security-relevant variable is
 * WHICH COPY OF THE CODE RAN. The same question, the same tag, the same anchor, answered twice —
 * once by the module loaded out of the evaluated pack, once by the module the host already had. The
 * first says ESTABLISHED and is lying. No amount of cryptography inside the first answer changes it,
 * because the attacker chose which cryptography ran.
 *
 * HONEST ABOUT WHAT KIND OF TEST THIS IS. It did not fail against the implementation before it was
 * written, because there is no code change here that would make it pass: the finding is
 * architectural, and the remedy — the authoritative verifier living outside the evaluated pack — is
 * a boundary rather than a patch (ADR 0011). What it guards is the regression that would erase the
 * boundary: any future edit that has the host resolve its verifier, its anchor, or its trust rule
 * FROM the directory under evaluation turns the second answer into the first, and this test goes red.
 * It is also the executable form of the claim ST-12 is now allowed to make, which is narrower than
 * the claim the SSH mechanism looked like it supported.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ORIGIN, ORIGIN_REASON, packOrigin } from "../scripts/pack-origin.mjs";
import { readSignedTag, sshTagVerifier } from "../scripts/ssh-tag-verifier.mjs";

// fileURLToPath, not `new URL(...).pathname` — the latter yields `/work/test/...` on Linux and
// `/F:/Repos/...` on Windows, and the `.slice(1)` that makes the second right makes the first a
// relative path. Caught by the container, which is the reason the container is the gate.
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf8" });
const gitIn = (dir) => (args) => run("git", ["-C", dir, ...args]);

async function keypair(dir, name) {
  const key = path.join(dir, name);
  assert.equal(run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", name, "-f", key]).status, 0);
  const publicKey = (await readFile(`${key}.pub`, "utf8")).trim();
  const fingerprint = run("ssh-keygen", ["-lf", `${key}.pub`]).stdout.trim().split(/\s+/)[1];
  return { key, publicKey, fingerprint, source: `operator trust store (${name})` };
}

/** A complete fork of this pack: every script, a release signed by its own key, and a rewritten judge. */
async function hostileFork(dir, signer) {
  await mkdir(dir, { recursive: true });
  await cp(path.join(REPO, "scripts"), path.join(dir, "scripts"), { recursive: true });

  const git = (...args) => {
    const r = run("git", args, dir);
    assert.equal(r.status, 0, `git ${args[0]}: ${r.stderr}`);
    return r;
  };
  git("init", "--quiet", "-b", "main");
  git("config", "user.email", "fork@example.invalid");
  git("config", "user.name", "A Determined Fork");
  git("config", "gpg.format", "ssh");
  git("config", "user.signingkey", signer.key);
  git("add", "-A");
  git("commit", "--quiet", "-m", "the whole pack, and then some");
  git("tag", "-s", "v1.1.0", "-m", "release v1.1.0");

  // The modification. Not subtle, and it does not need to be: the fork owns this file.
  const judge = path.join(dir, "scripts", "pack-origin.mjs");
  const original = await readFile(judge, "utf8");
  await writeFile(
    judge,
    `${original}\nexport function packOriginHostile() {}\n`.replace(
      /export function packOrigin\(\{ anchor, release, verify \} = \{\}\) \{/,
      `export function packOrigin({ anchor, release, verify } = {}) {\n  return { status: "ESTABLISHED", reason: null, detail: null, trustedKey: anchor?.fingerprint ?? "SHA256:whatever-you-like", anchorSource: anchor?.source ?? null, release: { version: "1.1.0", tag: "v1.1.0" } };`,
    ),
    "utf8",
  );
  return dir;
}

test("a fork that rewrites the judge convicts nobody: the in-pack answer is worthless", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "st12-boundary-"));
  try {
    const custodian = await keypair(dir, "custodian");
    const attacker = await keypair(dir, "attacker");
    const fork = await hostileFork(path.join(dir, "fork"), attacker);

    const release = readSignedTag(gitIn(fork), "v1.1.0");
    assert.equal(release.ok, true, "the fork's release is a real signed tag");

    // ANSWER ONE — the module loaded out of the evaluated pack, handed the operator's genuine key.
    // It reports ESTABLISHED without verifying anything, and the anchor being real changes nothing.
    const { packOrigin: packOriginFromTheFork } = await import(
      pathToFileURL(path.join(fork, "scripts", "pack-origin.mjs")).href
    );
    const asTheForkTellsIt = packOriginFromTheFork({ anchor: custodian, release, verify: sshTagVerifier() });
    assert.equal(
      asTheForkTellsIt.status,
      ORIGIN.ESTABLISHED,
      "precondition: code the attacker controls says whatever the attacker wants",
    );
    assert.equal(asTheForkTellsIt.trustedKey, custodian.fingerprint, "and it names the real key while doing it");

    // ANSWER TWO — the same question, put to the verifier the host already had. Nothing the fork
    // wrote is executed, and the release is refused on the only fact it could not forge.
    const asTheHostFindsIt = packOrigin({ anchor: custodian, release, verify: sshTagVerifier() });
    assert.equal(asTheHostFindsIt.status, ORIGIN.NOT_ESTABLISHED);
    assert.equal(asTheHostFindsIt.reason, ORIGIN_REASON.UNTRUSTED_SIGNER);

    // The two answers disagree about the same bytes. Which one an operator gets is decided entirely
    // by where the code came from, which is what ADR 0011 moves out of the pack's reach.
    assert.notEqual(asTheForkTellsIt.status, asTheHostFindsIt.status);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("no private signing material is committed to this repository", async () => {
  // `docs/release-signing.md` step 1 says the custodian's private key is never committed. Said in a
  // document, that is a promise; here it is a guard. The check is deliberately cheap and total — every
  // tracked file, not a curated list of likely names — because the way this goes wrong is somebody
  // adding a key under a name nobody thought to enumerate.
  const tracked = run("git", ["-C", REPO, "ls-files"]).stdout.split("\n").filter(Boolean);
  assert.ok(tracked.length > 100, "precondition: the file list is real");

  const PRIVATE = /-----BEGIN (OPENSSH|RSA|EC|DSA|PGP) PRIVATE KEY( BLOCK)?-----/;
  const offenders = [];
  for (const file of tracked) {
    if (/\.(png|jpg|jpeg|gif|ico|pdf|zip|gz)$/i.test(file)) continue;
    const contents = await readFile(path.join(REPO, file), "utf8").catch(() => "");
    if (PRIVATE.test(contents)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], "private key material must never be committed");
});

test("no origin claim in this repository is made by code the evaluated pack could supply", async () => {
  // The regression guard with teeth. `standards maintain` and `check` must not import an origin
  // verifier, an anchor, or a trust rule from the directory they are evaluating — that is precisely
  // the substitution above, arriving as a refactor. Today they import origin machinery not at all,
  // which is why ADR 0011 defers the envelope: a field in `maintain`'s output would be an origin
  // claim made by the pack about itself, in the one place a consumer is most likely to read it.
  const cli = await readFile(path.join(REPO, "scripts", "standards.mjs"), "utf8");
  assert.ok(
    !/pack-origin|ssh-tag-verifier/.test(cli),
    "the CLI must not make origin claims from inside the pack; see ADR 0011 before wiring these in",
  );
});
