# Human review attestation — 1.0.0

**Reviewer:** Michael Davis
**Review date:** 2026-08-11
**Recorded in:** [`project-policy.yml`](../../project-policy.yml) under `attestations`

I reviewed the independent release-review dispositions and the evidence supporting the four rules
requiring human judgment for the Health/Fitness/Nutrition Standards 1.0.0 release.

I understand that the independent review dispositions are evidence offered to me as the
decision-maker and are not themselves attestations. I am taking responsibility for the following
judgments.

The policy entries record who decided, when, what was reviewed, and where the evidence lives. This
document carries the reasoning.

---

## `health.no-fabricated-medical-facts` — APPROVED

I approve this rule based on the complete claim-level review represented by the release-review
evidence chain.

The review covered 191 empirical claim entries representing 182 distinct assertions rather than
relying on the earlier incomplete sentence-level summary.

The independent review initially found the content defective, including claims whose precision,
scope, or implied authority exceeded what could be established. Those findings were remediated in the
standards content rather than by weakening the rule, evaluator, or verdict machinery. The changed
claims were then independently rereviewed and found establishable.

Based on that evidence chain, I judge that the reviewed standards do not fabricate medical or
physiological facts within the scope evaluated.

## `escalation.tier-language-calibrated` — APPROVED

I approve the calibration of the four-tier escalation language.

The independent review initially rejected the tier-four worked example because its calm wording had
also reduced the temporal urgency of new exertional chest discomfort. That was a safety-significant
defect.

The content was changed so that calm remains constant across tiers while urgency does not. The
tier-four example now directs immediate action without requiring recurrence, persistence at rest, or
additional symptoms before escalation. The normative standard was also corrected so future adopters
inherit that distinction.

The tier-two example was separately corrected so the need to establish a trend cannot be used to
defer professional contact when repeated properly obtained measurements already justify it.

These changes were independently rereviewed and found establishable. I judge the resulting tier
language proportionate to the evidence and action required.

## `nutrition.no-single-food-disease-claims` — APPROVED

I approve this prohibition.

The nutrition corpus was reviewed for claims attributing complex disease causation or cure to
individual foods. The mechanical food-name inventory was treated as corroborating evidence rather
than proof of absence, and the substantive review also considered the relevant standards, rationales,
and previously reviewed empirical corpus.

No single-food causal or curative complex-disease claim was identified.

I also accept the review conclusion that the absence of a worked violating example is a documentation
opportunity rather than evidence that the prohibition is insufficiently operationalized. **I am not
creating a new requirement that every prohibition have a worked negative example.**

## `trend.trends-over-events` — APPROVED

I approve the repository's treatment of observations, trends, and single-event exceptions.

I judge the governing distinction to be coherent:

> Individual observations can inform decisions; trends establish patterns.

A qualifying red flag does not establish an underlying diagnosis or physiological trend. It can
nevertheless establish an immediate decision obligation because the consequence of waiting is
asymmetric.

Likewise, accumulated individually weak observations can become meaningful when their trend carries
evidence that none carries independently.

I also accept that the same measurement can legitimately have different inferential uses at different
timescales — for example, short-term body-mass change as a rough acute fluid-loss proxy versus
body-weight observations used to estimate longer-term weight trends.

Frequent observation does not contradict trend-based reasoning: observation cadence and
interpretation or decision cadence are distinct.

---

## Scope of this attestation

These approvals apply to the material identified by the release-review evidence chains and reviewed
against the frozen certification process.

They **do not** attest `integrity.no-standards-manipulation`; that invariant is intentionally
non-attestable and is independently reported as `screened`.

They **do not** establish `health.evidence-quality-noted`, which is a non-blocking recommendation and
may remain `not-evaluated`.

They **do not** independently certify the overall repository as `COMPLIANT`. After the attestations
are recorded, certification still requires the precommitted verification procedure: diff against the
immutable `7f59f8b` baseline first, explain every consequential post-baseline change, verify that
reviewed evidence has not moved, establish that exactly the intended human evidence affected the
verdict, and only then compare the resulting per-rule states and overall verdict with the prediction
recorded in [`dispositions.md`](dispositions.md).

**Decision: APPROVED for all four human-review rules.**

---

## What the recording changed

| | Before | After |
| --- | --- | --- |
| `attestations` | `{}` | four `approved` entries, each with reviewed paths and a digest |
| Verdict | `NOT_EVALUATED`, exit 4 | `COMPLIANT`, exit 0 |
| `escalation.tier-language-calibrated` | not-evaluated | attested |
| `health.no-fabricated-medical-facts` | not-evaluated | attested |
| `nutrition.no-single-food-disease-claims` | not-evaluated | attested |
| `trend.trends-over-events` | not-evaluated | attested |
| `integrity.no-standards-manipulation` | screened | screened |
| `health.evidence-quality-noted` | not-evaluated | not-evaluated |

The per-rule states match the dry-run prediction frozen in `dispositions.md` before any attestation
existed.

Three surfaces describing this repository's own state were corrected in the same change because they
had become false the moment the verdict moved: `PROJECT.md`, `CHANGELOG.md`, and
`project-policy.yml`'s attestations comment. Two tests compare that prose to `standards status`
output, so the drift failed the suite rather than shipping. None of the three is read by the
evaluator, and none of them moved the verdict.

## What was deliberately not done here

`VERSION` remains `1.0.0-dev`, the CI `check` step still tolerates exit 4, and no tag exists. Those
are release mechanics and require their own authorization; recording human judgment is not the same
act as cutting a release. The certification procedure in `dispositions.md` runs against the resulting
commit, not against this document.
