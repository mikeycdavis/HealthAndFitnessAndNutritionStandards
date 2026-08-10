# Backlog

Work identified but deliberately not done. Each entry says why it was deferred, because "we decided
not to" and "we forgot" look identical six months later.

## Deferred from the 1.0.0 release review

Both were raised by the independent content reviewer and both were classified by them as
non-blocking — a *documentation improvement* and an eventual *tightening*, not defects.

**They are deferred for a second reason worth stating.** Both would edit standards prose that the
reviewer has already issued a disposition against. Changing reviewed content after the disposition
and before the attestation would leave a human attesting material nobody reviewed in its current
form. The evidence chain in
[`artifacts/release-review/dispositions.md`](artifacts/release-review/dispositions.md) names specific
commits precisely so that cannot happen quietly. Neither change is worth breaking that for.

### 1. Standard 2 R2 — "establishes" carries two meanings

`standards/02-trend-over-event.md` R2 says of the red-flag exception:

> a single observation genuinely establishes that something needs attention

The reviewer's finding: defensible, because the object being established is the *need for attention*
rather than a physiological conclusion — but *"is sufficient to require attention"* would make that
distinction harder to misread.

This matters because it is the hinge of the whole exception. The reviewer's formulation of why the
override is coherent:

> A red flag does not make one observation sufficient to establish the underlying medical pattern.
> It makes one observation sufficient to establish a **decision obligation** because the cost of
> waiting is asymmetric.

The current wording invites reading "establishes" the way the rest of the standard uses it, which is
the sense the exception specifically does *not* claim.

**Not release-blocking** (reviewer's classification). Do this in the same pass as anything else that
touches Standard 2, and re-review the exception's three statements together — Standard 2 R2,
Standard 12 R1, and Standard 3 R3 — since they must continue to agree.

### 2. Observation cadence and decision cadence are separate choices

`standards/32-energy-balance.md` R5 says frequent weighing beats rare weighing, *provided* the
average is what is read. That is the opposite of a careless reading of the trend-over-event
principle, and the distinction it rests on is implicit in one sentence and stated nowhere else.

The reviewer's formulation, which generalises past body weight:

> **Observation cadence and decision cadence are separate choices. More frequent measurement does
> not imply more frequent interpretation or intervention.**

The natural home is [Standard 2](standards/02-trend-over-event.md), as a requirement alongside R4 and
R5, with Standard 32 R5 and Standard 8 R3 pointing at it. It would also give
`standards/31-trend-based-progress.md` R3's review-cadence argument a principle to cite rather than
restating it.

**Not release-blocking** (reviewer's classification: documentation improvement). Adding a requirement
to Standard 2 changes the 59-rule inventory only if it becomes a catalogued rule; as prose inside an
existing standard it does not. Decide which before starting — the frozen baseline is
42 standards / 59 rules / 34 prohibitions, and it is not changed casually.

## Deferred from earlier

### 3. A worked violating example for `nutrition.no-single-food-disease-claims`

The prohibition has no worked negative example. The reviewer classified this as a **documentation
opportunity, not a defect** — an adopter can determine the prohibited boundary from Standard 14 R3,
Standard 37 R1, and Standard 37 R5 without one, and *examples should demonstrate semantics, not
create them*.

Explicitly **not** created by that finding: a rule that every prohibition must carry a worked
negative example. Three others lack one —
`nutrition.no-starvation-approaches`, `nutrition.no-identical-response-assumption`,
`nutrition.no-scale-change-as-fat-change`. That invariant was considered and rejected; do not
reconstruct it from this entry.

If written, the reviewer's suggested shape:

```text
Acceptable:
"Dietary patterns are associated with cardiovascular risk."

Potentially acceptable with strong evidence:
"Regular consumption of X is associated with Y outcome."

Prohibited:
"X prevents heart disease."  /  "X cures diabetes."
```

### 4. The allergen check

`standards/41-dietary-restrictions-and-context.md` R2 names this as the one place in the series where
a mechanical check would straightforwardly earn its place, and its Implementation section explains
why none exists: it needs a project's food data and stored restrictions, which these detectors do not
have — they read a repository's documents, not its runtime data.

> A check that appeared to verify allergen safety without that access would be the most dangerous
> false green this system could produce, so none is offered.

Any future attempt must solve the access problem first. A partial implementation here is worse than
nothing.
