# Standard 7 — Individual Baseline

A measurement means something only relative to something else. This standard establishes that the
right comparator is the individual's own history where it exists, and requires that any substitution
be visible.

Source: item 7 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any interpretation that compares a measurement against a reference — which is nearly all
of them, since "is this normal?" is a comparison whether or not the comparator is stated.

## Requirements

### R1 — The individual baseline is the primary comparator

Where a person's own history is known, it is what their measurement is read against. Population
reference ranges describe the distribution of a population; an individual's own range describes them.

The canonical example: a resting heart rate of 48 sits below most population reference ranges and is
unremarkable for the endurance-trained person who has lived at 48 for a decade. Read against the
population it is a finding. Read against the person it is Tuesday.

The reverse case is the one that gets missed. A resting heart rate of 68 sits comfortably inside
every population range and is a substantial, potentially meaningful change for someone whose baseline
is 52. Population ranges are wide enough to hide real individual change, so using them is not merely
less precise — it is insensitive in the direction that matters.

### R2 — A baseline is a range over a period, not a number

A baseline states what is typical *and* how much it varies, over a stated period, under stated
conditions. "Resting heart rate 52" is not a baseline; "resting heart rate 50–55, measured on waking,
over the last three months" is.

Without the spread there is no way to tell an ordinary fluctuation from a departure, which is exactly
the judgement [Standard 3](03-safety-and-escalation-tiers.md) needs.

### R3 — Baselines age, and shift legitimately

A baseline is a claim about a person at a time. Training, detraining, illness, ageing, medication
changes, pregnancy, weight change, and altitude all move baselines legitimately. A stale baseline
produces false findings in both directions.

Where a baseline shifts, the question is whether the shift is itself the finding — which is
[Standard 8](08-trends.md)'s subject.

### R4 — Never substitute a population average silently

Reproduced verbatim from the source:

> substitute generalized population averages for known individual baseline without acknowledging the difference

The operative words are **known** and **without acknowledging**. Using population data when no
individual baseline exists is legitimate and often unavoidable. What is forbidden is having the
individual baseline and comparing against the population anyway, or doing so without saying which
comparator was used.

Rule [`health.no-population-average-as-baseline`](../PROHIBITIONS.md).

### R5 — Say which comparator is in use

Every interpretation names its comparator: this person's baseline, a population range, or neither.

The alternative to naming it is not neutrality — it is an unstated population comparison, because
that is what a reader assumes. Requiring the record to state it is what makes a substitution visible
when it happens.

Rule [`health.baseline-recorded`](../PROHIBITIONS.md) requires the record to reference the individual
baseline or state that none is known.

### R6 — Not having a baseline is a legitimate state

The first measurement anyone takes has no baseline behind it, and a system that requires one will
either refuse to work or invent one. The honest handling is to say that no individual baseline
exists, use population data while saying so, and note that the current measurement begins to
establish one.

This is [Standard 11](11-uncertainty.md)'s disposition applied to comparators, and it is why
`health.baseline-recorded` is satisfied by an explicit statement that no baseline is known.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-population-average-as-baseline`](../PROHIBITIONS.md) | substitute generalized population averages for known individual baseline without acknowledging the difference |

## Additions this standard makes beyond the source

- R1's reverse case — that population ranges are wide enough to hide meaningful individual change.
  The source's prohibition implies the forward case only, and the insensitivity argument is the
  stronger one.
- R2's requirement that a baseline carry a spread and a period.
- R3 on ageing and legitimate shift.
- R5's framing: the alternative to naming a comparator is an unstated population comparison rather
  than no comparison.
- R6 in full — that having no baseline is a legitimate, statable condition rather than a gap to fill.

## Relationship to other standards

[Standard 8](08-trends.md) covers change in a baseline over time.
[Standard 3](03-safety-and-escalation-tiers.md) R3 makes the baseline the first input to tier
assignment. [Standard 17](17-baseline-fitness.md) is this standard's counterpart for training
capacity. [Standard 41](41-dietary-restrictions-and-context.md) and
[`nutrition.no-identical-response-assumption`](../PROHIBITIONS.md) make the same argument about
dietary response.

## Implementation

`health.baseline-recorded` is a `document` requirement at `partial` assurance: a detector establishes
that an interpretation record has a non-empty `## Baseline` section. It cannot establish that the
baseline is well founded, current, or that it was actually used in the reasoning rather than merely
recorded above it.

`health.no-population-average-as-baseline` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.
