/**
 * A REFERENCE MECHANISM: does this release tag carry a signature, and whose?
 *
 * WHAT THIS FILE DOES AND DOES NOT ESTABLISH, first because it is the thing most easily assumed:
 * it demonstrates how an SSH-signed release is cryptographically checked against an explicitly
 * supplied public key. **Executed from the evaluated pack, it does not establish canonical pack
 * origin against a hostile fork** — a fork replaces this file, or the module that interprets its
 * result, and reports whatever it likes. Canonical origin requires a verifier whose implementation
 * is outside the evaluated pack's control
 * ([ADR 0011](../artifacts/adr/0011-canonical-origin-cannot-be-asserted-by-the-pack.md)). This is
 * what such a verifier should do, written to be read and reimplemented by the trusted host that will
 * do it — and, run here, a diagnostic.
 *
 * `scripts/pack-origin.mjs` decides what a verification RESULT means and refuses to let the pack
 * supply its own anchor. This file is the mechanism it was deliberately written without — injected
 * rather than imported by it, so the contract stayed testable while the mechanism was undecided, and
 * so a second mechanism can be added later without touching the rule.
 *
 * WHY SSH SIGNATURES, chosen against ST-12's falsifier rather than for ergonomics:
 *
 *   1. THE ANCHOR IS A VALUE, NOT AMBIENT STATE. Verification takes the operator's key as an
 *      argument and writes the allowed-signers file into a directory this process makes. GPG's
 *      answer comes from the invoking user's keyring and ownertrust database — a store that is
 *      external to the pack, which satisfies the letter of ADR 0010, but whose contents no caller
 *      passes in and whose own notion of "trusted" (ultimate, marginal, web-of-trust) is a second
 *      trust model layered under ours. One comparison against one supplied fingerprint is a claim
 *      that can be stated exactly.
 *   2. IT SIGNS THE RELEASE OBJECT. The signature is part of the annotated tag — the immutable thing
 *      ADR 0010 says authorization attaches to — rather than a detached file that would then need
 *      its own binding back to the release.
 *   3. NO NEW DEPENDENCY. `ci/Dockerfile` has no `RUN` instruction, by design and at a cost of about
 *      800MB, so anything used here must already be in `node:20-bookworm`. `ssh-keygen` (OpenSSH
 *      9.2) and `git` (2.39) both are. A mechanism requiring an install would have to change that
 *      file's central claim.
 *
 * WHY NOT `git verify-tag`, which would have been three lines: Git resolves the allowed-signers file
 * through `gpg.ssh.allowedSignersFile`, and that is configuration the EVALUATED REPOSITORY controls.
 * Verifying through Git would let the pack under evaluation nominate the file deciding whether to
 * believe it — the in-pack anchor arriving through a side door rather than the front one ADR 0010
 * closed. So the tag object is read, the signature separated here, and the allowed-signers file
 * written from the operator's anchor into a temporary directory the evaluated repository cannot
 * reach. `test/ssh-tag-verification.test.mjs` holds that line with a fork whose own configuration
 * satisfies `git verify-tag` and which is refused anyway.
 *
 * WHAT THIS FILE DOES NOT DECIDE: whether the signer is trusted. It reports who signed, and
 * `packOrigin` compares that against the anchor. Keeping the comparison there means the trust
 * decision has exactly one home, and this file can be replaced wholesale by a GPG or minisign
 * equivalent without moving it.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SIG_BEGIN = "-----BEGIN SSH SIGNATURE-----";
const SIG_END = "-----END SSH SIGNATURE-----";

/**
 * Read a signed release tag out of a repository, as `{ ok, tag, payload, signature }`.
 *
 * `git` is injected as `(args) => { status, stdout }`, the same seam `pack-lineage.mjs` and
 * `release-identity.mjs` use. Failures return `ok: false` with a detail an operator can act on and
 * NO `signature` field, which is what makes `packOrigin` report them as `release-unavailable`: an
 * unsigned or absent release is missing evidence, not refuted evidence, and this repository keeps
 * those apart everywhere else.
 */
export function readSignedTag(git, tag) {
  const ref = `refs/tags/${tag}`;
  const type = git(["cat-file", "-t", ref]);
  if (type.status !== 0) {
    return { ok: false, tag, detail: `${ref} is not present here, so there is no release object to authenticate.` };
  }
  if (type.stdout.trim() !== "tag") {
    return {
      ok: false,
      tag,
      detail:
        `${ref} is a lightweight tag. A lightweight tag carries no signature and no author — it is a ` +
        `name pointing at a commit, and a name is what this mechanism exists to stop relying on.`,
    };
  }

  const object = git(["cat-file", "tag", tag]);
  if (object.status !== 0) {
    return { ok: false, tag, detail: `${ref} exists but its object could not be read.` };
  }

  const text = object.stdout;
  const begins = text.indexOf(SIG_BEGIN);
  const ends = text.indexOf(SIG_END);
  if (begins === -1 || ends === -1 || ends < begins) {
    return {
      ok: false,
      tag,
      detail:
        `${ref} is annotated but carries no SSH signature. Nobody has done anything wrong: an ` +
        `unsigned release simply cannot establish who authorized it.`,
    };
  }

  // THE NAME BINDING. A ref is an alias, and an alias is not signed. `refs/tags/v9.9.9` can be made to
  // point at a genuine, valid, trusted signature over v1.1.0 — at which point the commit matches, the
  // tree matches, the signer is the custodian, and the signature verifies, because all of that really
  // is the custodian's work. The only false thing is which release the evidence is offered for, so
  // comparing oids cannot detect it: they are identical by construction. What the signature actually
  // authorises includes the `tag <name>` header inside the signed payload, and that is what must equal
  // the release being asked about.
  const signed = /^tag (.+)$/m.exec(text.slice(0, begins))?.[1]?.trim();
  if (signed !== tag) {
    return {
      ok: false,
      tag,
      mismatch: signed ?? null,
      detail:
        `${ref} resolves to a tag object whose signed name is ${signed ? `\`${signed}\`` : "absent"}, not ` +
        `\`${tag}\`. A genuine signature for another release is not evidence for this one, and a ref ` +
        `is an alias rather than something anybody signed.`,
    };
  }

  return {
    ok: true,
    tag,
    // The payload is the tag object exactly as Git produced it, up to the signature. Reconstructing
    // it rather than slicing would be an opportunity to differ from what was signed.
    payload: text.slice(0, begins),
    signature: `${text.slice(begins, ends + SIG_END.length).trimEnd()}\n`,
  };
}

/**
 * Build the verifier `packOrigin` injects: `(release, anchor) => { valid, fingerprint }`.
 *
 * Two questions, deliberately separate. `check-novalidate` answers "is this a cryptographically
 * sound signature, and by which key" without consulting any trust configuration at all — which is
 * the honest shape, because trust is not this file's decision. When the anchor carries a full public
 * key rather than only a fingerprint, `-Y verify` runs as well against an allowed-signers file
 * written here from that key: two independent checks that must agree, so a fingerprint parsed out of
 * tool output is never the only thing standing between a fork and a positive claim.
 */
export function sshTagVerifier({ keygen = "ssh-keygen" } = {}) {
  /** Tri-state. `unavailable` is not a polite spelling of `invalid`: nothing examined the signature. */
  const unavailable = (detail) => ({ status: "unavailable", valid: false, fingerprint: null, detail });
  /** True when a spawn never produced a verdict — missing binary, unspawnable, or no `-Y` support. */
  const couldNotRun = (r) =>
    r.error != null || r.status === null || (r.status !== 0 && /unknown option|invalid option|usage:/i.test(r.stderr ?? ""));

  return (release, anchor) => {
    if (!release?.signature || !release?.payload) {
      return { status: "invalid", valid: false, fingerprint: null };
    }

    const dir = mkdtempSync(path.join(tmpdir(), "origin-verify-"));
    try {
      const signature = path.join(dir, "release.sig");
      writeFileSync(signature, release.signature, "utf8");

      const checked = spawnSync(keygen, ["-Y", "check-novalidate", "-n", "git", "-s", signature], {
        input: release.payload,
        encoding: "utf8",
      });
      // The order matters: ask whether a verifier RAN before reading what it said. A missing
      // `ssh-keygen` and a bad signature both arrive as a non-zero status, and treating them alike
      // asserts that evidence was examined and contradicted when nothing examined it — a false
      // accusation against whoever signed, and the exact conflation the external-verifier contract
      // forbids downgrading in either direction.
      if (couldNotRun(checked)) {
        return unavailable(
          `\`${keygen}\` could not verify this signature (${checked.error?.code ?? checked.stderr?.trim() ?? "no verdict"}). ` +
            `Nothing checked the signature, so nothing may be concluded about it.`,
        );
      }
      if (checked.status !== 0) return { status: "invalid", valid: false, fingerprint: null };

      const fingerprint = /(SHA256:[A-Za-z0-9+/=]+)/.exec(`${checked.stderr}${checked.stdout}`)?.[1] ?? null;

      if (typeof anchor?.publicKey === "string" && anchor.publicKey.trim() !== "") {
        const allowed = path.join(dir, "allowed_signers");
        // Written HERE, from the anchor, into a directory made here. The evaluated repository never
        // names this file and never sees it.
        writeFileSync(allowed, `custodian ${anchor.publicKey.trim()}\n`, "utf8");
        const verified = spawnSync(
          keygen,
          ["-Y", "verify", "-f", allowed, "-I", "custodian", "-n", "git", "-s", signature],
          { input: release.payload, encoding: "utf8" },
        );
        // A signature that passes the cryptographic check but not the allowed-signers check was made
        // by another key. Reporting the fingerprint lets `packOrigin` call that untrusted-signer;
        // returning invalid here would tell the operator the signature is broken when it is fine and
        // simply not theirs.
        if (couldNotRun(verified)) return unavailable(`\`${keygen} -Y verify\` could not run.`);
        if (verified.status !== 0 && fingerprint === anchor.fingerprint) {
          return { status: "invalid", valid: false, fingerprint };
        }
      }

      return { status: "verified", valid: true, fingerprint };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
}
