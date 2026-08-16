# The external verifier contract

**Status:** frozen, 2026-08-16. Governed by
[ADR 0011](../../artifacts/adr/0011-canonical-origin-cannot-be-asserted-by-the-pack.md) and
[ADR 0010](../../artifacts/adr/0010-release-signing-custody-and-an-external-trust-anchor.md).

## Who owns what

**This repository owns the protocol specification and the test vectors. StandardsEnforcer — or any
other trusted host — owns the authoritative implementation.** The split is not administrative. A
specification can be published by the thing being authenticated without weakening anything, because a
reader who distrusts the pack can read it and implement it anyway. An authoritative verdict cannot,
because the pack would be adjudicating itself.

`scripts/ssh-tag-verifier.mjs` remains here as a **reference implementation and conformance fixture**.
Nothing in this repository may claim that calling it establishes this repository's origin.

## The claim being frozen

> Canonical origin is established only by trusted host code that is outside the evaluated pack's
> control, using a trust anchor supplied independently of that pack, over an immutable release object
> whose exact material is then bound to the bytes evaluated.

Each clause carries a failure this contract exists to prevent, and the last one is the easiest to skip:
verifying a tag and then evaluating a checkout that was never bound to it is not origin verification,
it is origin verification's paperwork.

## The six host responsibilities, in order

Order is normative. Each step's authority derives from the one before it, so performing them out of
sequence produces a result that looks identical and means nothing.

### 1. Acquire trust independently

The host receives the custodian's SSH public key as trusted configuration — the key value itself, not
a path resolved anywhere near the pack. **No path, key, fingerprint, config value, helper, or
executable may be discovered from the evaluated pack.** The fingerprint is derived by the host from
the key it was given; configuring both representations is avoided unless a rotation needs it, because
two operator-supplied spellings of one authority create a consistency question somebody must then
govern.

### 2. Resolve the requested release itself

The host resolves `vX.Y.Z` and reads the annotated tag object from the evaluated repository **without
executing code from that checkout**. Reading data out of a repository is safe; running its scripts,
hooks, or helpers is not.

**The requested name must equal the name inside the signed payload.** A ref is an alias and nobody
signs an alias: `refs/tags/v9.9.9` can be pointed at a genuine, valid, trusted signature over
`v1.1.0`, after which the commit, the tree, the signer and the signature are all authentically the
custodian's and the only false thing is which release the evidence is offered for. Comparing oids
cannot detect this — they are identical by construction — so the host compares the requested release
against the `tag <name>` header carried inside the authenticated tag object. A mismatch is
**contradicted** evidence, not missing evidence: somebody built that ref.

### 3. Verify authorization itself

Host-owned verifier code validates the SSH signature over the tag payload and confirms the signer is
the externally trusted key. Both halves are required and they fail differently: a sound signature by
an unknown key is `untrusted-signer`; an unsound signature is `invalid-signature`.

**A verifier answers in three states, not two:** verified, invalid, and *unavailable*. A missing
`ssh-keygen`, one that cannot be spawned, or one too old for `-Y` means **nobody checked** — and a
non-zero exit status looks identical whether the tool refused the signature or never examined it.
Reporting that as `invalid-signature` asserts the signature was examined and found wanting, which is
a claim nothing performed and a false accusation against whoever signed. It maps to
`verification-unavailable`, which fails closed like every other unestablished state.

### 4. Resolve the signed object

From the authenticated tag, the host obtains the exact commit and tree that were authorized. **The
pack does not tell the host which object its signature "meant."** A tag names its target; that
mapping is read from the object the host just authenticated, not from any file the pack supplies.

### 5. Materialise and bind the bytes

The host materialises that authenticated tree and proves the bytes it will evaluate are exactly those
bytes — by recomputing the tree identity from the materialised files and requiring equality with the
authorised tree oid. A branch, a worktree, or "the checkout that happens to be there" is a mutable
reference; binding is what turns an authorised object into authorised material.

### 6. Only then execute pack code

The evaluator may produce compliance results only from already-authenticated material. **Pack output
cannot upgrade, replace, or contradict the host's origin disposition.** If the two ever disagree, the
host's disposition stands, because the other one was produced by the thing under examination.

## The host-side object

Constructed by trusted host code from facts it established itself. **Never parsed from JSON emitted by
the pack** — a struct assembled from the defendant's testimony has the shape of evidence and the
content of a claim.

```
CanonicalPack {
  standard: "health-fitness-nutrition"
  release: "v1.1.0"
  tagOid: ...
  commitOid: ...
  treeOid: ...
  signerFingerprint: ...
  trustedKeySource: ...
  materialRoot: ...
}
```

Its absence is a state, not an error to be smoothed over: where there is no `CanonicalPack`, there is
no canonical origin, and every downstream claim that needs one fails closed
(`assertCanonicalOrigin` in `scripts/pack-origin.mjs` is the reference shape of that refusal).

## The negative contract

The host must never:

- import verification code from the evaluated tree before origin is established;
- honour `gpg.ssh.allowedSignersFile`, Git config, environment configuration, or helper binaries
  nominated by the evaluated repository — this is why `git verify-tag` is not the mechanism;
- accept a fingerprint merely because pack code reports it;
- take a public-key path whose resolution occurs inside the evaluated pack;
- verify a release and then execute a mutable branch or worktree without rebinding the exact bytes;
- downgrade missing trust, missing history, unsigned tags, unknown signers, invalid signatures, or
  byte mismatches into warnings.

The last one is the one that erodes quietly. Each of those conditions has a legitimate innocent cause,
which is exactly why the temptation to warn-and-continue is strongest there and why the distinction
kept everywhere else in this repository — *unavailable* evidence is not *contradicted* evidence, and
neither is a pass — must not be spent on it.

## Conformance: two test vectors, and both are required

`test/host-verifier-conformance.test.mjs` implements a minimal host from this document alone and runs
both. It deliberately does not import `scripts/pack-origin.mjs` or `scripts/ssh-tag-verifier.mjs`: a
conformance test that reuses the reference implementation proves the reference implementation agrees
with itself.

1. **Adversarial.** A hostile fork carrying a patched `pack-origin.mjs`, a patched SSH verifier,
   malicious Git configuration, its own validly signed tag, and any in-pack key and config files it
   likes. The host is given only the legitimate custodian public key and the fork's location. It must
   reject the fork **without importing or executing any code from it**.
2. **Positive control.** The same host, the same external key, the same mechanism, given a genuine
   release signed by the custodian: it accepts and materialises the exact authenticated tree.

Neither is sufficient alone. Without the second, rejection could be a mechanism incapable of accepting
anything; without the first, acceptance could depend on the pack's cooperation. Together they say the
answer tracks the signature rather than the situation.

**What the vectors do not cover, stated so an implementer does not read green as more than it is.**
Mutating the conformance host shows they catch a host that takes its trust configuration from the
evaluated tree, and a host that materialises a mutable branch tip instead of the authorised commit.
They do **not** catch a host that materialises the right object and then omits step 5's proof: with a
content-addressed store and an honest clone, the comparison is a self-check whose absence changes no
outcome these fixtures can produce. Step 5 is therefore enforced here as far as *materialise the right
thing*, and only specified as far as *prove it*. An implementation that skips the proof will pass
these vectors and is still non-conforming.
