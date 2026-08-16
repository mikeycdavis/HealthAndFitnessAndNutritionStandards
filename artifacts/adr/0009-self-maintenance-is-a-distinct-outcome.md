# 0009 — Self-maintenance is a distinct outcome, and eligibility for it is a fact about history

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** project owner — on an independent review of PR #2 that requested changes, and on a
  re-review of the remedy that narrowed the acceptance criterion (recorded below, 2026-08-16)

## Context

FE-13 stage 3 gave `check` the ability to prove that the standards bytes producing a verdict are the
immutable release an adopter declared. It sanctioned exactly one path around that proof:
`packSelfMaintenance`, for the pack maintaining itself. The reasoning was and remains sound — `main`
is ahead of the tag it publishes by construction, so this repository can never match the release it
declares, and a gate nobody can pass is a gate that gets relaxed rather than met.

The exemption was submitted for independent review specifically because it is the only sanctioned
bypass in the feature, and any hole in it becomes the thing FE-13 was built to remove. Review
rejected both properties it was claimed to have.

**Property 1 — no adopter can acquire the exemption. REJECTED.** The structural condition was
`path.resolve(root) === ROOT`, and `ROOT` is derived from the evaluator module's own location. It
therefore did not assert "this is the standards pack"; it asserted "this directory is wherever the
evaluator happens to be", which anyone who copies the evaluator into a directory they control
satisfies for free. Reproduced: a copy of this repository with its history removed was granted
self-maintenance and exited 0. The test that was claimed to cover this proved only that a *separate*
adopter directory could not claim the exemption — the case the escape does not use.

**Property 2 — a self-maintenance result cannot be consumed as an adoption result. REJECTED.** The
mode returned `ok: true`, ran the ordinary evaluator, and emitted the ordinary verdict envelope, so it
could report `status: "COMPLIANT"` and exit 0. `releaseIdentity.established: false` sat beside that as
additional metadata. A consumer doing the natural thing — reading the exit code, or reading `status` —
was told an adoption had been verified when none had. The human rendering warned correctly, which is
not a machine contract.

The reviewer also observed that the schema's claim that "no output of it can be mistaken for an
adoption evaluation" was stronger than the implementation supported. It was.

## Decision

**Two changes, one per rejected property. Neither redesigns FE-13.**

### 1. Eligibility is membership in the certified release lineage

`scripts/certified-releases.json` records which immutable Git object each released version of these
standards designates. Self-maintenance now requires three facts, all necessary:

1. the policy declares `packSelfMaintenance` (the claim is visible in a reviewed file),
2. the evaluated directory is the evaluator's own root (it is not adjudicating a third party), and
3. the repository belongs to the recorded lineage — the certified tag resolves to exactly the
   recorded commit oid, and HEAD descends from it.

Requiring only that an annotated `v1.0.0` exist would be satisfied by one `git tag -a`. The recorded
oid turns the check from a question about spelling into a question about history, and the descent
requirement makes it a question about *this* history rather than about a repository that merely
contains the object somewhere.

Two failure kinds are kept apart, because they mean different things. A tag of the certified name
pointing at another object is **contradicted** evidence — somebody made that — and reaches exit 3
under Standard 42. An absent repository, absent tags, or a shallow clone is **unavailable** evidence
and reaches exit 5: nobody has done anything wrong, the claim simply cannot be established, and
unestablished fails closed. Reporting "there is no repository here" as manipulation would be a false
accusation, and a gate that cries manipulation at ordinary conditions is a gate people route around.

### 2. Self-maintenance is a separate command with a status that is not a verdict

`standards check` no longer produces this outcome at all. Asked about the pack, it refuses with exit
6 and emits a refusal envelope carrying no verdict. `standards maintain` is the pack's own gate: its
top-level `status` is `SELF_MAINTENANCE` and never `COMPLIANT`, and the compliance result of the
working tree appears under `workingTreeStatus` — a name that scopes what it is about. Its exit 0
means "this working tree satisfies its own standards", which is this repository's green.

Both commands run the same evaluation through the same code path. They differ in what the result is
entitled to be called, never in how thoroughly it looks; a maintenance mode with its own softer
evaluation would be the bypass wearing a second costume.

The consequence worth stating plainly: **`status: "COMPLIANT"` from `check` now means identity was
established**, with no field anyone has to remember to consult. That is what makes the machine
contract a contract.

## The acceptance criterion this was reviewed against, and the narrower one that replaced it

The remedy above was re-reviewed. It established that property 2 is met and that the copied-evaluator
escape is closed, and that the criterion property 1 was written as — *no adopter can satisfy
`packSelfMaintenance` structurally* — is nonetheless **still literally false**, because a fork of the
certified lineage satisfies the eligibility conditions. What changed is that satisfying them no longer
buys an adoption verdict.

Accepting that is a scope decision about the original criterion, not a review finding, and it is
recorded here as a decision rather than absorbed into the sections above as though the criterion had
been met. The owner approved this replacement on 2026-08-16:

> **Approved acceptance boundary:** An adopter cannot obtain a compliance verdict through
> self-maintenance; copying the evaluator is insufficient to obtain self-maintenance eligibility;
> exclusivity against a full fork of the certified pack is not established by FE-13 and is explicitly
> deferred to [ST-12](../backlog/items/ST-12.md).

The reason given: it preserves the security property FE-13 actually needs for adoption — **self-
maintenance cannot be used to manufacture `COMPLIANT`**. The remaining fork case creates no adoption
false green under the revised machine contract, and closing that residual requires a separate
cryptographic origin/authenticity mechanism rather than more path or lineage heuristics.

The absolute criterion is therefore **retired, not satisfied**. Two consequences follow, and both are
the point of writing it down. Anything that reports property 1 as passed is reporting against a
criterion that no longer exists. And any future change claiming to close the fork case by a further
path, lineage, or configuration test has not met this boundary either, because the boundary states in
advance why that class of mechanism cannot close it.

## What is not claimed

**A fork of this repository satisfies the eligibility conditions, and nothing here changes that.** A
fork possesses every byte the original does — the certified tag, the recorded oid, the lineage, and
this file explaining them — so no check running inside the evaluator distinguishes a fork from the
pack. The residual is real and is named rather than papered over.

It is made worthless instead. What eligibility buys is a self-maintenance outcome: a status that is
not a compliance verdict, from a command an adopter's pipeline does not run, carrying no authority
over anybody's adoption of anything. An adopter who forks the entire standards pack in order to
obtain `status: "SELF_MAINTENANCE"` has gone to considerable trouble for a result that fails every
gate they would want to pass.

The mechanism that would close it is tag signature verification against a key a fork does not hold.
It is not in this slice: this repository has no signing key, introducing one is a key-management
commitment rather than a code change, and adding an unenforced `verify-tag` call would be worse than
nothing — a check that reports success when no key is configured is exactly the false green FE-13
exists to remove. Recorded as backlog rather than done badly.

The key-management question was subsequently decided —
[ADR 0010](0010-release-signing-custody-and-an-external-trust-anchor.md) records the custodian and
the constraint that the trust anchor must come from outside the pack being authenticated — but no
mechanism is implemented yet, so everything this section says about the fork residual still holds
exactly as written. When ST-12 lands, this section is revised to state what the mechanism does claim.

## Alternatives considered

### Rejected: keep one command and add an `--expect=self-maintenance` flag

Exit 0 would remain reachable for a self-maintenance run, on a flag a pipeline can carry. It asks
every future consumer to read one more thing correctly, which is the arrangement review rejected.

### Rejected: keep `check` and gate the pipeline on `|| [ $? -eq 6 ]`

The same shape as the exit-4 allowance `ci/run-checks.sh` documents having removed, and for the same
reason: an allowance on the surface an operator reads first converts a real signal into a permanent
excuse.

### Rejected: drop the exemption and evaluate the pack against `v1.0.0`

The repository would be permanently non-compliant with itself by construction, on every commit after
a release. A gate that is red for structural reasons teaches its operators to ignore red.

## Consequences

- This repository's own gate is `npm run maintain`. `PROJECT.md` reports its status as
  `SELF_MAINTENANCE` with the working tree `COMPLIANT` — deliberately two sentences.
- Exit code 6 joins the contract for `check`. It is not a failure: it means the caller asked the
  wrong command about the right directory.
- `scripts/certified-releases.json` gets a row at each release, after the tag exists, by reading the
  tag. It records no human judgement and confers no compliance; it is wrong or right rather than
  reviewed.
- **Found while building this, and worth its own note:** `MATERIAL` is versioned with the release.
  `materialise` requires every declared path to be present, so widening the boundary retroactively
  makes every release predating the new entry unmaterialisable — adding the record under `artifacts/`
  broke verification of the real `v1.0.0` checkout in the test suite. It lives beside the evaluator
  instead. This is [ADR 0008](0008-authenticity-guarantees-are-not-retroactive.md)'s fact in another
  costume: a boundary is a property of the release that declared it.
