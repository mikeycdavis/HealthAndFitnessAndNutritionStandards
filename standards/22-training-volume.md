# Standard 22 — Training Volume

Volume is how much work is done. This standard governs setting it against what can be recovered from,
and forbids raising it for speed.

Source: item 22 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project prescribes how much training someone does.

## Requirements

### R1 — Volume produces adaptation only to the extent it can be recovered from

The relationship is not linear and it is not monotonic. Volume produces adaptation up to the point
where recovery keeps pace, and past that point additional volume produces fatigue, injury risk, and
dropout instead — the return does not merely flatten, it reverses.

Where that point sits depends on the person, their history, their sleep, their nutrition, and
everything else in their life. It is not a number that can be looked up.

### R2 — Never recommend extreme exercise volumes merely for faster results

Reproduced verbatim from the source:

> recommend extreme exercise volumes merely for faster results

Speed is the usual justification and the one that does not survive contact with the outcome: the
fastest sustainable rate beats a faster rate that ends in a layoff, because a layoff sets the total
back further than the extra volume advanced it.

The word **merely** marks the boundary. High volumes have legitimate uses — an experienced athlete
building toward a specific event, under supervision, with recovery to match. What is forbidden is
volume raised because someone wants results sooner.

Rule [`fitness.no-extreme-volume-for-speed`](../PROHIBITIONS.md).

### R3 — Volume is measured in terms that mean something

"Five hours a week" and "twenty sets of lower-body work" describe different things, and a plan should
use the measure that matches what it is trying to control:

- **Time** — reasonable for endurance work.
- **Distance** — reasonable for running and cycling, though it ignores terrain and intensity.
- **Sets in a rep range** — the usual unit for resistance training, per muscle group or movement.
- **Tonnage** — sensitive to load selection in ways that can mislead.
- **Session count** — coarse, but it captures frequency, which matters independently.

Whatever the unit, it should be applied consistently, because volume's whole purpose is to be
compared across weeks.

### R4 — Volume rises gradually, and the rise is part of the load

An increase in volume is itself a stimulus that must be recovered from. Large jumps are where injury
concentrates, particularly in connective tissue, which adapts more slowly than the cardiovascular and
muscular systems that make the higher volume feel manageable.

The dangerous case is specific: someone whose fitness has improved enough that a large jump feels
easy, whose tendons have not kept pace. Feeling capable of more volume is not evidence that the
tissue is ready for it.

### R5 — Total load includes what is not training

Physical work, active commuting, childcare, and life stress all draw on the same recovery capacity.
A plan that counts only its own sessions is measuring a fraction of the load and will systematically
prescribe too much for the people with the most demanding lives.

### R6 — Minimum effective volume is a legitimate target

More is not the default direction. For many people, the volume that produces most of the available
benefit is considerably lower than the volume that produces the maximum, and it is far more
sustainable — which, given that adherence dominates long-run outcomes
([Standard 30](30-adherence.md)), often makes it the better prescription outright.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-extreme-volume-for-speed`](../PROHIBITIONS.md) | recommend extreme exercise volumes merely for faster results |

## Additions this standard makes beyond the source

- R1's statement that the return reverses rather than flattens.
- R2's reading of "merely", which keeps the prohibition from being read as a ban on high-volume
  training generally.
- R3's units and the requirement of consistency.
- R4's connective-tissue argument, and the specific dangerous case it names.
- R5 in full — non-training load, which is invisible to most planning tools.
- R6's minimum-effective-volume framing, and its adherence argument.

## Relationship to other standards

[Standard 20](20-recovery.md) covers what volume is set against.
[Standard 18](18-progressive-overload.md) covers increasing it.
[Standard 19](19-exercise-intensity.md) covers the other dimension of load.
[Standard 23](23-sustainable-progression.md) covers the rate of increase.
[Standard 30](30-adherence.md) receives R6's argument.

## Implementation

`fitness.no-extreme-volume-for-speed` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.

No detector evaluates volume. Prescribing a number and knowing whether it is recoverable for a
particular person are different problems, and only the first is visible in a file. R1 and R3 through
R6 have no mechanical check in this release.
