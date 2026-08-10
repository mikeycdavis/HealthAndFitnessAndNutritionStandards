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

## `escalation.tier-language-calibrated` — DEFECTIVE, remediated, awaiting re-review

```text
escalation.tier-language-calibrated

Independent content-review disposition:
DEFECTIVE

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

Awaiting focused re-review of [pack 01b](01b-remediation-diff.md).

## `trend.trends-over-events` — not yet reviewed

Material in [pack 02](02-trend-trends-over-events.md).

## `nutrition.no-single-food-disease-claims` — not yet reviewed

Material in [pack 04](04-nutrition-no-single-food-disease-claims.md). Pack 04 records one gap in
advance: the prohibition has no worked violating example anywhere in the repository.

---

## Release state

Three of four rules remain unreviewed, so `standards check .` reports `NOT_EVALUATED` and exits 4.
That is the correct state and it is left that way. No attestation has been recorded, and nothing is
tagged.
