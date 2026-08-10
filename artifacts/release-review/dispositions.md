# Release-review dispositions

Independent content-review results for the four rules that apply to this repository and that no
machine evaluates.

**A disposition is not an attestation.** None of these supplies a `reviewedBy` human identity, and
none of them makes `standards check .` report anything different. A human reviewer may use a
disposition and its evidence chain when deciding whether to record an attestation in
`project-policy.yml`; the human's acceptance is what becomes the attestation, and
`reviewedAgainst.paths` should name both the reviewed material and the packs that framed it.

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

## `trend.trends-over-events` — not yet reviewed

Last of the four. Material in [pack 02](02-trend-trends-over-events.md) and
[pack 02a](02a-trend-corpus.md).

Two things a reviewer should know before starting. **The two worked records that bear most on this
rule were both edited at `d47e389`**, for the `escalation.tier-language-calibrated` review, and
neither change was made with this rule in mind — but both bear on it. The tier-four record now
exercises the single-event override harder, and the tier-two record no longer uses "we need a trend"
as a reason to defer professional contact. Read the current text rather than pack 02's description.

Pack 02a also surfaces a **third tension** pack 02 mentioned only in passing: places where trend
reasoning *increases* urgency rather than decreasing it (Standard 24 R6, Standard 20 R5, Standard 8
R6). It runs in the opposite direction from the single-event override, and the repository asserts
rather than argues that both follow from the same rule.

---

## Release state

Three of four rules remain unreviewed, so `standards check .` reports `NOT_EVALUATED` and exits 4.
That is the correct state and it is left that way. No attestation has been recorded, and nothing is
tagged.
