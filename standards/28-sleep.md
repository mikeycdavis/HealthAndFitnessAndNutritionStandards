# Standard 28 — Sleep

Sleep is the largest single contributor to recovery and the one most affected by everything else in a
person's life. This standard governs treating it as part of training rather than as background.

Source: item 28 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans training or interprets recovery. It also has one foot in the health
domain, because sleep is heavily tracked by consumer devices whose measurements are inferences
([Standard 6](06-measurement-quality.md) R3).

## Requirements

### R1 — Sleep is a training variable

Inadequate sleep reduces recovery, impairs performance, raises perceived exertion at a given
workload, and affects appetite regulation and mood. A plan that prescribes load without any regard to
sleep is prescribing against a capacity it has not looked at.

Where sleep is known to be short or disrupted, that is relevant to how much load is reasonable —
which makes it a contextual factor in the sense of [Standard 10](10-known-contextual-factors.md).

### R2 — Sleep opportunity and sleep achieved are different things

A plan can influence the first and only observe the second. Prescribing "eight hours of sleep" to
someone with insomnia is not a recommendation, it is a reproach.

The actionable form addresses opportunity and conditions — timing, consistency, the hours available —
and treats achieved sleep as an outcome to be observed rather than an instruction to be complied
with.

### R3 — Consumer sleep staging is an inference

Sleep stage breakdowns from wearables are inferred from movement and heart rate, and their agreement
with polysomnography is moderate at best. Total sleep duration is measured considerably better than
its composition.

This matters because stage data is presented with more precision than it has, and people act on it —
including by worrying about a "poor deep sleep score", which is itself a mechanism for sleeping
worse. Interpreting stage data as though it were measured is
[`health.no-wearable-as-ground-truth`](../PROHIBITIONS.md).

### R4 — Sleep data is subject to the trend-over-event principle

One bad night is a bad night. Sleep varies substantially with day of week, travel, illness, alcohol,
and circumstance, and a single night's data supports very little
([Standard 2](02-trend-over-event.md)). Patterns over weeks support considerably more.

### R5 — Sleep problems can be a health matter rather than a habit matter

Persistent insomnia, loud snoring with witnessed pauses in breathing, marked daytime sleepiness
despite adequate opportunity, and sudden changes in sleep pattern are outside what a training plan
should attempt to manage.

This is [Standard 3](03-safety-and-escalation-tiers.md)'s "worth discussing with a professional"
tier, and the recognise-but-do-not-name boundary of [Standard 12](12-red-flags.md) R2 applies.

### R6 — Sleep advice stays inside the boundary and stays proportionate

General sleep hygiene guidance is in scope. Interpreting a sleep score as evidence of a disorder is
not ([Standard 1](01-wellness-vs-medical-assessment.md)), and neither is alarming someone about
ordinary variation in their sleep data
([`health.no-catastrophizing`](../PROHIBITIONS.md)) — a real risk given how much sleep data people
now see and how readily it produces anxiety about sleep, which then affects sleep.

## Additions this standard makes beyond the source

The source names "sleep" as a topic. R2's opportunity-versus-achieved distinction, R3's account of
staging inference and its feedback effect, R4's application of the trend principle, R5's escalation
list, and R6's proportionality note are all this standard's.

R2 is the one that changes how a system should behave: prescribing an outcome the person does not
control converts a recommendation into a source of guilt, and guilt does not improve sleep.

## Relationship to other standards

[Standard 20](20-recovery.md) R1 names sleep as its largest component.
[Standard 6](06-measurement-quality.md) governs R3.
[Standard 2](02-trend-over-event.md) supplies R4.
[Standard 10](10-known-contextual-factors.md) covers sleep as a contextual factor.
[Standard 3](03-safety-and-escalation-tiers.md) and [Standard 12](12-red-flags.md) supply R5's
handling.

## Implementation

No rule in the catalog is bound solely to this standard. Its content is enforced through
`fitness.recovery-planned` (which requires the plan's recovery section), the wearable and
catastrophizing prohibitions, and the escalation rules.

No detector evaluates sleep guidance.
