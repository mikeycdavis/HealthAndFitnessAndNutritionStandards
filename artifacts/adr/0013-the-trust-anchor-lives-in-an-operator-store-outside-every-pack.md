# ADR 0013 — The trust anchor lives in an operator store outside every pack

**Status:** Accepted
**Date:** 2026-08-26
**Deciders:** Michael Davis (release-signing custodian)

## Context

[ADR 0010](0010-release-signing-custody-and-an-external-trust-anchor.md) settled *who holds the
private key* and required the trust anchor to be supplied from outside the pack being evaluated.
[ADR 0011](0011-canonical-origin-cannot-be-asserted-by-the-pack.md) settled *who may pronounce* on
canonical origin: not the pack, because a hostile fork rewrites whatever code interprets the
evidence.

Neither said **where the anchor lives**. Until the first signing ceremony that gap was theoretical.
At the ceremony it stopped being theoretical, because the anchor had to be somewhere before R2 could
read it, and every convenient location was one of the ones the two ADRs above forbid.

The state discovered on 2026-08-26, immediately before the first ceremony: nothing signing-related
was configured at any Git scope, `~/.ssh` did not exist, no `allowed_signers` file existed anywhere,
and StandardsEnforcer held no anchor either. There was no incumbent location to inherit, so the
choice was open and had to be made deliberately.

## Decision

The trust anchor is a **public key file in an operator-controlled store outside every standards
pack**:

```
%USERPROFILE%\.config\standards-enforcer\trust\<standard-id>.pub
```

For this pack, `<standard-id>` is `health-fitness-nutrition` — the identity
`standards-adapter.json` already declares, so the store is indexed by what a pack publishes about
itself rather than by a name chosen separately for the store.

Four properties follow, and each answers something that had gone wrong or could:

1. **The public key itself is the authoritative configuration, not a fingerprint.** A fingerprint
   file would be a second configurable representation of the same authority, and two
   representations eventually disagree. The fingerprint is derived whenever it is needed —
   `ci/certify-release.mjs` derives the signer's at verification time rather than comparing against
   a stored one.
2. **The private key is not colocated.** It lives under the custodian's control
   (`~/.ssh/hfn-release-signing` for the first ceremony), separately, because filename convenience
   is not a reason to put a secret beside the thing everyone is meant to read.
3. **The anchor reaches the evaluated pack as a value, never as a path.** The operator reads the
   file; `HFN_TRUSTED_PUBLIC_KEY` carries the key itself. A path is something the evaluated tree
   could point at, and ADR 0011 exists because the evaluated tree may not nominate the file that
   decides whether to believe it. A path is acceptable **only** at the trusted-host boundary, where
   the host reads it before invoking anything from the pack.
4. **One anchor, two consumers, no migration.** `ci/certify-release.mjs` (R2) reads it today.
   StandardsEnforcer reads the same location when it implements the host contract. A store invented
   for R2 alone would have to be migrated later, and a migration of trust configuration is exactly
   the moment a substitution attack looks like housekeeping (ADR 0010 §8).

The authority chain, entire:

```
custodian's dedicated private HFN release-signing key
        │ signs
        ▼
   v1.1.0 annotated tag

operator trust store, outside every pack
%USERPROFILE%\.config\standards-enforcer\trust\health-fitness-nutrition.pub
        │ read by the operator, passed as a value
        ▼
   R2 now  ·  StandardsEnforcer later
```

## Alternatives considered

**A key file inside this repository** (`scripts/trusted-key.json`, or similar). Rejected in ADR
0010 already and restated here because it is the option that keeps re-presenting itself as
convenience: a fork replaces the file along with everything else, signs its own release, verifies
successfully, and reports a cryptographic proof of nothing. It would pass every obvious test.

**Git's `gpg.ssh.allowedSignersFile`.** Rejected, and this is the security-relevant one. Git resolves
that path through configuration the *evaluated repository* controls, so verifying through
`git verify-tag` lets the pack under evaluation nominate the file deciding whether to believe it —
the in-pack anchor arriving through a side door rather than the front one ADR 0010 closed.
`scripts/ssh-tag-verifier.mjs` writes its own allowed-signers file into a directory it creates, from
a key passed as an argument, for this reason.

**GitHub's registered SSH signing keys as the anchor.** Rejected. It is a useful *independent
registration* of the public half — ADR 0010 §2 asks for exactly that — but it is not the anchor:
reading it requires an authenticated API call with the `admin:ssh_signing_key` scope, which makes
verification depend on network reachability and a credential, and an unavailable anchor must never
be confused with a satisfied one. The local store answers offline.

**A fingerprint-only anchor file.** Rejected, per decision 1. It also cannot verify a signature on
its own — only compare an identity after some other component has verified — which would split the
anchor's job across two places.

## Consequences

- The first ceremony has a documented, reproducible location, and the next release changes nothing
  about setup.
- **Rotation remains a governance event** (ADR 0010 §8). A new key does not become trusted by
  appearing in the store; replacing that file is the act that grants authority, and it should be as
  deliberate as the original registration.
- The store is per-operator and not backed up by this repository. An operator who loses it can
  re-derive it from the custodian's public key, which is not secret — but an operator who *silently
  replaces* it has changed who may authorise releases, which is why the file's provenance matters
  more than its confidentiality.
- StandardsEnforcer inherits a location rather than a decision. Implementing the host contract does
  not reopen this question.
- Nothing in this repository may read the store to decide its own origin. The pack provides the
  signed tag, the material, a reference verifier and diagnostics; the operator or the host reads the
  anchor and pronounces (ADR 0011).
