# 0011 — Canonical origin cannot be asserted by code loaded from the evaluated pack

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** project owner (Michael Davis), on review of the ST-12 SSH verification slice (PR #7)

## Context

[ADR 0010](0010-release-signing-custody-and-an-external-trust-anchor.md) froze the constraint that the
trust anchor cannot come from the pack being authenticated, and the SSH mechanism was built to that
constraint: the operator's key arrives as an argument, the allowed-signers file is written outside the
evaluated tree, and `git verify-tag` is deliberately not used because it resolves that file through
configuration the evaluated repository controls.

Review of that slice found the assumption underneath all of it. **The anchor is external. The judge is
not.**

`scripts/pack-origin.mjs` and `scripts/ssh-tag-verifier.mjs` live inside the pack whose origin they
authenticate. An honest fork running them is correctly refused. A hostile fork is under no obligation
to run them honestly — it replaces either file along with everything else and has its own copy return
`ESTABLISHED` without going near `ssh-keygen`. Supplying the real public key does not help: the key
is external, and the code interpreting the evidence is not.

So this sentence, which `pack-origin.mjs` carried, was stronger than the architecture earned:

> the pack may say anything, and the anchor decides whether it is believed

The pack can also change the code that lets the anchor decide. This is the same class of finding as
the one that opened FE-13 — material inside the verified boundary being trusted to adjudicate the
boundary — one level further out, and it is the level where it stops being fixable from inside.

## Decision

**Canonical-origin establishment requires a verifier whose implementation is outside the evaluated
pack's control.** No output of any command in this repository, executed from this repository,
establishes canonical origin, regardless of how sound its cryptography is.

```text
                 TRUSTED EXECUTION BOUNDARY
                         │
external anchor ─────────┤
                         ▼
              StandardsEnforcer / bootstrap verifier
                         │
              resolve annotated release tag
                         │
              verify SSH signature itself
                         │
              compare signer to trusted key
                         │
              verify/materialise exact release bytes
                         ▼
                  VERIFIED PACK BYTES
                         │
                         ▼
                 pack evaluator/check
```

The evaluated pack may provide the signed tag, the standards bytes, a reference implementation such
as `ssh-tag-verifier.mjs`, and diagnostics. It may not pronounce on its own canonical origin. That
assertion belongs to code the attacker does not get to replace along with the pack.

This is not the problem being pushed elsewhere. It is the authority being put at the only layer where
a fork cannot rewrite the judge along with the defendant — and it fits the architecture already
planned, where StandardsEnforcer holds centrally governed trust configuration and establishes what an
authorized release is before trusting or executing one.

### The anchor is supplied as a key value, not a path

The trusted verifier receives the public key itself:

```yaml
trustedReleaseKey:
  type: ssh-ed25519
  publicKey: ssh-ed25519 AAAA...
```

The verifier derives the fingerprint from that key. Configuring both a public key and a fingerprint is
avoided unless a rotation or migration needs it: two operator-supplied representations of one
authority create a consistency question somebody then has to govern, and the failure mode of getting
it wrong is silent.

A path is acceptable only at the trusted-host boundary, where the host reads it before invoking
anything from the pack. **"Read this path for your anchor" is never passed to evaluated code** — an
evaluated pack that is told where to look for the anchor is one refactor away from deciding what is
there. Because the public key is not secret, it belongs in the enforcer's central trust configuration
rather than in an environment variable naming a file. The private key stays with the human custodian
and reaches neither enforcement nor ordinary CI (ADR 0010, decisions 1 and 2).

### What ST-12 can therefore close here, and what it cannot

Split deliberately, because the alternative is a repository reporting a guarantee it structurally
cannot deliver:

- **This repository completes:** the signing format, the release-signing procedure, signed-tag
  verification semantics, the origin states and reasons, and the test vectors and adversarial forks.
  ST-12 is done when the cryptographic protocol and the external-verifier contract are frozen and
  testable.
- **The portfolio-level origin guarantee completes only when StandardsEnforcer implements that
  contract from outside the evaluated pack.** Full-fork exclusivity cannot be closed by this
  repository alone, because the trusted execution boundary necessarily lives outside it.

Nothing here may report FE-13's retired absolute criterion as met. It was retired by the owner on
2026-08-16 (ADR 0009) and this decision narrows further what the replacement can claim.

## Consequences

- `scripts/ssh-tag-verifier.mjs` is a **reference mechanism**: it demonstrates how an SSH-signed
  release is cryptographically checked against an explicitly supplied public key. Executed from the
  evaluated pack, it does not establish canonical origin against a hostile fork, and it now says so.
- The overclaiming sentence in `pack-origin.mjs` is narrowed rather than deleted, so the record shows
  what was believed and what replaced it.
- `test/trusted-execution-boundary.test.mjs` makes the boundary observable: the same tag, the same
  anchor, and the same question answered twice — once by the module loaded from the evaluated pack,
  once by the module the host already had. The answers disagree, and which one an operator gets is
  decided entirely by where the code came from.
- **`origin` still does not go into `maintain`'s envelope, and now for a second and stronger reason.**
  It was held back because the field could only say `verification-unimplemented`. It is held back now
  because a field in the pack's own output is an origin claim made by the pack about itself, in the
  place a consumer is most likely to read it. A test asserts the CLI imports no origin machinery.
- The next work on this line is the external-verifier contract — what the enforcer must do, stated
  precisely enough to be implemented and tested from outside — not the anchor-supply plumbing, which
  is now a question for the trusted host rather than for this pack.
