# Standard 16 — Goals

A training plan without a stated goal cannot be wrong, which is the problem. This standard requires
that what the training is for is written down, and that the goal is the kind of thing a plan can be
built from.

Source: item 16 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans or recommends training. It is the first fitness standard because
everything after it — intensity, volume, progression, recovery — is only assessable relative to what
the training is for.

## Requirements

### R1 — The goal is stated, and it is the plan's first content

Without a stated goal every prescription is unfalsifiable: no session can be wrong for a plan that
never said what it was aiming at. A written goal is also what lets anyone notice when training has
drifted away from it, which happens gradually and is invisible from inside.

Rule [`fitness.plan-documented`](../PROHIBITIONS.md) requires a plan artifact with a goals section.

### R2 — A usable goal names an outcome, a horizon, and a way of knowing

| | Weak | Usable |
| --- | --- | --- |
| Outcome | "Get fitter" | "Run 10km continuously" |
| Horizon | unstated | "Within four months" |
| Knowing | unstated | "Completing the distance at conversational pace" |

The horizon matters because it is what makes a rate of progression assessable
([Standard 23](23-sustainable-progression.md)), and the way of knowing matters because otherwise
progress is judged by feel, on the day, which is
[Standard 31](31-trend-based-progress.md)'s failure mode.

### R3 — Goals are prioritised where they conflict

Multiple simultaneous goals frequently interfere: maximal strength and endurance compete for
recovery, rapid fat loss competes with strength gain, and high-frequency skill work competes with
both. A plan that pursues all of them equally makes the trade-off implicitly and badly.

Where goals conflict, the plan says which one leads and what the others are willing to concede.

### R4 — The goal constrains the plan, not the reverse

This is the requirement that connects to the prohibitions. A goal is a means to an outcome, and when
the safe rate of progression will not reach it in time, the answer is to move the goal — not to
compress the plan ([Standard 23](23-sustainable-progression.md) and
[`fitness.no-unsafe-progression-for-targets`](../PROHIBITIONS.md)).

A goal that cannot be safely reached in the time available is information about the goal.

### R5 — Health-adjacent goals are handled with the boundary in view

Goals framed around a health outcome — lowering blood pressure, managing a condition, losing weight
for a medical reason — sit close to [Standard 1](01-wellness-vs-medical-assessment.md)'s boundary.
The training side of such a goal is in scope; the clinical side is not, and where a condition is
being managed, the plan should be visible to whoever is managing it.

### R6 — Goals are revisited

Goals change legitimately — circumstances shift, interest moves, the original goal turns out not to
have been the real one. A plan pursuing a goal nobody holds any more produces poor adherence that
looks like a discipline problem and is actually a goal problem
([Standard 30](30-adherence.md)).

Revisiting is part of the review cadence ([Standard 31](31-trend-based-progress.md)).

## Additions this standard makes beyond the source

The source names "goals" as a topic. R2's three components, R3's prioritisation requirement, R4's
constraint direction, R5's health-adjacent handling, and R6's revisiting obligation are this
standard's.

R4 is the load-bearing one: it is the principle that makes the prohibition against unsafe progression
follow rather than merely be asserted.

## Relationship to other standards

[Standard 17](17-baseline-fitness.md) supplies where the plan starts, as this supplies where it is
going. [Standard 23](23-sustainable-progression.md) governs the route between them and receives R4.
[Standard 30](30-adherence.md) receives R6. [Standard 39](39-goal-compatibility.md) is the nutrition
counterpart — whether a dietary approach is compatible with the training goal.
[Standard 31](31-trend-based-progress.md) governs measuring progress toward the goal.

## Implementation

`fitness.plan-documented` is a `structural` requirement at `partial` assurance. A detector
establishes that a fitness plan artifact exists and has a `## Goals` section. It establishes nothing
about whether the goals are well formed, prioritised, or appropriate for the person — R2 through R6
have no mechanical check.

The template at [`templates/fitness-plan.md`](../templates/fitness-plan.md) defines the headings the
detector looks for.
