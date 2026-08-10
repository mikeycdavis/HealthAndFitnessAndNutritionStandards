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

## Post-1.0 workstream — adoption and enforcement

**Dormant until v1.0.0 certification.** This workstream creates no obligation to release, does not
modify the current certification candidate, and must not begin implementation until the
human-attestation and release process for 1.0.0 has completed successfully. `7f59f8b` remains the
baseline against which the eventual certification diff must first be explained.

**It is the first post-1.0 work, ahead of adding more health rules.** The gap this closes is not
coverage of the domain; it is that adherence currently depends on someone remembering to consult the
standards on every project. The end state:

> A project can contain health, fitness, or nutrition work while non-compliant. It cannot
> accidentally represent itself as standards-compliant, and it cannot cross a release boundary
> without satisfying these standards.

The design principle: **centrally governed, locally declared, automatically enforced.** This
repository owns normative truth. An adopter owns applicability, evidence, permitted exceptions, and
attestations — and never a copy of the standards themselves, or there will eventually be twenty
subtly different versions of "the standards".

### Requirements

**1. Organisation-level discovery is mandatory.** Repository-local detection is defence-in-depth
*after* adoption; it is not the mechanism that finds non-adopters. A repo that never adopted has no
policy, no workflow, and no required check — so there is nothing to fail, and local detection is
detecting scope in a project that already opted in.

The org-level process enumerates repositories, identifies potential health/fitness/nutrition
capability, detects absence of adoption, and creates an obligation for an explicit applicability
determination. Candidate signals: health measurement or interpretation, symptoms or health trends,
exercise programming, recovery or readiness, heart rate / blood pressure / sleep / weight / body
composition, dietary or nutrient guidance, hydration, weight change, health predictions, AI-generated
wellness guidance.

**Detection proposes applicability; it never establishes it.** A false-negative detector must not be
able to silently exempt a project, so the output is an obligation to answer, not an answer:

```text
Potential health/fitness/nutrition scope detected.
HealthAndFitnessAndNutritionStandards applicability must be explicitly established.
```

**2. Enforcement must be structurally self-protecting.** The standards status check is required
through branch protection. Code Owner review is required — *and branch protection's "Require review
from Code Owners" must be enabled*, or `CODEOWNERS` documents an expectation and blocks nothing.
`CODEOWNERS` must own itself as well as the policy and workflow surfaces, or the first line of any
bypass is deleting the line that would have caught it.

Prefer GitHub's missing-required-check behaviour to bespoke logic for detecting deletion of the
enforcement workflow: a required check that never reports leaves the pull request permanently
pending, which blocks by construction rather than by a diff-inspecting rule that could itself be
wrong.

Policy semantics — including false-not-applicable handling — remain centrally defined here. An
adopter's CI inherits `BLOCKED_BY_INVARIANT` on an `applicable: true → false` edit for free, which is
an argument for the policy schema staying owned by this repository rather than re-specified per
adopter. The highest-risk change in an adopting repo is not a softened sentence of guidance; it is a
one-line applicability flip.

**3. Any future umbrella has exactly one normative operation: composition.** Specify it before
implementing it. No averaging, no synthesised cross-domain compliance score, no invented intermediate
verdict. Individual domain results are preserved and reported; the aggregate is used only for the
release decision.

`BLOCKED_BY_INVARIANT` from any single domain dominates everything, including other domains'
failures, because a manipulated evaluation makes its downstream result untrustworthy.

**The rest of the precedence ordering is deliberately NOT frozen here.** Only the dominance of
`BLOCKED_BY_INVARIANT` is justified by what is currently known. Writing a complete ordering into this
backlog — `BLOCKED > NON_COMPLIANT > NOT_EVALUATED > COMPLIANT` or any other — would be making
exactly the cross-domain normative decision this requirement warns against, and would do it in a
backlog entry rather than in a design. Derive the remaining precedence from the participating
repositories' actual semantics when the umbrella is designed, and do not infer it from the numeric
order of exit codes.

The composition rule is roughly twenty lines of code and is the entire normative surface of an
umbrella. Its tests should be mostly about that rule.

**4. Releases need machine-readable migration classification.** A pin plus a newer release is not
enough information: a safety correction and a documentation improvement produce identical staleness
under a plain semver pin. An adopter pinned to an older release must not silently become
non-compliant merely because a newer one exists, and must not silently stay green through a
correction that matters.

The reportable state:

```text
COMPLIANT with Health/Fitness/Nutrition Standards v1.0.0
Latest available: v1.1.0
Upgrade evaluation: NOT PERFORMED
```

Post-1.0 design should investigate classes along the lines of `editorial`, `normative`, and `safety`,
including each class's precise adopter obligation — a safety release may make upgrade evaluation
release-blocking where an editorial change should not. **Do not commit to those three names until
their semantics are specified.** This is the piece of the workstream that cannot live in adopter
tooling; it is a change to this repository's release process.

**5. Development and release execute the identical evaluation.** Same command, same policy, same
rule states, same exit codes. Only the external gate's accepted result set differs — `NOT_EVALUATED`
may be tolerated during ordinary development and must not be tolerated at a release gate. **No
`check-dev` versus `check-release` semantic fork.** Two commands drift; one command with two
acceptance sets cannot. This is the same reason `plan()` and `apply()` share one code path here, so a
dry run structurally cannot diverge from the apply it predicts.

**6. Adoption must pin an actual immutable release.** No tooling may treat `1.0.0-dev`, `main`, or the
current certification candidate as adoptable merely because the implementation is otherwise complete.
Certification is what makes a version adoptable, not completeness.

**7. Bootstrap is idempotent and non-authoritative about applicability.** An eventual `init` may
install the policy structure, agent instructions, CI workflow, evidence and attestation locations,
and the version pin; identify applicable standards; identify prohibitions **before** implementation;
produce an honest initial `NOT_EVALUATED`; and state exactly what evidence or review is missing.
Running it again reconciles the integration rather than overwriting project decisions.

It must not convert heuristic detection into an applicability judgement — see requirement 1.

**8. Protect the actionable surfaces first.** Adoption testing prioritises policy files, the CI
workflow, branch-protection assumptions, `CODEOWNERS`, attestation instructions, version and
migration metadata, and agent instructions — before descriptive documentation.

The reason is evidence, not architecture. Both defects found late in 1.0.0 certification were on
surfaces someone acts on: `project-policy.yml`'s attestations comment named a rule that is not
attestable, which would have sent a certifier to trigger `BLOCKED_BY_INVARIANT`; and the README's
verdict table stated a false definition of `COMPLIANT`. The drift test that existed covered
`PROJECT.md` and `CHANGELOG.md` — files that describe — and caught neither. Both are recorded in
[CHANGELOG.md](CHANGELOG.md).

### Agent instructions, as a deliverable of this workstream

Requirement 7's `init` should *generate* the adopting repository's agent instructions rather than
expecting a human to paste them correctly. The substance, to be specified properly during design:
determine applicability, run the check, identify prohibitions before implementing, refuse to
implement anything violating a prohibition or invariant, never weaken or reclassify a standard to
permit a desired implementation, preserve `NOT_EVALUATED` rather than manufacture compliance, re-run
the check afterwards, and never claim compliance merely because automated checks passed.

The workflow that produces is `applicability → prohibition scan → plan → code → check → evidence`,
rather than `code → maybe remember the standards later`. The difference is the point of the
workstream.

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
