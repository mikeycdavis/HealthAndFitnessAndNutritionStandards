# Standard 31 — Trend-Based Progress

Progress is assessed from patterns across sessions, not from the last one. This standard applies the
trend-over-event principle to training and forbids judging fitness from a single workout.

Source: item 31 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project assesses training progress or adjusts a plan in response to it.

## Requirements

### R1 — Never judge fitness from one workout

Reproduced verbatim from the source:

> judge fitness from one workout

A single session reflects sleep, food, stress, heat, illness, and where in the week it fell at least
as much as it reflects fitness. Judging from one is the trend-over-event failure in its most
demoralising form: a bad day is read as lost fitness, and the plan is rewritten around noise.

Rule [`fitness.no-fitness-judgment-from-one-workout`](../PROHIBITIONS.md).

### R2 — A bad session is usually about the day

Before a bad session is treated as evidence about fitness, the ordinary explanations are considered:
sleep, food timing and adequacy, heat and humidity, illness or its onset, life stress, cumulative
fatigue from preceding sessions, and where in a training block it falls.

This is [Standard 4](04-symptom-context.md)'s discipline in the training domain — and R5 of that
standard applies too: naming a plausible cause explains the session, it does not dismiss a pattern.

### R3 — A review cadence is defined in advance

A plan states when it will be reviewed and on what evidence.

Fixing the cadence beforehand is what makes trend-based assessment the default. A plan reviewed
"whenever something feels wrong" is reviewed precisely when the evidence is a single bad session,
which guarantees the failure R1 names.

Rule [`fitness.review-cadence-defined`](../PROHIBITIONS.md).

### R4 — Progress shows in several places, and rarely in all of them at once

Depending on the goal: performance measures, work completed at a given effort, recovery between
efforts, resting heart rate relative to baseline, subjective energy and sleep, body composition where
relevant, and consistency itself.

Different qualities improve on different timescales, so a plateau in one is not a plateau overall.
Strength can be climbing while endurance is flat, and a review that looks at one measure will
conclude the wrong thing.

### R5 — Progress is not linear, and plateaus are informative

Progress is fastest at the start and slows as capacity approaches its ceiling
([Standard 23](23-sustainable-progression.md) R4). A plateau can mean the ceiling for this approach
has been reached, that recovery is inadequate, that adherence has slipped, or that something outside
training changed.

The response is to establish which. Adding load by reflex is
[Standard 18](18-progressive-overload.md) R6's failure.

### R6 — Adjustments follow trends, and are proportionate

A plan is adjusted on the evidence of the review, and the size of the adjustment matches the size of
the evidence. Wholesale rewrites in response to a few weeks of data destroy the continuity that makes
progress possible, and they make the next review harder to interpret because too much changed at once
([Standard 18](18-progressive-overload.md) R4).

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-fitness-judgment-from-one-workout`](../PROHIBITIONS.md) | judge fitness from one workout |

## Additions this standard makes beyond the source

- R2's list of ordinary explanations, and its link to the explaining-away failure.
- R3's argument for fixing the cadence in advance — that an as-needed review is triggered exactly
  when the evidence is worst.
- R4's multiple measures, and the observation that qualities improve on different timescales.
- R5's reading of a plateau as a question rather than a signal to add load.
- R6's proportionality requirement.

## Relationship to other standards

[Standard 2](02-trend-over-event.md) states the principle this applies.
[Standard 8](08-trends.md) is the health-domain counterpart.
[Standard 17](17-baseline-fitness.md) supplies what progress is measured from.
[Standard 18](18-progressive-overload.md) R6 and
[Standard 23](23-sustainable-progression.md) R4 receive R5.
[Standard 30](30-adherence.md) R6 measures adherence the same way.

## Implementation

`fitness.review-cadence-defined` is a `document` recommendation at `partial` assurance: a detector
establishes that the plan has a non-empty `## Review Cadence` section. It cannot establish that
reviews happen, or that they are trend-based when they do.

`fitness.no-fitness-judgment-from-one-workout` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.
