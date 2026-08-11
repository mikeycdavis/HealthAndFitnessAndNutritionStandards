# Release-review dispositions

Independent content-review results for the four rules that apply to this repository and that no
machine evaluates.

**A disposition is not an attestation.** None of these supplies a `reviewedBy` human identity, and
none of them makes `standards check .` report anything different. A human reviewer may use a
disposition and its evidence chain when deciding whether to record an attestation in
`project-policy.yml`; the human's acceptance is what becomes the attestation, and
`reviewedAgainst.paths` should name both the reviewed material and the packs that framed it.

---

# Certification baseline and verification order

**Read this before the dispositions below, and act on it before inspecting any verdict.**

The prediction recorded later in this file answers *what states should result*. It does not, on its
own, preserve *what procedure makes observing those states trustworthy*. Without the second, a
certifier can follow every written instruction and still perform the validation in the epistemically
weaker order — checking the verdict first, then reading the diff as confirmation of a conclusion
already reached.

```text
Certification baseline: 7f59f8b

Before inspecting or comparing the candidate repository's resulting
per-rule states or overall verdict:

1. Diff the certification candidate against 7f59f8b.
2. Explain every post-baseline change and determine whether it can
   affect standards content, applicability, evidence, attestations,
   evaluation, integrity screening, or verdict computation.
3. Verify that reviewed evidence named by the dispositions has not
   changed since review.
4. Only after the diff has been independently explained, run/inspect
   the evaluation and compare its per-rule states with the prediction
   recorded below.
5. Only after the per-rule states match may the overall verdict be
   considered as release evidence.

A benign post-baseline commit does not advance the certification
baseline. It remains part of the diff and must be explained.

A COMPLIANT verdict or matching predicted state is not evidence that
an unexplained diff is acceptable.

If an unexplained or verdict-affecting change is found outside the
intended human attestations and later explicitly authorized release
mechanics, certification stops until that change is resolved or
reviewed.
```

**The baseline does not move.** `7f59f8b` is valuable precisely because it predates the benign
changes below, and therefore forces a certifier to demonstrate that they are benign. Advancing it
would erase the first evidence that this procedure works.

## Known post-baseline changes

Each must still be explained by the certifier under step 2; listing them here is a starting point,
not a substitute for the diff.

```text
cc0c6de
BACKLOG.md only.
Dormant post-1.0 adoption/enforcement design.
Does not alter reviewed content or verdict inputs.

<the commit that added this section>
dispositions.md only.
Adds the previously precommitted certification baseline and
verification procedure.
Does not alter a substantive disposition, reviewed content,
or verdict input.

<the commit that added this entry>
artifacts/backlog/** and dispositions.md only.
Introduces a 35-item backlog representing work that already
exists: completed 1.0.0 build and review, blocked human
attestation and release mechanics, deferred post-1.0 and
content work.
Does not alter reviewed standards content or any disposition.
Does not alter policy, applicability, attestations, evidence,
the evaluator, or any other verdict input.
Backfills existing state; creates no new pre-1.0 obligation.
The certification feature remains blocked on the human steps;
post-1.0 work remains deferred.

Backlog validation passes and all recorded evidence resolves.
Reconciliation is INCOMPLETE, not clean: this repository has
no merged-PR history, so the PR-dependent reconciliation
checks cannot establish agreement with merged work. Do not
read "no inconsistencies" as "reconciled".

<the commit that recorded the attestations>
VERDICT-AFFECTING BY DESIGN. The only one of these entries
that is.
Four attestations added to project-policy.yml by Michael
Davis, 2026-08-11, all approved, each with reviewed paths
and a digest. Reasoning in attestation-2026-08-11.md.
NOT_EVALUATED/exit 4 -> COMPLIANT/exit 0.
Also in this commit, and NOT verdict-affecting: PROJECT.md,
CHANGELOG.md, and project-policy.yml's attestations comment,
each of which became false when the verdict moved; three
tests updated to assert against tool output rather than
against the old state. None of those files is read by the
evaluator.
No standards content, catalog, schema, detector, evaluator,
applicability declaration, or exception changed.

WITHDRAWN by the commit immediately after it. Do not certify
ad6bdcb. See the entry below.

<the commit that withdrew them>
VERDICT-AFFECTING. Returns the verdict to where it was.
attestations back to {}; COMPLIANT/exit 0 -> NOT_EVALUATED/
exit 4; the four rules back to awaiting evidence.
Reason: the reviewedBy identity at ad6bdcb was written on the
authority of a draft supplied by the reviewing agent, which
cannot confer human authority. The attestations asserted a
human judgement whose author could not be established.
The content was NOT the defect: the dispositions were sound,
the per-rule states matched the frozen prediction exactly,
and every gate was green.
Correction applied to the input, not the machinery. No
disposition, standard, catalog entry, detector, or evaluator
line changed in either direction.
Also here, and not verdict-affecting: PROJECT.md, CHANGELOG.md,
the attestations comment, two tests, and the backlog, all
returned to describing a repository awaiting human review.
```

The last two entries are the ones this procedure was written for, and they are the only ones where
"explain the diff" was real work rather than a formality. The others could not have moved the verdict.

**And the procedure as written was still not enough.** At `ad6bdcb` it turned green for exactly the
four expected inputs: the invariant stayed `screened`, `health.evidence-quality-noted` still carried
no evidence, every mechanical gate was unchanged, and the per-rule states matched the frozen
prediction line for line. It was wrong anyway. The `reviewedBy` identity rested on a draft rather
than on the person named, so the input was the expected *kind* of input without being the expected
*thing*.

Step 4 therefore has a second half. It is not only **did it turn green for exactly this evidence**
but **is this evidence what it claims to be** — and for an attestation that means: did the named
person decide, personally, and does the record derive its authority from them rather than from
anything written on their behalf. No gate in this repository can answer that. A certifier who
confirms the verdict, confirms the states, and stops, would have certified `ad6bdcb`.

The second, third, and fourth entries name no hash because they could not: no such commit existed
when its own text was written, and inventing one would be the same defect as the hash that was
corrected at `6c57a12`. Find them with:

```bash
git log --oneline -- artifacts/release-review/dispositions.md
```

Recording it at all matters because otherwise the procedure's own introduction becomes an unexplained
change under the procedure it introduces.

### Why this section exists

It was missing. The four dispositions, the frozen prediction, and the five post-attestation steps
were all recorded; the baseline commit, the diff-before-verdict ordering, and the non-advancement
rule existed only in conversation. That is an operational instruction absent from the surface a
certifier acts on — the third instance in this release of the same failure class, after
`project-policy.yml`'s attestation comment and the README's definition of `COMPLIANT`.

It is a further concrete instance supporting requirement 8 of the post-1.0 workstream in
[BACKLOG.md](../../BACKLOG.md), and deliberately not a new requirement: actionable-surface priority
is already recorded there.

---

## `health.no-fabricated-medical-facts` — ESTABLISHABLE

```text
health.no-fabricated-medical-facts

Independent content-review disposition:
ESTABLISHABLE

Initial review:
DEFECTIVE

Remediation reviewed:
79d39d1

Basis:
The empirical corpus was reviewed at claim granularity.
No fabricated physiological mechanism was identified.
Claims found to exceed their evidentiary support were remediated
at the content layer without weakening the governing rule or evaluator.
Focused rereview finds the blocking defects resolved.
```

**Evidence chain.** [Pack 03](03-health-no-fabricated-medical-facts.md) framed the review ·
[pack 03a](03a-claim-extract.md) supplied the 191 claims verbatim ·
[pack 03b](03b-remediation-diff.md) is the before/after for the thirty that changed.

**Review history.**

| Step | Outcome |
| --- | --- |
| Pack 03 delivered | Reviewer declined to review from categories and exemplars; required the claims themselves |
| Pack 03a delivered (`18a7e8a`) | Corpus corrected from 73 to 191 entries / 182 distinct |
| First disposition | **DEFECTIVE** — six blocking findings, eight non-blocking |
| Remediation (`79d39d1`) | Content narrowed or reframed; rule, evaluator, and policy untouched |
| Focused re-review of the thirty changed claims | **ESTABLISHABLE** |

**What the reviewer recorded about the nature of the defects.** No invented physiology was found.
Every defect was a real finding stated past its evidence — the failure
[Standard 14](../../standards/14-evidence-quality.md) R2 names as the most common one, written by an
author who had read R2 while writing it.

### Finding raised outside the reviewed corpus

`standards/30-adherence.md` R1 previously read *"the first wins by a margin that no programming
refinement approaches"* — characterised by the reviewer as rhetorical quantification masquerading as
comparative magnitude. It was outside the 182-claim corpus and was explicitly **not** used to reject
the rule. Corrected on its own merits:

> A suboptimal plan that is consistently performed can outperform an optimal plan that is abandoned,
> and over a long enough horizon it usually does.

---

## `escalation.tier-language-calibrated` — ESTABLISHABLE

```text
escalation.tier-language-calibrated

Independent content-review disposition:
ESTABLISHABLE

Initial review:
DEFECTIVE

Remediation reviewed:
d47e389

Basis:
The four-tier calibration series was reviewed as a whole.
The initial Tier 4 example improperly softened temporal urgency
while attempting to preserve a calm register.
The remediation now separates tone from action horizon:
calm is constant; urgency is not.
Tier 4 gives unconditional immediate-action guidance for the
worked presentation, does not infer safety from symptom resolution,
and places reassurance after the action.
Tier 2 now separates prompt proper remeasurement and professional
contact from completion of the longer monitoring series.
No governing rule, tier definition, detector, or evaluator was
weakened to obtain this disposition.
```

The initial disposition, for the record:

```text
Initial: DEFECTIVE

Established:
- normative four-tier model
- anti-alarmism principle
- Tier 1 calibration
- Tier 3 calibration
- Tier 2 classification itself

Remediation required:
1. Tier 4 must direct immediate evaluation rather than
   making "today" the primary action horizon.
2. Emergency/EMS language must not depend solely on
   symptoms recurring at rest or acquiring additional features.
3. Preserve reassurance only after immediate action is clear.
4. Tighten Tier 2 so repeated properly measured ~148/94
   readings prompt professional contact without requiring
   completion of a 1–2 week series.
```

**Evidence chain.** [Pack 01](01-escalation-tier-language-calibrated.md) framed the review ·
[pack 01a](01a-tier-language-corpus.md) supplied the four records complete, in tier order ·
[pack 01b](01b-remediation-diff.md) is the before/after.

**Remediation:** `d47e389`. All four items addressed. The reviewer's central formulation — *calm is
constant, urgency is not* — was added to Standard 3 R4 itself, to `docs/escalation-tiers.md`, and to
the example's own note, because R4's prose is what adopting projects imitate and a miscalibration
there propagates.

**Why this finding was worse in kind than the first.** `health.no-fabricated-medical-facts` failed on
claims stated past their evidence. This failed on a principle correctly stated and then over-applied,
in the highest-consequence document in the repository, by the author who wrote the principle. R4 said
do not create alarmism; the record removed alarm and removed urgency with it, because nothing in the
standard distinguished the two.

**No test was added, and none could be.** The tier detector checks that exactly one canonical label
appears. The label was always correct — *potentially urgent*. The defect was entirely in what the
record then told the reader to do. That is what `assurance: none` means on this rule.

The reviewer endorsed the absence of a detector explicitly, and the reasoning is worth keeping: a
check asserting that words like `now` or `emergency services` occur would be *worse* than none,
because it would manufacture partial assurance over something whose correctness depends on the whole
presentation. `manual-review` at `assurance: none` is the epistemically stronger position, not a gap
to be closed later.

## Release consequence of the first two dispositions

Two of the four rules are now **substantively establishable, pending human attestation**. Neither
disposition is an attestation, neither supplies a `reviewedBy` identity, and `standards check .` is
unchanged at exit 4.

## `nutrition.no-single-food-disease-claims` — ESTABLISHABLE

```text
nutrition.no-single-food-disease-claims

Independent content-review disposition:
ESTABLISHABLE

Reviewed:
- artifacts/release-review/04-nutrition-no-single-food-disease-claims.md
- artifacts/release-review/04a-single-food-claims-corpus.md
- relevant material previously reviewed through the rule-03 evidence chain

Basis:
No single-food causal or curative complex-disease claim was identified
in the repository.

The prohibition itself defines the prohibited boundary and explicitly
distinguishes it from legitimate discussion of diet and disease.

The nutrition domain reinforces the boundary through its pattern-based
account of dietary quality and its cross-reference to Standard 14.

The finite named-food scan is corroborating evidence rather than proof
of absence.

Standard 35 R2 does not cross the boundary: it describes fibre as a
qualified proxy for dietary-pattern characteristics, not a food as a
cause or cure of disease.

The absence of a worked violating example is a documentation
opportunity, not a release-blocking failure to operationalise the rule.
```

**No remediation.** This is the first of the four rules to establish on first review.

### The missing worked example — resolved as an opportunity, not a defect

The distinction the reviewer drew: a defect would mean an adopter cannot reliably determine the
prohibited boundary without the example. They can — Standard 14 R3 defines the prohibited structure
and distinguishes it from permitted discussion, Standard 37 R1 supplies the pattern-based model,
Standard 37 R5 reconnects the two and names toxic/curative framing as the error, and Standard 36
routes supplement claims through the same machinery. **Examples should demonstrate semantics, not
create them.**

**No example will be added before 1.0.** Adding one solely to clear a review that did not require it
would be release work invented by the review process rather than by the standard.

**A release invariant was explicitly not created.** Three other prohibitions also lack worked
violating examples — `nutrition.no-starvation-approaches`,
`nutrition.no-identical-response-assumption`, `nutrition.no-scale-change-as-fat-change`. The reviewer
declined to let this review generate a new rule that every prohibition must carry a worked negative
example. That was not part of the reviewed architecture and this review produced no evidence that it
needs to become one. Recorded here so a later reader does not reconstruct the invariant from the
finding.

If an example is written later, the reviewer's suggested shape — illustrative future documentation,
not a release condition:

```text
Acceptable:
"Dietary patterns are associated with cardiovascular risk."

Potentially acceptable with strong evidence:
"Regular consumption of X is associated with Y outcome."

Prohibited:
"X prevents heart disease."  /  "X cures diabetes."
```

### Two secondary questions, both resolved without change

- **Standard 35 R2** contains neither side of the prohibited construction. It is
  nutrient → dietary-pattern proxy, qualified in the same paragraph, and was already reviewed for
  evidence strength under rule 03 (C137, C138). Left alone.
- **Catalog placement against Standard 14 is correct.** The operative phrase is *without strong
  evidence*; a sufficiently well-supported single-food claim is deliberately not prohibited, which
  makes this an evidence rule rather than a nutrition one. Standard 37 R5 supplies enough
  discoverability from the nutrition domain, and the rule is not duplicated into a second standard.

## `trend.trends-over-events` — ESTABLISHABLE

```text
trend.trends-over-events

Independent content-review disposition:
ESTABLISHABLE

Reviewed:
- artifacts/release-review/02-trend-trends-over-events.md
- artifacts/release-review/02a-trend-corpus.md
- current worked records after d47e389

Basis:
The repository consistently distinguishes observations from patterns
and limits the conclusions each can support.

The red-flag single-event override is coherent because it establishes
an action obligation under asymmetric consequences, not an underlying
diagnosis or physiological trend.

Short-term body-mass change as a rough fluid proxy and longer-term
body-weight interpretation are not contradictory: they have different
inferential targets, explicitly cross-reference one another, and state
the relevant caveats.

Accumulated individually weak observations can legitimately increase
concern because their trend carries evidence that no individual
observation carries.

Frequent observation is also compatible with trend-based reasoning:
measurement cadence and interpretation/decision cadence are distinct.

No governing rule, exception, detector, or evaluator requires
modification to obtain this disposition.
```

**No remediation.** The reviewer's unifying reading, worth preserving because it resolves all three
tensions at once and is sharper than anything the standards themselves say:

> The principle governs what a body of evidence is sufficient to establish — not how slowly the
> system must respond.

**An unintended consequence of the tier remediation, noted by the reviewer.** The `d47e389` changes
were made for `escalation.tier-language-calibrated` and strengthened *this* rule. The old tier-two
record risked using the trend principle as permission to delay an independently justified action —
"we don't have a trend, therefore wait". It no longer does. And the tier-four record now demonstrates
the inverse: requiring a trend where the action threshold is already crossed would itself violate the
framework.

---

# Summary

| Rule | Initial review | Final disposition |
| --- | --- | --- |
| `health.no-fabricated-medical-facts` | **DEFECTIVE** | **ESTABLISHABLE** after remediation (`79d39d1`) |
| `escalation.tier-language-calibrated` | **DEFECTIVE** | **ESTABLISHABLE** after remediation (`d47e389`) |
| `nutrition.no-single-food-disease-claims` | — | **ESTABLISHABLE** |
| `trend.trends-over-events` | — | **ESTABLISHABLE** |

Two reviews found real defects, including a safety-significant one in tier-four escalation language.
**The content moved. The rules and the verdict machinery did not.** The other two survived
substantive challenge without any work being invented to manufacture a pass.

---

# What a human must now decide

The dispositions above are **not attestations**. Each was produced by an agent, none carries a human
`reviewedBy` identity, and no agent may supply one — writing a human's name into an attestation they
did not give is the "falsify evidence for" clause of the invariant being attested.

A human reviewer decides whether these four dispositions and their evidence chains are sufficient to
record four attestations in `project-policy.yml`. `INSTRUCTIONS.md` describes the shape; each needs a
real `reviewedBy`, a `reviewedAt`, non-empty `evidence`, and `reviewedAgainst.paths` naming both the
reviewed material and the pack that framed it.

## The attestation dry run

Run in a scratch copy of the repository at `0acc6cc`, with four attestations added and **nothing else
changed**. The repository's own `project-policy.yml` was not touched; the scratch copy was deleted
afterwards. Recorded here because the reviewer set the correct release test — not whether `check`
turns green, but whether it turns green *for exactly those four inputs*.

```text
Status: COMPLIANT
Score:  100%  (rules at required strength that were evaluated: 6)
Rules:  7 passed, 0 failed, 0 warning(s), 51 skipped
Cover:  3 automated, 4 manual-review, 1 not-evaluated, 1 screened

Integrity: integrity.no-standards-manipulation — screened
  9 integrity check(s) ran; none detected a violation.

Framework: 59 rules across 31 of 42 standards;
           21 have an implemented check; 3 standards are fully machine-represented.
exit: 0
```

Per-rule, everything not declared not-applicable:

```text
passed    evaluated        escalation.scope-disclosed
passed    evaluated        escalation.tier-model-documented
passed    attested         escalation.tier-language-calibrated
passed    attested         health.no-fabricated-medical-facts
skipped   not-evaluated    health.evidence-quality-noted
screened  screened         integrity.no-standards-manipulation
passed    attested         nutrition.no-single-food-disease-claims
passed    attested         trend.trends-over-events
```

**What this confirms.** Exactly the four attestations move the verdict. The invariant reports
`screened` rather than `passed` or `attested`, which is the only state it can reach. All mechanical
gates stay green. Nothing else moved.

**What it also discloses, and a human should weigh before recording anything.**
`health.evidence-quality-noted` remains `not-evaluated` in the COMPLIANT state. It is a
*recommendation*, so it does not force `NOT_EVALUATED` and does not enter the score — that is the
designed behaviour, not a bug. But it means **`COMPLIANT` here would be reached with one applicable
rule still carrying no evidence at all**, and anyone recording the attestations should know that
rather than discover it later. It is the clearest live illustration of the repository's own warning:
a verdict says what was checked passed; it does not say everything was checked.

## After attestation, if it is recorded

1. `VERSION` moves from `1.0.0-dev`.
2. The `|| [ $? -eq 4 ]` condition comes out of the CI `check` step, along with the comment
   explaining it.
3. `PROJECT.md`, `CHANGELOG.md`, and `project-policy.yml`'s attestation comment all describe a
   repository with zero rules awaiting evidence — and two tests compare that prose to
   `standards status` output, so getting it wrong fails the suite rather than shipping.
4. Tag 1.0.0.

None of that is an agent's decision to make.

---

## Release state as of `0acc6cc`

All four rules have an independent disposition; none has an attestation. `standards check .` reports
`NOT_EVALUATED` and exits 4. That is the correct state and it is left that way. Nothing is tagged.

## Release state after the withdrawal

All four rules have an independent disposition and **no** attestation. `standards check .` reports
`NOT_EVALUATED` and exits 4. `VERSION` is `1.0.0-dev`, CI still tolerates exit 4, nothing is tagged.
That is the same state as at `0acc6cc`, reached by a different route.

`ad6bdcb` remains in history and must not be certified. It is kept because it is the strongest
evidence this repository has produced about its own procedure: a candidate can satisfy every
mechanical gate, match every predicted per-rule state, and still be uncertifiable on the provenance of
its inputs.

What a valid attestation now requires is unchanged and stated at *What a human must now decide*
above, with one addition learned here: the record must derive its authority from the accountable
person, not from any text written on their behalf — including text they were offered to adopt.
