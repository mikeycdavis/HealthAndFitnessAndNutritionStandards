/**
 * Conformance vectors for `docs/design/external-verifier-contract.md`.
 *
 * The host below is implemented FROM THAT DOCUMENT AND NOTHING ELSE. It deliberately does not import
 * `scripts/pack-origin.mjs` or `scripts/ssh-tag-verifier.mjs`: a conformance test that reuses the
 * reference implementation proves only that the reference implementation agrees with itself, and the
 * question here is whether the contract is implementable by somebody who does not trust this
 * repository. If StandardsEnforcer's implementation and this one disagree, one of them has departed
 * from the specification, and the specification is the thing this repository owns.
 *
 * Both vectors are required, and neither is sufficient:
 *
 *   ADVERSARIAL      a hostile fork with a patched judge, a patched verifier, malicious Git
 *                    configuration, its own validly signed tag, and its own in-pack key files, is
 *                    rejected — and no code from it is imported or executed.
 *   POSITIVE CONTROL the same host, same external key, same mechanism, accepts a genuine signed
 *                    release and materialises the exact authenticated tree.
 *
 * Without the second, rejection could be a mechanism incapable of accepting anything. Without the
 * first, acceptance could depend on the pack's cooperation. Together they say the answer tracks the
 * signature rather than the situation.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });

/**
 * THE TRUSTED HOST. Six steps, in the contract's order, using only host-owned tools: `git` as a
 * reader of objects and `ssh-keygen` as a verifier. It never runs a script, hook, or helper the
 * evaluated repository names — every git invocation disables the two configuration surfaces through
 * which an evaluated repository could nominate code to run.
 *
 * Returns a `CanonicalPack` on success, or `{ ok: false, reason }`. There is no third outcome and no
 * warning: everything the contract lists as a failure fails closed.
 */
function establishCanonicalPack({ trustedPublicKey, trustedKeySource, packDir, release, workspace }) {
  // Configuration the evaluated repository must not be able to turn into execution. `core.hooksPath`
  // and `core.sshCommand` are the two that run programs; pointing them at nothing is cheaper than
  // auditing what a fork put in them.
  const git = (args, cwd = packDir) =>
    run("git", ["-c", "core.hooksPath=/nonexistent", "-c", "core.sshCommand=/nonexistent", "-C", cwd, ...args]);
  const fail = (reason, detail) => ({ ok: false, reason, detail });

  // 1. ACQUIRE TRUST INDEPENDENTLY. The key arrives as a value. The fingerprint is derived here from
  //    that value — never read from the pack, never accepted because pack code reported it.
  const keyFile = path.join(workspace, "trusted.pub");
  const allowedSigners = path.join(workspace, "allowed_signers");
  writeFileSync(keyFile, `${trustedPublicKey.trim()}\n`, "utf8");
  writeFileSync(allowedSigners, `custodian ${trustedPublicKey.trim()}\n`, "utf8");
  const shown = run("ssh-keygen", ["-lf", keyFile]);
  if (shown.status !== 0) return fail("trust-anchor-absent", "the supplied public key could not be read");
  const trustedFingerprint = shown.stdout.trim().split(/\s+/)[1];

  // 2. RESOLVE THE REQUESTED RELEASE ITSELF, by reading objects — not by asking the pack.
  const ref = `refs/tags/${release}`;
  if (git(["cat-file", "-t", ref]).stdout.trim() !== "tag") {
    return fail("release-unavailable", `${ref} is absent or is not an annotated tag`);
  }
  const object = git(["cat-file", "tag", release]);
  if (object.status !== 0) return fail("release-unavailable", `${ref} could not be read`);
  const BEGIN = "-----BEGIN SSH SIGNATURE-----";
  const END = "-----END SSH SIGNATURE-----";
  const from = object.stdout.indexOf(BEGIN);
  const to = object.stdout.indexOf(END);
  if (from === -1 || to === -1) return fail("release-unavailable", `${ref} carries no signature`);

  // 3. VERIFY AUTHORIZATION ITSELF, against the allowed-signers file written above from the key the
  //    host was given. `git verify-tag` is not used: it resolves that file through
  //    gpg.ssh.allowedSignersFile, which the evaluated repository controls.
  const signatureFile = path.join(workspace, "release.sig");
  writeFileSync(signatureFile, `${object.stdout.slice(from, to + END.length).trimEnd()}\n`, "utf8");
  const payload = object.stdout.slice(0, from);
  const sound = run("ssh-keygen", ["-Y", "check-novalidate", "-n", "git", "-s", signatureFile], { input: payload });
  if (sound.status !== 0) return fail("invalid-signature", "the signature is not cryptographically sound");
  const verified = run(
    "ssh-keygen",
    ["-Y", "verify", "-f", allowedSigners, "-I", "custodian", "-n", "git", "-s", signatureFile],
    { input: payload },
  );
  if (verified.status !== 0) {
    const signer = /(SHA256:[A-Za-z0-9+/=]+)/.exec(`${sound.stderr}${sound.stdout}`)?.[1] ?? "an unidentified key";
    return fail("untrusted-signer", `signed by ${signer}, which is not the trusted key`);
  }

  // 4. RESOLVE THE SIGNED OBJECT from the tag just authenticated. The pack does not get to say which
  //    object its signature meant.
  // `cwd` is a real parameter and not decoration: this helper is used against two repositories, and
  // an earlier version silently resolved every revision in the pack — which made step 5 compare the
  // authorised tree against the pack's own branch tip instead of against the materialised bytes.
  const oid = (rev, cwd = packDir) => {
    const r = git(["rev-parse", "--verify", rev], cwd);
    return r.status === 0 ? r.stdout.trim() : null;
  };
  const tagOid = oid(ref);
  const commitOid = oid(`${ref}^{commit}`);
  const treeOid = oid(`${ref}^{tree}`);
  if (!tagOid || !commitOid || !treeOid) return fail("release-unavailable", "the authorised objects do not resolve");

  // 5. MATERIALISE AND BIND. A fresh checkout of the authenticated COMMIT — not the branch that
  //    happens to be checked out — and then a proof that what is on disk is that object. Verifying a
  //    tag and then evaluating some other worktree is not origin verification.
  const materialRoot = path.join(workspace, "material");
  const cloned = run("git", [
    "-c", "core.hooksPath=/nonexistent",
    "-c", "core.sshCommand=/nonexistent",
    "clone", "--quiet", "--no-checkout", "--no-hardlinks", packDir, materialRoot,
  ]);
  if (cloned.status !== 0) return fail("release-unavailable", "the authorised material could not be materialised");
  if (git(["checkout", "--quiet", "--detach", commitOid], materialRoot).status !== 0) {
    return fail("release-unavailable", "the authorised commit could not be checked out");
  }
  const boundCommit = oid("HEAD", materialRoot);
  const boundTree = oid("HEAD^{tree}", materialRoot);
  const dirty = git(["status", "--porcelain"], materialRoot).stdout.trim();
  if (boundCommit !== commitOid || boundTree !== treeOid || dirty !== "") {
    return fail("material-mismatch", "the materialised bytes are not the authorised object");
  }

  // 6. ONLY THEN may pack code run, against this material and no other.
  return {
    ok: true,
    standard: "health-fitness-nutrition",
    release,
    tagOid,
    commitOid,
    treeOid,
    signerFingerprint: trustedFingerprint,
    trustedKeySource,
    materialRoot,
  };
}

async function keypair(dir, name) {
  const key = path.join(dir, name);
  assert.equal(run("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", name, "-f", key]).status, 0);
  return {
    key,
    publicKey: (await readFile(`${key}.pub`, "utf8")).trim(),
    fingerprint: run("ssh-keygen", ["-lf", `${key}.pub`]).stdout.trim().split(/\s+/)[1],
  };
}

async function repoSignedBy(dir, signer, { release = "v1.1.0", extra = async () => {} } = {}) {
  await mkdir(dir, { recursive: true });
  const git = (...args) => {
    const r = run("git", args, { cwd: dir });
    assert.equal(r.status, 0, `git ${args[0]}: ${r.stderr}`);
  };
  git("init", "--quiet", "-b", "main");
  git("config", "user.email", "nobody@example.invalid");
  git("config", "user.name", "Somebody");
  git("config", "gpg.format", "ssh");
  git("config", "user.signingkey", signer.key);
  await writeFile(path.join(dir, "VERSION"), "1.1.0\n");
  await extra(dir, git);
  git("add", "-A");
  git("commit", "--quiet", "-m", "the release");
  git("tag", "-s", release, "-m", `release ${release}`);

  // Work continues after the release, so the branch tip is NOT the authorised commit. This is what
  // makes step 5 load-bearing rather than decorative: a host that verifies the tag and then
  // materialises "the checkout that happens to be there" gets these bytes, which nobody signed.
  await writeFile(path.join(dir, "VERSION"), "1.2.0-dev\n");
  git("add", "-A");
  git("commit", "--quiet", "-m", "development continues");
  return dir;
}

test("ADVERSARIAL: a hostile fork is rejected, and none of its code is imported or executed", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "host-conformance-"));
  try {
    const custodian = await keypair(dir, "custodian");
    const attacker = await keypair(dir, "attacker");
    const canary = path.join(dir, "the-fork-ran-something");

    const fork = await repoSignedBy(path.join(dir, "fork"), attacker, {
      extra: async (root, git) => {
        // Everything a fork gets to control: the judge, the verifier, its own trust files, and
        // configuration nominating both a helper and an allowed-signers file naming its own key.
        await cp(path.join(REPO, "scripts"), path.join(root, "scripts"), { recursive: true });
        await writeFile(
          path.join(root, "scripts", "pack-origin.mjs"),
          `export const ORIGIN = { ESTABLISHED: "ESTABLISHED" };\n` +
            `export function packOrigin() { return { status: "ESTABLISHED", trustedKey: "whatever you like" }; }\n` +
            `export function assertCanonicalOrigin(o) { return o; }\n`,
          "utf8",
        );
        await writeFile(
          path.join(root, "scripts", "ssh-tag-verifier.mjs"),
          `export const readSignedTag = () => ({ ok: true, tag: "v1.1.0", payload: "", signature: "x" });\n` +
            `export const sshTagVerifier = () => () => ({ valid: true, fingerprint: "SHA256:whatever" });\n`,
          "utf8",
        );
        await writeFile(path.join(root, "trusted-key.pub"), `${attacker.publicKey}\n`);
        await writeFile(path.join(root, "allowed_signers"), `custodian ${attacker.publicKey}\n`);

        const hooks = path.join(root, "hooks");
        await mkdir(hooks, { recursive: true });
        const hook = path.join(hooks, "post-checkout");
        await writeFile(hook, `#!/bin/sh\necho ran > "${canary.split(path.sep).join("/")}"\n`, { mode: 0o755 });
        git("config", "core.hooksPath", hooks);
        git("config", "gpg.ssh.allowedSignersFile", path.join(root, "allowed_signers"));
      },
    });

    // Precondition: the fork's configuration is good enough to satisfy Git itself. A host that
    // verified through `git verify-tag` would accept this repository as canonical.
    assert.equal(run("git", ["-C", fork, "verify-tag", "v1.1.0"]).status, 0, "the fork fools git verify-tag");

    const workspace = path.join(dir, "host");
    await mkdir(workspace, { recursive: true });
    const verdict = establishCanonicalPack({
      trustedPublicKey: custodian.publicKey,
      trustedKeySource: "enforcer trust configuration (test)",
      packDir: fork,
      release: "v1.1.0",
      workspace,
    });

    assert.equal(verdict.ok, false, "the fork must not be canonical");
    assert.equal(verdict.reason, "untrusted-signer");
    assert.ok(!existsSync(canary), "no code the fork nominated may have run");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("POSITIVE CONTROL: the same host accepts a genuine release and binds the authenticated tree", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "host-conformance-ok-"));
  try {
    const custodian = await keypair(dir, "custodian");
    const pack = await repoSignedBy(path.join(dir, "pack"), custodian);

    const workspace = path.join(dir, "host");
    await mkdir(workspace, { recursive: true });
    const canonical = establishCanonicalPack({
      trustedPublicKey: custodian.publicKey,
      trustedKeySource: "enforcer trust configuration (test)",
      packDir: pack,
      release: "v1.1.0",
      workspace,
    });

    assert.equal(canonical.ok, true, `expected acceptance, got ${canonical.reason}: ${canonical.detail}`);
    assert.equal(canonical.signerFingerprint, custodian.fingerprint);
    assert.equal(canonical.release, "v1.1.0");

    // The binding, checked rather than asserted: the material the host would evaluate is the tree the
    // signature authorised, and it is a detached checkout of the authenticated commit rather than
    // whatever branch the repository happened to be on.
    const tree = run("git", ["-C", canonical.materialRoot, "rev-parse", "HEAD^{tree}"]).stdout.trim();
    assert.equal(tree, canonical.treeOid, "the materialised bytes are the authorised tree");
    assert.equal(run("git", ["-C", canonical.materialRoot, "status", "--porcelain"]).stdout.trim(), "");
    assert.equal(
      run("git", ["-C", canonical.materialRoot, "symbolic-ref", "-q", "HEAD"]).status !== 0,
      true,
      "and HEAD is detached, so no moving reference can change what was verified",
    );
    assert.equal((await readFile(path.join(canonical.materialRoot, "VERSION"), "utf8")).trim(), "1.1.0");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the conformance host imports nothing from this pack's origin machinery", async () => {
  // The property that makes these vectors worth anything: they are a second implementation. If this
  // file ever imports the reference modules, the adversarial vector starts proving that the reference
  // implementation agrees with itself, which is not the claim.
  const source = await readFile(fileURLToPath(import.meta.url), "utf8");
  const imports = source.match(/^import .*$/gm) ?? [];
  assert.ok(
    !imports.some((line) => /pack-origin|ssh-tag-verifier/.test(line)),
    "the host must be implemented from the contract, not from the code it is meant to check",
  );
});
