# Release review evidence packs — 1.0.0

Four rules apply to this repository that no machine evaluates. This directory holds the evidence a
reviewer needs to reach a disposition on each, assembled by the implementer.

| Pack | Rule | What the reviewer must decide |
| --- | --- | --- |
| [01](01-escalation-tier-language-calibrated.md) | `escalation.tier-language-calibrated` | Is the escalation language proportionate to its tier, and does it neither alarm nor understate? |
| [01a](01a-tier-language-corpus.md) | *(companion to 01)* | The normative language requirements and all four worked records, complete. Calibration is a property of a whole record, so nothing here is extracted. |
| [01b](01b-remediation-diff.md) | *(companion to 01)* | **The re-review packet.** Rule 01 came back DEFECTIVE on tier-four under-escalation; this is the before/after. Tiers 1 and 3 were found calibrated and are untouched. |
| [02](02-trend-trends-over-events.md) | `trend.trends-over-events` | Is the trend-over-event principle consistently operationalised, including where a single event legitimately overrides it? |
| [03](03-health-no-fabricated-medical-facts.md) | `health.no-fabricated-medical-facts` | Are the physiological claims supportable rather than invented, overstated, or beyond available evidence? |
| [03a](03a-claim-extract.md) | *(companion to 03)* | The 191 empirical claims verbatim, with the qualification each standard attached. Claim-level review needs this, not pack 03's categories. Revised after remediation; numbering unchanged. |
| [03b](03b-remediation-diff.md) | *(companion to 03)* | **The re-review packet.** Rule 03 came back DEFECTIVE; this is the before/after for the thirty claims that changed, so a focused re-review covers 30 rather than 182. |
| [04](04-nutrition-no-single-food-disease-claims.md) | `nutrition.no-single-food-disease-claims` | Do the nutrition standards avoid attributing complex disease causation or cure to single foods? |

Results are recorded in [dispositions.md](dispositions.md).

## How to use these

Each pack contains the rule as catalogued, the complete list of locations bearing on it, the material
extracted rather than summarised, and — separately — the points the implementer considers **weakest**
and would most want examined.

That last section is not a disclaimer. An evidence pack assembled by the author of the material is
worth less than an independent read, and the honest way to reduce that gap is to point at the places
where the author's confidence is thinnest rather than let a reviewer find them by chance.

## What a disposition is, and is not

A review returns one of three outcomes per rule:

- **Establishable** — the evidence supports the rule being satisfied, and a human may record an
  attestation.
- **Not establishable** — the evidence does not support it. The rule stays unattested, reports
  `not-evaluated`, and the repository stays at `NOT_EVALUATED`. This is a legitimate outcome.
- **Defective** — the review found a problem in the content. **Fix the content, not the verdict.**

The third outcome is the real test of this framework. If substantive review finds a problem, changing
the evaluation machinery to make the verdict green would be precisely the manipulation
[Standard 42](../../standards/42-standards-integrity.md) forbids.

## What a review cannot do here

A review by a non-human agent cannot produce an attestation. `project-policy.yml` requires a real
`reviewedBy` identity and durable evidence, and inventing one would be the "falsify evidence for"
clause of the invariant. An agent's output is a **disposition for a human to accept, reject, or
record** — the human's acceptance is what becomes the attestation, and `reviewedAgainst.paths` should
name both the reviewed material and the pack that framed it.

## Release condition

```text
four human judgements established
+ integrity invariant screened
+ all mechanical gates green
→ COMPLIANT
```

No further framework changes should be needed to reach that. If one appears necessary, that is a
signal to re-read [ADR 0007](../adr/0007-screened-as-a-distinct-invariant-state.md), which exists
because a framework change was genuinely warranted once and the bar for a second is higher.
