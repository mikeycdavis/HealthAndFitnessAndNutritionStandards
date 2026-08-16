/**
 * Canonical pack origin — was this release authorized by the key the operator independently trusts?
 *
 * This is a DIFFERENT QUESTION from the one `scripts/pack-lineage.mjs` answers, and the separation is
 * the whole design. Lineage asks whether a working tree descends from a recorded release object; it
 * is a fact about history, and a fork of this repository satisfies it because a fork holds the same
 * history. Origin asks who authorized the release, which is the one fact about it that cannot be
 * copied along with the bytes. **Origin is never inferred from lineage** — answering the first
 * question well is not evidence about the second, and treating it as evidence is how the residual
 * ADR 0009 named would get declared closed without being closed.
 *
 * THE CONSTRAINT THIS MODULE EXISTS TO ENFORCE (ADR 0010):
 *
 *   The trust anchor cannot come from the pack being authenticated.
 *
 * A `trusted-key.json` shipped inside this repository is replaced by a fork along with everything
 * else, after which the fork signs its own release with its own key and verifies successfully. That
 * result reads as cryptographic proof of origin and proves only internal consistency — the FE-13
 * defect rebuilt one layer up under a stronger-sounding name. So the anchor arrives here as an
 * argument, from an operator-controlled trust store the pack has no access to, and **this module
 * reads no files at all.** That is not a stylistic preference: a module with no filesystem access
 * cannot be talked into loading an anchor out of the material it is evaluating, whatever a future
 * caller does. `test/pack-origin.test.mjs` asserts the absence structurally, because the property is
 * invisible in any test of the happy path.
 *
 * WHERE FAIL-CLOSED BINDS. At the claim, not at the evaluation (ADR 0010). `standards maintain`
 * reports origin and does not require it — it answers whether this working tree satisfies the
 * standards it publishes, and putting that behind release-owner credentials would make ordinary
 * development depend on trust configuration contributors correctly should not hold. Anything that
 * ASSERTS canonical origin goes through `assertCanonicalOrigin` and refuses unless established.
 *
 * WHY A NAMED STATE AND NOT A BOOLEAN. `originVerified: false` invites a caller to collapse "checked
 * and rejected", "could not check", and "no anchor was supplied" into one branch. Those three mean
 * different things to whoever has to act on them, and telling them apart is the entire reason this
 * mechanism is worth building.
 *
 * WHAT IS NOT HERE YET: the cryptographic mechanism. `verify` is injected, and no GPG/SSH/minisign
 * decision has been made (ST-12). Deliberate — the mechanism is chosen against the falsifier rather
 * than for its ergonomics, and a signature-checking function is the smallest thing the rest of this
 * contract needs to be true. Until one is supplied, origin is `NOT_ESTABLISHED` for the honest
 * reason that nothing checked, which is what fail-closed means when it is not yet built.
 */

export const ORIGIN = Object.freeze({
  ESTABLISHED: "ESTABLISHED",
  NOT_ESTABLISHED: "NOT_ESTABLISHED",
});

/**
 * Every way origin can fail to be established. Each is a distinct operator situation: `untrusted-
 * signer` means somebody signed this and it was not the custodian; `trust-anchor-absent` means nobody
 * asked the question. Collapsing them is the boolean mistake wearing a longer name.
 */
export const ORIGIN_REASON = Object.freeze({
  TRUST_ANCHOR_ABSENT: "trust-anchor-absent",
  UNTRUSTED_SIGNER: "untrusted-signer",
  INVALID_SIGNATURE: "invalid-signature",
  RELEASE_UNAVAILABLE: "release-unavailable",
  /** No verifier was supplied, because ST-12 has not chosen a mechanism. Not a synonym for the others. */
  VERIFICATION_UNIMPLEMENTED: "verification-unimplemented",
});

const notEstablished = (reason, detail) => ({
  status: ORIGIN.NOT_ESTABLISHED,
  reason,
  detail,
  trustedKey: null,
});

/**
 * Decide canonical origin from a release, an externally supplied anchor, and an injected verifier.
 *
 * `anchor` is `{ fingerprint, source }` and comes from the operator, never from the evaluated tree.
 * `release` is `{ version, tag, signature }` as presented by the pack — untrusted input, which is the
 * point: the pack may say anything, and the anchor decides whether it is believed.
 *
 * THAT SENTENCE IS TRUE ONLY WHEN THIS MODULE IS THE TRUSTED HOST'S COPY, and it is left standing
 * with its correction rather than quietly rewritten, because it was believed and it was too strong.
 * A hostile fork replaces this file along with everything else and has its own copy return
 * ESTABLISHED without consulting the anchor at all. The key is external; the code interpreting the
 * evidence was not. So the pack can also change the thing that lets the anchor decide, and no
 * cryptography reachable from inside the pack closes that — see
 * [ADR 0011](../artifacts/adr/0011-canonical-origin-cannot-be-asserted-by-the-pack.md), which moves
 * the assertion to a verifier the evaluated pack does not supply, and
 * `test/trusted-execution-boundary.test.mjs`, which makes the difference observable.
 * `verify` is `(release, anchor) => { valid, fingerprint }` — the cryptographic mechanism, injected.
 *
 * The anchor is checked FIRST, before the release is examined and before any verifier runs. Order is
 * load-bearing rather than tidy: it makes "no anchor supplied" unreachable from every later branch,
 * so no verifier — including a hostile one a fork supplies — can produce ESTABLISHED for an operator
 * who never configured trust.
 */
export function packOrigin({ anchor, release, verify } = {}) {
  if (!anchor || typeof anchor.fingerprint !== "string" || anchor.fingerprint.trim() === "") {
    return notEstablished(
      ORIGIN_REASON.TRUST_ANCHOR_ABSENT,
      "no trusted key was supplied from outside this pack, so there is nothing to authenticate " +
        "against. A key found inside the material under evaluation is not an anchor: a fork holds " +
        "that file too, and authenticating a pack against its own key establishes internal " +
        "consistency rather than origin (ADR 0010).",
    );
  }

  if (!release || typeof release.tag !== "string" || typeof release.signature !== "string" || release.signature === "") {
    return notEstablished(
      ORIGIN_REASON.RELEASE_UNAVAILABLE,
      "the signed release this claim would rest on could not be resolved. Unestablished fails " +
        "closed; an unsigned or unresolvable release is not a reason to proceed without one.",
    );
  }

  if (typeof verify !== "function") {
    return notEstablished(
      ORIGIN_REASON.VERIFICATION_UNIMPLEMENTED,
      "no signature verifier was supplied, so nothing checked this signature. Reported as its own " +
        "reason rather than as an absent anchor or an invalid signature, because an operator who " +
        "configured trust correctly is owed an accurate account of why the answer is still no.",
    );
  }

  const result = verify(release, anchor);
  if (!result || result.valid !== true) {
    return notEstablished(
      ORIGIN_REASON.INVALID_SIGNATURE,
      `the signature on ${release.tag} did not verify. Somebody produced that object; it is not the ` +
        `absence of evidence but evidence that does not hold up.`,
    );
  }
  if (typeof result.fingerprint !== "string" || result.fingerprint !== anchor.fingerprint) {
    return notEstablished(
      ORIGIN_REASON.UNTRUSTED_SIGNER,
      `${release.tag} carries a valid signature by ${result.fingerprint ?? "an unidentified key"}, ` +
        `which is not the trusted key. A correct signature by the wrong key is exactly what a fork ` +
        `that substituted its own trust configuration produces, and it is refused here.`,
    );
  }

  return {
    status: ORIGIN.ESTABLISHED,
    reason: null,
    detail: null,
    trustedKey: anchor.fingerprint,
    anchorSource: anchor.source ?? null,
    release: { version: release.version ?? null, tag: release.tag },
  };
}

/** Thrown when a caller asserts canonical origin it has not established. Distinguishable by name. */
export class CanonicalOriginRequired extends Error {
  constructor(claim, origin) {
    super(
      `Refusing to claim ${claim}: canonical pack origin is ${origin?.status ?? "unknown"}` +
        `${origin?.reason ? ` (${origin.reason})` : ""}. ` +
        `Only an immutable release signed by the trusted key establishes origin, and only a trust ` +
        `anchor supplied from outside this pack can decide that (ADR 0010).`,
    );
    this.name = "CanonicalOriginRequired";
    this.claim = claim;
    this.origin = origin ?? null;
  }
}

/**
 * THE ONE DOOR. Every assertion that depends on canonical origin goes through here.
 *
 * ADR 0009's property 2 was a true statement placed where consumers do not look, and appending an
 * origin field in the hope downstream callers read it would repeat that with better vocabulary. A
 * single contract is what makes the guarantee structural: a future consumer cannot make the claim by
 * accident, because the only way to make it is to call something that refuses.
 *
 * It reads `origin.status` and nothing else. A result carrying `status: "SELF_MAINTENANCE"` and
 * `workingTreeStatus: "COMPLIANT"` says nothing about origin, and this function treats it as exactly
 * that — no field of a maintenance result is a substitute, no matter how green it is.
 */
export function assertCanonicalOrigin(origin, claim = "evaluation against the canonical pack") {
  if (!origin || origin.status !== ORIGIN.ESTABLISHED) throw new CanonicalOriginRequired(claim, origin);
  return origin;
}
