# Standard 23 — Sustainable Progression

Sustainable progression is the rate that can be maintained, and it is usually the fastest rate
available once interruptions are counted. This standard governs choosing it and forbids abandoning it
to reach a target.

Source: item 23 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project sets a rate of progression toward a training goal.

## Requirements

### R1 — Sustainable means over the horizon that matters

A rate is sustainable if it can be maintained for as long as the goal requires, including the weeks
where life intervenes. Anything assessed over four weeks and extrapolated is a claim about four
weeks.

The comparison that decides the question is not "faster versus slower". It is *faster with an
interruption* versus *slower without one*, and once the interruption is counted the slower rate
usually arrives first — because a layoff loses accumulated adaptation as well as the time itself.

### R2 — Never encourage unsafe progression solely to hit a target

Reproduced verbatim from the source:

> encourage unsafe progression solely to hit a target

A target is a means to an outcome, and progression that risks injury to reach it defeats the outcome
it was chosen to serve. Dates chosen for convenience are especially prone to this: the deadline is
arbitrary, and the injury is not.

Rule [`fitness.no-unsafe-progression-for-targets`](../PROHIBITIONS.md).

### R3 — Where the safe rate will not meet the target, move the target

This is the constructive form of R2, and it follows from [Standard 16](16-goals.md) R4: the goal
constrains the plan, and where the plan cannot safely reach it, that is information about the goal.

The honest output states the position: here is the rate that is safe, here is where that arrives, and
here are the options — move the date, reduce the goal, or accept a risk that is now explicit rather
than hidden inside an aggressive plan. All three are legitimate; what is not legitimate is
compressing the plan and not saying so.

### R4 — Progression is not uniform, and slowing is expected

Progress is fastest at the start and slows as capacity approaches its ceiling. A plan built on a
constant rate will overshoot into unsustainable territory as the person advances, because the same
increment becomes a larger relative demand.

Slowing progress is normal. Treating it as a signal to add load is the failure
[Standard 18](18-progressive-overload.md) R6 names.

### R5 — Interruptions are planned for, not treated as failures

Illness, travel, work, and life will interrupt any plan over a real horizon. A plan that treats
interruption as a failure state produces both bad decisions — compensatory training
([Standard 30](30-adherence.md)) — and abandonment.

Planning for interruption means stating how the plan resumes: at what load, after how long an
absence, and when the baseline should be reassessed rather than resumed
([Standard 17](17-baseline-fitness.md) R6).

### R6 — Sustainability includes the person's life, not only their physiology

A plan that is physiologically sustainable and requires more time, energy, or equipment access than
the person has is not sustainable. This is the most common way plans fail, and it is invisible to any
analysis that considers only training variables.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-unsafe-progression-for-targets`](../PROHIBITIONS.md) | encourage unsafe progression solely to hit a target |

## Additions this standard makes beyond the source

- R1's framing of the decision as faster-with-interruption versus slower-without, and the point that
  a layoff costs adaptation as well as time.
- R3 in full — the constructive alternative, and the insistence that accepting a known risk
  explicitly is a legitimate third option.
- R4's observation that a constant rate becomes an increasing relative demand.
- R5 and R6. R6 is the one most likely to be omitted by a system reasoning only about training
  variables, and it is the most common cause of failure in practice.

## Relationship to other standards

[Standard 16](16-goals.md) R4 supplies the principle R3 applies.
[Standard 18](18-progressive-overload.md) covers the mechanism of progression, and R4 here connects
to its R6. [Standard 22](22-training-volume.md) covers the amount being progressed.
[Standard 30](30-adherence.md) receives R5 and shares R6's concern.
[Standard 40](40-sustainability.md) makes the same argument in the nutrition domain.

## Implementation

`fitness.no-unsafe-progression-for-targets` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.

Judging whether a progression rate is safe for a particular person requires knowing their history,
tissue tolerance, and circumstances — none of which is visible to a check that reads files. R1 and R3
through R6 are specified here with no mechanical check.
