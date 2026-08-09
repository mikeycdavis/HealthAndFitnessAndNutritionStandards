# Standard 2 — Trend-over-Event Principle

Personal health, training, and nutrition data are noisy enough that a single observation usually says
more about the day it was taken than about the person. This standard states what a single observation
may support, and what only a trend may.

Source: item 2 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies across all three domains. Every rule in this series about single readings, single workouts,
single meals, or single weigh-ins is an application of this one.

## Requirements

### R1 — The principle

Reproduced verbatim from the source:

> Individual observations inform decisions; trends establish patterns.

The two verbs are doing the work. An observation *informs*: it prompts a question, adds evidence,
adjusts confidence. A trend *establishes*: it supports the claim that something is actually
happening. Treating an observation as though it establishes something is the failure this standard
names.

### R2 — What a single observation may and may not support

| A single observation may | A single observation may not |
| --- | --- |
| Prompt a question | Establish a direction of travel |
| Contribute to a trend | Confirm that an intervention worked |
| Trigger a check, or a repeat measurement | Justify redefining a plan |
| Reveal a red flag that warrants attention now ([Standard 12](12-red-flags.md)) | Diagnose, or rule out |

The right-hand column is not a rule about caution; it is a rule about what the data can carry. One
point has no direction, and a direction inferred from one point is invented.

Note the exception in the left column, and note that it is narrow. A red flag is actionable on a
single observation precisely because the cost of waiting for a trend is asymmetric. That is not a
loophole in this standard — it is the one case where a single observation genuinely establishes that
something needs attention, and [Standard 12](12-red-flags.md) defines its boundaries.

### R3 — Noise usually exceeds the effect being tracked

The reason the principle holds is quantitative, and it is worth stating rather than asserting.

- Body weight moves by more in a day, on water, glycogen, sodium, and gut contents, than a week of
  actual fat change amounts to.
- Resting heart rate moves on sleep, alcohol, caffeine, illness, heat, and stress, by more than
  months of training adaptation.
- A day's food intake varies by more than the deficit or surplus a plan is aiming at.
- A single workout reflects sleep, food, stress, and where in the week it fell at least as much as it
  reflects fitness.

A system that reacts to each observation is converting that noise into instructions, and the person
following them is chasing variation they cannot control.

### R4 — Reacting to trends is what makes a plan followable

The argument for this principle is not only accuracy. A plan that changes whenever a number moves is
one nobody can follow, and its instability is itself demoralising: a bad day gets read as a loss of
progress, and the response to the reading does more damage than the reading described.

Stability is a feature. Where a change is warranted, name the trend that warrants it rather than the
reading that prompted the question.

### R5 — Say which one is being relied on

Guidance states whether a statement rests on an observation or on a trend, and over what period.
"Your resting heart rate was 62 this morning" and "your resting heart rate has averaged 62 over three
weeks, up from 57" are different claims, and only the second supports acting on it.

### R6 — The principle is written down

A project states this principle in its documentation or in the templates that shape how observations
are recorded, so that the people and agents working in it share it rather than each inferring it.
A principle nobody wrote down is applied inconsistently, and in a predictable direction: whoever is
closest to the data decides in the moment how much one reading means.

Rule [`trend.principle-documented`](../PROHIBITIONS.md) covers this, as a recommendation.

## Prohibitions

This standard's own prohibitions live in the standards for the domains they govern, because that is
where a reader meets them: [`health.no-single-reading-as-trend`](08-trends.md) in Standard 8,
[`fitness.no-fitness-judgment-from-one-workout`](31-trend-based-progress.md) in Standard 31, and
[`nutrition.no-scale-change-as-fat-change`](32-energy-balance.md) in Standard 32. All three are the
same error in three domains.

## Additions this standard makes beyond the source

- R2's table, and specifically the red-flag exception. The source states the principle and gives
  examples; it does not say where the principle stops, and a principle with no stated exception gets
  applied to the case where it is dangerous.
- R3's account of *why* — that measurement noise commonly exceeds the tracked effect. The source
  asserts the principle without arguing it.
- R4's followability argument, which is the practical case rather than the statistical one.
- R5 and R6 in full.

## Relationship to other standards

[Standard 8](08-trends.md) applies this to health measurements, [Standard 31](31-trend-based-progress.md)
to training progress, and [Standard 32](32-energy-balance.md) to body weight. [Standard 12](12-red-flags.md)
defines the narrow case in R2 where a single observation is enough to act.
[Standard 7](07-individual-baseline.md) supplies what a trend is measured against.

## Implementation

`trend.trends-over-events` is `manual-review` at `none` assurance. Whether a particular piece of
guidance respects the distinction cannot be established by inspecting files, and it reports
not-evaluated without a recorded human review.

`trend.principle-documented` is a `document` recommendation at `partial` assurance: a detector
establishes that the principle appears in the documentation or templates. That is a much weaker
claim, and the two rules are separate so the weaker one cannot stand in for the stronger.
