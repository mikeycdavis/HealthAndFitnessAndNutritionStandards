/**
 * The cryptographic half of ST-12, tested with real keys and real signatures.
 *
 * WRITTEN BEFORE THE VERIFIER EXISTS. `test/pack-origin.test.mjs` records that its tests came after
 * its module and mutation-proves them to compensate; this file is the ordinary discipline restored.
 * Every test here failed first against an absent `scripts/ssh-tag-verifier.mjs`.
 *
 * Nothing is stubbed. Each test generates ed25519 keypairs with `ssh-keygen`, signs real tag objects
 * in real repositories, and verifies them. A fake verifier can be made to say anything, which is
 * exactly what the falsifier below is about, so the falsifier may not use one.
 *
 * THE FALSIFIER, in the owner's words: copy the entire repository, replace its trust configuration
 * with an attacker-controlled public key, create a correctly signed release using the attacker's
 * matching private key, and prove verification still rejects it because the authoritative trust
 * anchor came from outside the fork. The fork here is competent — it signs correctly, its signature
 * verifies against its own key, and its in-repo trust file names that key. `the fork's own anchor
 * would accept it` asserts that positively, so this suite cannot pass by the fork being incompetent.
 *
 * WHY NOT `git verify-tag`. Git resolves the SSH allowed-signers file through
 * `gpg.ssh.allowedSignersFile`, which is configuration the evaluated repository controls. Verifying
 * that way would let the pack under evaluation nominate the file that decides whether to believe it —
 * the in-pack anchor arriving through a side door, and the exact defect ADR 0010 forbids. So the tag
 * object is read, the signature is separated here, and the allowed-signers file is written from the
 * operator's anchor into a directory the evaluated repository has no access to. `git config cannot
 * nominate the file that decides the answer` is the test that holds that line.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { ORIGIN, ORIGIN_REASON, packOrigin } from "../scripts/pack-origin.mjs";
import { readSignedTag, sshTagVerifier } from "../scripts/ssh-tag-verifier.mjs";

const run = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf8" });

/** An ed25519 keypair in `dir`, plus the fingerprint an operator would record in their trust store. */
async function keypair(dir, name) {
  const key = path.join(dir, name);
  const r = run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", name, "-f", key]);
  assert.equal(r.status, 0, `ssh-keygen failed: ${r.stderr}`);
  const publicKey = (await readFile(`${key}.pub`, "utf8")).trim();
  const shown = run("ssh-keygen", ["-lf", `${key}.pub`]).stdout.trim();
  return { key, publicKey, fingerprint: shown.split(/\s+/)[1], source: `test store ${name}` };
}

/** A repository with one commit and one SSH-signed annotated tag, signed by `signer`. */
async function signedRepo(dir, signer, tag = "v1.1.0") {
  await mkdir(dir, { recursive: true });
  const git = (...args) => {
    const r = run("git", args, dir);
    assert.equal(r.status, 0, `git ${args[0]} failed: ${r.stderr}`);
    return r;
  };
  git("init", "--quiet", "-b", "main");
  git("config", "user.email", "custodian@example.invalid");
  git("config", "user.name", "Release Custodian");
  git("config", "gpg.format", "ssh");
  git("config", "user.signingkey", signer.key);
  await writeFile(path.join(dir, "VERSION"), "1.1.0\n");
  git("add", "-A");
  git("commit", "--quiet", "-m", "the release");
  git("tag", "-s", tag, "-m", `release ${tag}`);
  return { dir, tag };
}

async function scratch() {
  return await mkdtemp(path.join(tmpdir(), "st12-"));
}

/** The evaluated repository's own git, exactly as the pack would be asked about itself. */
const gitIn = (dir) => (args) => run("git", ["-C", dir, ...args]);

test("a release signed by the custodian, judged against the custodian's own fingerprint, establishes origin", async () => {
  const dir = await scratch();
  try {
    const custodian = await keypair(dir, "custodian");
    const pack = path.join(dir, "pack");
    await signedRepo(pack, custodian);

    const release = readSignedTag(gitIn(pack), "v1.1.0");
    assert.equal(release.ok, true, release.detail);

    const origin = packOrigin({ anchor: custodian, release, verify: sshTagVerifier() });
    assert.equal(origin.status, ORIGIN.ESTABLISHED, `expected established, got ${origin.reason}: ${origin.detail}`);
    assert.equal(origin.trustedKey, custodian.fingerprint);
    assert.equal(origin.anchorSource, custodian.source, "and it records which store the trust came from");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("THE FALSIFIER: a fork that substitutes its own key and signs its own release is still refused", async () => {
  const dir = await scratch();
  try {
    const custodian = await keypair(dir, "custodian");
    const attacker = await keypair(dir, "attacker");

    // The fork is a complete copy that has replaced the trust configuration with its own key and
    // minted its own release under it. Nothing about it is half-done.
    const fork = path.join(dir, "fork");
    await signedRepo(fork, attacker);
    await writeFile(path.join(fork, "trusted-key.pub"), `${attacker.publicKey}\n`);

    const release = readSignedTag(gitIn(fork), "v1.1.0");
    assert.equal(release.ok, true, release.detail);

    // POSITIVE CONTROL, and the reason this test cannot pass by the fork being incompetent: judged
    // by the fork's own trust configuration, the fork's release is impeccable.
    const byItsOwnAnchor = packOrigin({ anchor: attacker, release, verify: sshTagVerifier() });
    assert.equal(byItsOwnAnchor.status, ORIGIN.ESTABLISHED, "the fork's signature is genuinely valid under its own key");

    // And the whole claim: judged by an anchor the fork does not control, it is refused. The only
    // difference between these two calls is where the trust came from.
    const byTheOperator = packOrigin({ anchor: custodian, release, verify: sshTagVerifier() });
    assert.equal(byTheOperator.status, ORIGIN.NOT_ESTABLISHED);
    assert.equal(byTheOperator.reason, ORIGIN_REASON.UNTRUSTED_SIGNER);
    assert.equal(byTheOperator.trustedKey, null);
    assert.ok(
      byTheOperator.detail.includes(attacker.fingerprint),
      "and it names the key that actually signed, so the operator can tell substitution from breakage",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("git config cannot nominate the file that decides the answer", async () => {
  // The same substitution through the side door `git verify-tag` would have left open:
  // `gpg.ssh.allowedSignersFile` is configuration the evaluated repository controls, so verifying
  // through Git would let the pack under evaluation choose who is believed about itself.
  const dir = await scratch();
  try {
    const custodian = await keypair(dir, "custodian");
    const attacker = await keypair(dir, "attacker");
    const fork = path.join(dir, "fork");
    await signedRepo(fork, attacker);

    const allowed = path.join(fork, "allowed_signers");
    await writeFile(allowed, `custodian ${attacker.publicKey}\n`);
    run("git", ["-C", fork, "config", "gpg.ssh.allowedSignersFile", allowed]);
    assert.equal(
      run("git", ["-C", fork, "verify-tag", "v1.1.0"]).status,
      0,
      "precondition: Git itself is satisfied by the fork's own configuration",
    );

    const origin = packOrigin({
      anchor: custodian,
      release: readSignedTag(gitIn(fork), "v1.1.0"),
      verify: sshTagVerifier(),
    });
    assert.equal(origin.status, ORIGIN.NOT_ESTABLISHED, "and this is why verification does not go through Git");
    assert.equal(origin.reason, ORIGIN_REASON.UNTRUSTED_SIGNER);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("an unsigned release is unavailable rather than invalid, because nobody did anything wrong", async () => {
  const dir = await scratch();
  try {
    const custodian = await keypair(dir, "custodian");
    const pack = path.join(dir, "pack");
    await signedRepo(pack, custodian);
    run("git", ["-C", pack, "tag", "-a", "v1.2.0", "-m", "unsigned release"]);

    const release = readSignedTag(gitIn(pack), "v1.2.0");
    assert.equal(release.ok, false);
    assert.equal(release.signature, undefined);

    const origin = packOrigin({ anchor: custodian, release, verify: sshTagVerifier() });
    assert.equal(origin.reason, ORIGIN_REASON.RELEASE_UNAVAILABLE);

    // The distinction this repository keeps everywhere else: absent evidence is not refuted
    // evidence. An unsigned tag reaches the same NOT_ESTABLISHED, by a different road, and the
    // operator is owed the difference between "nobody signed this" and "somebody signed it badly".
    const missing = readSignedTag(gitIn(pack), "v9.9.9");
    assert.equal(missing.ok, false);
    assert.match(missing.detail, /v9\.9\.9/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a signature that does not match the release it is presented with is invalid, not untrusted", async () => {
  const dir = await scratch();
  try {
    const custodian = await keypair(dir, "custodian");
    const pack = path.join(dir, "pack");
    await signedRepo(pack, custodian);
    const genuine = readSignedTag(gitIn(pack), "v1.1.0");

    // The custodian's real signature, presented over a payload it was not made for. Nothing about
    // the key is wrong; the object is.
    const tampered = { ...genuine, payload: genuine.payload.replace("release v1.1.0", "release v9.9.9") };
    const origin = packOrigin({ anchor: custodian, release: tampered, verify: sshTagVerifier() });
    assert.equal(origin.status, ORIGIN.NOT_ESTABLISHED);
    assert.equal(origin.reason, ORIGIN_REASON.INVALID_SIGNATURE);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
