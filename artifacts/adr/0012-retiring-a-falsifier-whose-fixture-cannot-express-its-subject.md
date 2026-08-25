# 0012 — Retiring a falsifier whose fixture cannot express its subject

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** project owner (Michael Davis), on execution evidence produced while opening ST-14

## Context

This repository commits falsifiers before remedies, and holds a hard rule about what may happen to
them afterwards. `test/release-identity.test.mjs` states it:

> A falsifier may not be deleted, weakened, rewritten to assert something easier, or moved out of the
> default test run. Doing any of that to reach a green build is the "falsify evidence for" clause of
> `integrity.no-standards-manipulation`, applied to this repository's own maintenance rather than to
> an adopter's.

FE-13's completion property applied it: the feature could not close while any of its four falsifiers
was still `todo`, and closing required converting all four **unchanged**.

Three converted. The fourth — correct tag, correct `VERSION`, one modified standards file — did not,
and on 2026-08-16 execution established why, in a way reading had not.

The fixture obtains its pack by checking out `v1.0.0`:

```js
spawnSync("git", ["clone", "--local", "--quiet", REPO, dir]);
spawnSync("git", ["-C", dir, "checkout", "--quiet", "v1.0.0"]);
…
check(dir, adopter);            // the evaluator executed is v1.0.0's
```

So the code under test is always `v1.0.0`'s, which predates the release-identity mechanism.
[ADR 0008](0008-authenticity-guarantees-are-not-retroactive.md) says a release cannot acquire a
guarantee written after it. Therefore **no future release changes what this body exercises**, and the
2026-08-16 revision that made the falsifier release-bound — "exercised against that release and
converted unchanged" — named a release the fixture does not execute. The completion rule, as written,
could never be discharged.

Two runs, recorded because "old" and "invalid" are different claims and only the second justifies
retirement:

```text
same-volume, clone succeeds     executes the v1.0.0 evaluator
                                standardVersion: "1.0.0"  ->  assertion 2 FAILS
                                the fixture permanently cannot satisfy its intended condition

cross-volume, --local clone     "failed to create link ... Improper link"  (Windows, F: -> C:)
  fails, fallback taken         the fallback copies the working tree without .git
                                UNIDENTIFIED_RELEASE / no-repository  ->  both assertions PASS
                                an apparent pass exercising neither intended condition
```

The second is the worse finding. The fixture is not merely bound to the wrong release: it is
non-portable and semantically unstable, giving opposite answers in the two environments this
repository runs in, and giving the reassuring one on the developer's machine. Under `todo` neither
outcome was visible.

## Decision

**A precommitted falsifier may be retired only when evidence establishes that its fixture cannot
express the property it was intended to test. Retirement may not weaken or delete the underlying
obligation. The original test remains preserved, the reason for retirement is recorded, and
replacement evidence must cover the same subject before the owning feature can close. A falsifier
that merely remains red against a correct fixture is not eligible for retirement.**

The boundary that rule draws is the whole of it: *the implementation made this inconvenient* is not a
reason, and *the experiment itself is invalid* is. Only the second is a statement about the fixture,
and only a statement about the fixture can be settled by evidence rather than by preference.

Applied to FE-13's fourth falsifier:

| Clause | How it is satisfied |
| --- | --- |
| the fixture cannot express its subject | the two executions above, and ADR 0008 |
| the original is preserved | `test/retired/fe-13-falsifier-4.retired.mjs`, byte for byte, digest-pinned |
| the reason is recorded | in that file's header, in this ADR, and in FE-13 |
| the obligation is not weakened | R1 asserts the same subject of the current evaluator; R2 certifies the real release |
| not merely red against a correct fixture | it is *green* on one platform, for a reason unrelated to its subject |

FE-13's completion property is revised accordingly, in the open: falsifiers 1–3 remain unchanged
ordinary regression tests; the fourth is retired; the feature closes when R1 is green and R2 has
passed against the first release containing the mechanism.

## Alternatives considered

**Keep it `todo` indefinitely.** Honest about the state and wrong about the reason — it would report
"pending work" for a condition no work can reach, and the suite's notion of pending would slowly come
to mean "and also some things that are finished". Retirement is a disposition; `todo` is a schedule.

**Parameterise the release the fixture checks out.** The smallest change that would make it
satisfiable, and forbidden by the rule it exists under: rewriting a falsifier so it passes is the act
the rule names, and the fact that the rewrite is small is not a mitigation but the reason the rule has
to be absolute.

**Delete it and rely on R1.** R1 does assert the subject, but the record of why the original could not
would be gone, and the next person to meet a stubborn falsifier would have no worked example of the
boundary. Preservation is what makes this an ADR rather than a cleanup.

**Widen `MATERIAL` or otherwise change the implementation so the old fixture passes.** Changing the
system to satisfy a broken measurement, which inverts the direction evidence is supposed to travel.

## Consequences

- A third disposition exists for a falsifier — converted, still red, or retired — and the third is
  narrow, evidenced, and reviewable. It is the second time this repository has revised a rule rather
  than a test (ADR 0008 was the first), which is precisely when the boundary needs writing down.
- Retirement is mechanically checked. `test/release-material-binding.test.mjs` pins the specimen's
  bytes by digest and asserts it stays out of the test command, so "retired" cannot decay into
  "deleted" or "adjusted" without a red build.
- FE-13 remains open, and now for a reason that can actually be discharged: R2 against the first
  release containing the mechanism.
- The class of defect the second execution exposed — a fixture with a fallback path, reporting on
  whichever subject it happened to take — is worth looking for elsewhere. `test/helpers/scratch-release.mjs`
  is written with no fallback for that reason.
