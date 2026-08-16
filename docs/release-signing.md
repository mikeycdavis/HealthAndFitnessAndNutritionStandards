# The release-signing procedure

**Status:** frozen, 2026-08-16. Governed by
[ADR 0010](../artifacts/adr/0010-release-signing-custody-and-an-external-trust-anchor.md) and
[ADR 0011](../artifacts/adr/0011-canonical-origin-cannot-be-asserted-by-the-pack.md); the verifying
half is [the external verifier contract](design/external-verifier-contract.md).

This is a human ceremony with machine assistance, not a pipeline with a human in it. **Freezing the
procedure and executing it are separate.** The procedure is complete when it is written and testable;
its first production execution happens at the first new immutable standards release under this
regime. Requiring a release in order to close the item would manufacture a release to satisfy
process — and `v1.0.0` does not acquire signing retroactively in any case
([ADR 0008](../artifacts/adr/0008-authenticity-guarantees-are-not-retroactive.md)). The first new
signed release is the production proof of this procedure, not a prerequisite for having one.

## The prohibition that shapes everything below

> **No release automation may possess the signing private key merely to make the ceremony
> convenient.**

The build may prepare and verify a candidate. An agent may prepare the exact command and inspect the
resulting public evidence. **The human custodian performs the signing act.** Convenience is the entire
argument for the alternative, and it is the argument that ends with a key in a workflow file, which is
to say in the hands of everyone who can edit one.

## The steps

### 1. The key is the custodian's, and lives nowhere else

The accountable human release owner controls a dedicated SSH signing private key held outside this
repository and outside ordinary CI. It is never committed, never copied into the pack, and never
exposed to an agent. Dedicated rather than reused: a key that also opens other doors makes the blast
radius of a compromise a question about someone's whole machine.

### 2. The public key is registered with the trusted host, independently

The public key **value** is registered in the trusted host's external configuration, independently of
the pack. The host derives the fingerprint itself. Not a path resolved near the pack, and not both a
key and a fingerprint unless a rotation needs both — two operator-supplied spellings of one authority
create a consistency question somebody must then govern.

### 3. Identify the exact release commit before signing anything

Signing **never chooses or repairs the release candidate**. Before it begins, all of these hold:

- the working tree is clean;
- the release and version state is settled;
- the required certification is complete;
- CI is green **on that exact commit**.

A signature over a commit whose CI ran on something else is a signature over an assumption.

### 4. Sign an annotated tag over that exact commit

Created with the human-controlled key, as an annotated tag. **Repository Git configuration is not
relied on for trust** — signing configuration may be supplied explicitly by the human's environment,
because config inside the repository is exactly the surface a fork controls.

### 5. Inspect the result before pushing, independently

Confirm the tag is annotated, targets the intended commit, carries an SSH signature, and verifies
under the external public key. **The pack's own origin result is not evidence for this step**, for the
reason ADR 0011 exists: the pack cannot pronounce on its own origin, and it certainly cannot do so
about a tag it was just handed.

### 6. Push only when those conditions hold

If signing or verification fails, **no unsigned or lightweight fallback tag is created**. A tag of the
release's name pointing at an unsigned object is worse than no tag: it answers to the name while
carrying none of the provenance, and `scripts/pack-lineage.mjs` classifies that shape as contradicted
evidence rather than missing evidence.

### 7. Record the public facts in the release evidence

The release commit, the tag, the signer fingerprint, and the external trust-anchor identity. **Never
the private key**, and nothing derived from it that would narrow a search for it.

### 8. Rotation, loss, or compromise is a governance event

Explicit and separate. **A new key does not silently become trusted because it appears in this
repository** — that is the substitution attack the conformance vectors exist to catch, arriving as an
administrative convenience rather than as an attack.

## What is mechanically checked

Step 1's prohibition is a guard, not a promise: `test/trusted-execution-boundary.test.mjs` asserts that
no tracked file in this repository contains private key material. The rest of this procedure is
verified by the trusted host at consumption time — which is the correct division, since a check this
repository runs on itself is a check a fork also runs on itself.
