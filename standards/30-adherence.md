# Standard 30 — Adherence

Adherence dominates long-run outcomes more than programme design does. This standard treats it as a
property of the plan rather than of the person, and forbids the response that turns one missed
session into abandonment.

Source: item 30 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans training or diet over time.

## Requirements

### R1 — A plan nobody follows is a worse plan

The comparison that matters is not between an optimal plan and a suboptimal one; it is between a
suboptimal plan performed and an optimal one abandoned. A suboptimal plan that is consistently
performed can outperform an optimal plan that is abandoned, and over a long enough horizon it
usually does.

This makes adherence a design constraint rather than a personal virtue, and it reframes what a
"better" plan means: one someone will still be doing in six months usually is one.

### R2 — Never punish missed workouts with excessive compensatory exercise

Reproduced verbatim from the source:

> punish missed workouts with excessive compensatory exercise

Two harms, and the second is the larger. Compensating concentrates load exactly when readiness is
lowest, which raises injury risk. And it frames training as a debt to be repaid — a framing under
which a missed week becomes an unpayable balance, and abandoning the plan becomes the rational
response.

The real threat to a training plan is rarely the missed session. It is the response to it.

Rule [`fitness.no-punitive-compensation`](../PROHIBITIONS.md).

### R3 — Missed sessions are absorbed

The plan resumes at the point it reached. After a longer absence the load is reduced and the baseline
reassessed ([Standard 17](17-baseline-fitness.md) R6, [Standard 23](23-sustainable-progression.md) R5)
— which is not compensation but recalibration, and it moves in the opposite direction.

### R4 — Poor adherence is diagnostic of the plan

Persistent non-adherence is information, and treating it as a discipline problem discards it. The
usual causes are addressable and none of them is character:

- the plan requires more time, energy, or access than the person has
  ([Standard 23](23-sustainable-progression.md) R6);
- the goal is not one the person actually holds ([Standard 16](16-goals.md) R6);
- the volume or intensity is not recoverable for them ([Standard 20](20-recovery.md));
- the plan is unpleasant in a way that is not necessary for the goal;
- something outside training has changed.

The response is to ask which, and change the plan.

### R5 — Adherence guidance does not moralise

Framing missed sessions as failures of will, or adherence as evidence of virtue, is the training
analogue of [`nutrition.no-food-moralizing`](../PROHIBITIONS.md), and it has the same effect: shame
predicts concealment and abandonment rather than improvement.

The tone that works is matter-of-fact. A missed session is an event, not a verdict.

### R6 — Consistency is measured over a period, not per session

Adherence is assessed as a proportion over weeks, not as a per-session pass or fail. Someone
completing four of five sessions weekly for a year is highly adherent; a per-session view records
fifty-two failures.

This is [Standard 2](02-trend-over-event.md) applied to behaviour, and it is one of the places where
the framing genuinely changes the outcome, because the person sees the measure.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-punitive-compensation`](../PROHIBITIONS.md) | punish missed workouts with excessive compensatory exercise |

## Additions this standard makes beyond the source

- R1's comparison, which is the argument that makes adherence a design constraint rather than an
  afterthought.
- R2's identification of the framing harm as larger than the physical one.
- R4 in full — poor adherence as diagnostic of the plan, with the causes enumerated. The source's
  prohibition addresses the response to a missed session; it does not address what repeated misses
  mean.
- R5's link to food moralising, and R6's period-based measurement.

## Relationship to other standards

[Standard 21](21-rest.md) R4 states the absorption principle from the rest side.
[Standard 16](16-goals.md), [Standard 20](20-recovery.md), and
[Standard 23](23-sustainable-progression.md) supply R4's causes.
[Standard 37](37-dietary-quality.md) carries the food-moralising prohibition R5 refers to.
[Standard 40](40-sustainability.md) is the nutrition counterpart of R1.
[Standard 2](02-trend-over-event.md) supplies R6.

## Implementation

`fitness.no-punitive-compensation` is `manual-review` at `none` assurance and reports not-evaluated
without a recorded human review.

No detector evaluates adherence handling. R1 and R4 through R6 describe how a system should respond
to a person's behaviour over time, which is not visible in a repository's files.
