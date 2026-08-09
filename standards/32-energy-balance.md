# Standard 32 — Energy Balance

Energy balance determines the direction of body mass change, and almost every number involved in it
is an estimate. This standard governs treating those numbers honestly and reading body weight for
what it is.

Source: item 32 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project reasons about intake, expenditure, or body weight.

## Requirements

### R1 — Every quantity in an energy balance is an estimate

The arithmetic is simple and the inputs are not:

| Quantity | Why it is uncertain |
| --- | --- |
| Intake | Self-report is systematically under-reported; label values carry tolerance; portion estimation is poor |
| Resting expenditure | Predicted from equations with substantial individual error |
| Activity expenditure | Device estimates are modelled; error is routinely large |
| Non-exercise activity | Varies considerably day to day and adapts to intake |
| Absorption | Not all consumed energy is absorbed, and this varies with the food |

The conclusion is not that energy balance is useless — it is the right framework for direction of
change. It is that the numbers within it are estimates, and presenting them with the precision of a
calculator is a claim the inputs do not support.

### R2 — Never fabricate calorie or macronutrient values when they are unknown

Reproduced verbatim from the source:

> fabricate calorie/macronutrient values when they are unknown

An invented number becomes indistinguishable from a measured one the moment it is written down, and
everything computed from it inherits an error nobody can see. Presenting an estimate as a value is
the same defect whether or not the estimate was reasonable.

Rule [`nutrition.no-fabricated-values`](../PROHIBITIONS.md).

### R3 — Values carry their provenance

Every numeric value is labelled measured, estimated, or unknown, and the label stays attached when
the value is used downstream. A total assembled from three measured values and one guess is not a
measured total.

Rule [`nutrition.value-provenance`](../PROHIBITIONS.md), as a recommendation — the detector for it is
a heuristic scan for markers and its findings are advisory. The prohibition in R2 applies regardless.

### R4 — Never treat short-term scale changes as equivalent to fat gain or loss

Reproduced verbatim from the source:

> treat short-term scale changes as equivalent to fat gain/loss

Day-to-day body weight moves on water, glycogen, sodium, gut contents, and hormonal cycle —
routinely by more than a week of actual fat change. Reading the scale as a fat measurement means
reacting to the noise, and reacting to the noise is what leads someone to abandon an approach that
was working.

The mechanism is worth stating because it makes the failure predictable: starting a lower-carbohydrate
approach drops glycogen and its associated water, producing a rapid initial loss that is largely not
fat; a high-sodium meal or the start of resistance training produces an increase that is largely not
fat either. Both are read as evidence about the diet, and both are wrong.

Rule [`nutrition.no-scale-change-as-fat-change`](../PROHIBITIONS.md).

### R5 — Weight is read as a trend

Body weight is interpreted over weeks, using a rolling average rather than individual readings, and
compared against the person's own history ([Standard 7](07-individual-baseline.md),
[Standard 2](02-trend-over-event.md)).

Weighing frequently and averaging is generally better than weighing rarely, provided what is read is
the average — more data reduces the noise, but only if the individual readings are not each treated
as a verdict.

### R6 — Energy balance is not the whole of a plan

Direction of change is one dimension, and optimising it alone is how the failures in
[Standard 36](36-micronutrient-adequacy.md) and [Standard 34](34-protein.md) occur. A plan states
its energy target alongside its protein and fibre targets, precisely so that energy is not the only
number in view.

Rules [`nutrition.plan-documented`](../PROHIBITIONS.md) and
[`nutrition.targets-recorded`](../PROHIBITIONS.md).

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-fabricated-values`](../PROHIBITIONS.md) | fabricate calorie/macronutrient values when they are unknown |
| [`nutrition.no-scale-change-as-fat-change`](../PROHIBITIONS.md) | treat short-term scale changes as equivalent to fat gain/loss |

## Additions this standard makes beyond the source

- R1's table of why each quantity is uncertain, and the explicit statement that this does not make
  the framework useless.
- R3's requirement that provenance travel with the value downstream.
- R4's mechanism — the glycogen and water explanation for why early loss overstates and sodium or new
  training overstates in the other direction. The source states the prohibition without the mechanism,
  and the mechanism is what makes the failure anticipatable.
- R5's note that frequent weighing helps only if the average is what is read.
- R6's framing of energy as one target among several.

## Relationship to other standards

[Standard 33](33-sustainable-calorie-changes.md) covers the size of the deficit or surplus.
[Standard 34](34-protein.md), [Standard 35](35-fiber.md), and
[Standard 36](36-micronutrient-adequacy.md) cover R6's other targets.
[Standard 2](02-trend-over-event.md) and [Standard 7](07-individual-baseline.md) supply R5.
[Standard 5](05-physiological-measurements.md) makes the same provenance argument for physiological
measurements. [Standard 29](29-hydration-fitness.md) R4 covers the case where a short-term weight
change *is* the intended measurement.

## Implementation

`nutrition.plan-documented` is a `structural` requirement at `partial` assurance: a detector
establishes that a nutrition plan artifact exists. `nutrition.targets-recorded` is a `document`
requirement at `partial`: the plan has a `## Targets` section naming energy, protein, and fiber. It
does not check that the numbers are appropriate for the person.

`nutrition.value-provenance` is a `document` recommendation at `partial`, and its detector is
explicitly heuristic — it scans for `(measured)`, `(estimated)`, and `(unknown)` markers on numeric
values. It can miss unmarked values and cannot judge whether a label is honest, which is why it is a
recommendation and why its findings are advisory.

Both prohibitions are `manual-review` at `none` assurance and report not-evaluated without a recorded
human review.
