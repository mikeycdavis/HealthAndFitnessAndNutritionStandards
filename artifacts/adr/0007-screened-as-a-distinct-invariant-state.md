# 0007 — `screened` as a distinct state for mechanically bound invariants

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project owner, on a defect raised during release certification for 1.0.0

## Context

Release certification for 1.0.0 ran `standards check` against this repository and asked whether the
release criterion — "`COMPLIANT` with all guards and tests green" — could be met. It could not, and
the reason was not this repository's state. It was a specification defect.

**`COMPLIANT` was unreachable by any project, forever.**

Four decisions, each individually correct, composed into an impossible state:

```text
The integrity invariant is applicable to every project      (Standard 42; no project is exempt)
+ it is manual-review                                        (no machine establishes integrity)
+ it can never be attested                                   (ADR 0003; self-certification is worthless)
+ any applicable required rule that nothing established
  yields NOT_EVALUATED                                       (the false-green fix, M4)
= COMPLIANT is unreachable
```

Verified by constructing the most favourable case possible: every attestable rule attested, every
other non-invariant rule declared not-applicable, no findings at all. The result was still
`NOT_EVALUATED`, blocked solely by `integrity.no-standards-manipulation`.

The same run showed the reporting was also **factually wrong**. `screenIntegrity` executes nine
distinct checks against Standard 42 on every `check` run — confirmed by observing it fire on a
manipulated policy and stay silent on a clean one. Reporting a rule as *not evaluated* when the
evaluator has just run nine checks against it is not conservative; it is inaccurate.

## Decision

**Introduce a per-rule state `screened`, available only to invariants with a mechanically bound
screening implementation.**

```text
Ordinary manual-review rule, no acceptable attestation   → not-evaluated
Integrity invariant, screening completed, nothing found  → screened
Integrity invariant, manipulation detected               → blocked (BLOCKED_BY_INVARIANT, exit 3)
Integrity screening could not execute                    → not-evaluated
```

`screened` is defined narrowly, and the definition ships in the code as `SCREENED_MEANING` so every
surface renders the same words:

> All implemented integrity checks applicable to this evaluation completed and detected no integrity
> violation. This does not establish that no undetectable manipulation occurred, and it is not human
> attestation of the invariant.

### Verdict semantics

`screened` is **not** `passed`. It does not enter the score numerator or denominator, and it does not
trigger `NOT_EVALUATED`. It is its own bucket in the assurance breakdown, which continues to sum to
the number of applicable rules.

The asymmetry this preserves is the whole point:

```text
absence of detected manipulation  → weak evidence  → screened
presence of detected manipulation → decisive       → BLOCKED_BY_INVARIANT
```

A project can therefore reach `COMPLIANT` with the invariant `screened`, and the output states that
explicitly rather than letting the word `COMPLIANT` quietly absorb Standard 42.

### Eligibility is mechanical, and deliberately not extensible

`INVARIANT_SCREENS` in `scripts/compliance.mjs` maps an invariant's rule id to the checks that
constitute its screen. A rule may report `screened` only when **all** of these hold:

1. `kind: "invariant"` in the catalog;
2. an entry in `INVARIANT_SCREENS`;
3. every check that entry names actually executed on this run.

The risk this guards against is stated plainly because it is the likely one: in six months somebody
will observe that `health.no-false-reassurance` has "some regex checks" and propose calling it
screened. That must not be possible. A regex over prose is not a screening implementation, and a rule
about an adopter's guidance is not a meta-invariant about the evaluation. Tests assert that no
non-invariant can acquire a screen, and that removing or bypassing the screen returns the invariant
to `not-evaluated` rather than leaving it `screened`.

## Alternatives considered

### Rejected: retire `COMPLIANT` from the verdict vocabulary

Accept that the best attainable state is `NOT_EVALUATED` with zero failures, and document it.

Superficially the more austere and therefore more honest choice. Rejected because it is less truthful
in practice. If every correctly configured adopter inevitably receives `NOT_EVALUATED`, the state
stops communicating uncertainty and becomes boilerplate — and operators learn to read it as
"everything is fine", which destroys exactly the distinction it was created to preserve.

This repository already argues the same point about a different mechanism: a stale attestation digest
is not treated as tampering, because a guard that fires on ordinary edits is one people route around
(`screenIntegrity`, and Standard 3 R4 on alarmism). A permanently amber signal is not conservative.
It is a signal nobody reads.

### Rejected: make the invariant attestable

Would make `COMPLIANT` reachable by letting a human sign off on the invariant. Rejected on ADR 0003's
original grounds, unchanged: an attestation that we are not manipulating standards is
self-certification of precisely the thing under suspicion.

### Rejected: give the invariant `recommended` strength

Would remove it from the required set and unblock `COMPLIANT`. Rejected because it weakens the
invariant to solve a reporting problem, which is itself the pattern Standard 42 forbids.

## Consequences

- `COMPLIANT` is reachable. A project that satisfies its requirements, has its prohibitions attested
  or legitimately not-applicable, and shows no detected manipulation, now gets the verdict it earned.
- **This repository still reports `NOT_EVALUATED` and exits 4**, because four rules here genuinely
  require human review and have not had it. That is correct and was the test of whether the fix was
  narrow enough: a change that turned this repository green would have been too broad.
- `screened` is visible in the JSON envelope (`integrityScreen`, and the per-rule state), in the
  human rendering of `check`, in `status`, and in `explain`.
- The verdict output must continue to display the invariant's state explicitly. Hiding Standard 42
  behind the word `COMPLIANT` would reintroduce the overclaim from the other direction.
- The frozen 1.0 baseline is untouched: 42 standards, 59 rules, 34 prohibitions, 1 invariant. This
  changes how one rule's state is *reported*, not what any rule *says*.

## Note on process

This was found by a release review doing its job, and it is recorded here rather than patched
quietly. Two individually reasonable invariants composed into an impossible state, and no test caught
it because every test asserted behaviour that was locally correct. The specification defect was
reachable only by asking a question none of the tests asked: *can the system ever emit this verdict
it defines?*

A regression test now asks exactly that.
