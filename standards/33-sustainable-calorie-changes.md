# Standard 33 — Sustainable Calorie Changes

The size of an energy deficit or surplus determines whether an approach can be maintained and what
the body mass change is made of. This standard carries three of the ten nutrition prohibitions.

Source: item 33 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project recommends changing intake to change body mass.

## Requirements

### R1 — The size of the change determines what the change is made of

A deficit does not remove fat selectively. Larger deficits increase the proportion of loss that is
lean mass, make nutritional adequacy harder to achieve
([Standard 36](36-micronutrient-adequacy.md)), impair training quality and therefore recovery, and
are harder to adhere to.

Moderate deficits, adequate protein ([Standard 34](34-protein.md)), and resistance training
([Standard 26](26-strength.md) R5) are what preserve lean mass. A plan that pursues rapid loss
without those loses more of the wrong thing.

### R2 — Never recommend crash dieting

Reproduced verbatim from the source:

> recommend crash dieting

Severe rapid deficits cost lean mass, are difficult to meet micronutrient needs within, and are
followed by regain often enough that the approach is self-defeating on its own terms. The
sustainable rate outperforms the fast rate measured at any horizon long enough to matter — the same
argument [Standard 23](23-sustainable-progression.md) makes about training.

Rule [`nutrition.no-crash-dieting`](../PROHIBITIONS.md).

### R3 — Never recommend starvation-level approaches

Reproduced verbatim from the source:

> recommend starvation-level approaches

Intakes at this level carry medical risk, cannot meet nutritional requirements, and belong to
supervised clinical settings if anywhere. This is not an aggressive version of ordinary advice; it is
outside what general wellness guidance is competent to give
([Standard 1](01-wellness-vs-medical-assessment.md)).

Where someone is already pursuing such an approach, that is a reason to suggest professional
involvement — not a reason to optimise it, and not a reason to say nothing.

Rule [`nutrition.no-starvation-approaches`](../PROHIBITIONS.md).

### R4 — Never promise exact weight-loss rates

Reproduced verbatim from the source:

> promise exact weight-loss rates

The response to a given intake varies with body composition, adaptation, adherence, measurement
error, and much that is not understood. A promised rate will be wrong — and being wrong in this
particular way teaches the person that the approach failed, when what failed was the promise.

The honest form is a range, with what makes it vary, and a statement of what will be watched to tell
whether it is working.

Rule [`nutrition.no-exact-loss-rate-promises`](../PROHIBITIONS.md).

### R5 — Adaptation means the same intake does not produce the same result indefinitely

Expenditure falls as body mass falls, and non-exercise activity tends to decline in a deficit. A
plan that treats its initial deficit as permanent will find the rate slowing, and the correct
response is a decision — adjust intake, adjust activity, or accept the slower rate — rather than the
reflex of cutting further.

Cutting further at each slowdown is the path into R2's territory one step at a time, and it is how
crash dieting is usually arrived at.

### R6 — Surpluses are subject to the same logic

For gaining mass, larger surpluses increase the proportion gained as fat without proportionally
increasing lean gain, which is limited by training and recovery rather than by intake. The
symmetry is worth stating because guidance for gaining is frequently more careless than guidance for
losing.

### R7 — Periods at maintenance are legitimate and useful

Not every plan needs to be in a deficit or a surplus. Periods at maintenance support recovery,
adherence, and the establishment of habits that survive the next phase — and for many people,
maintaining a change already achieved is the goal rather than an interlude between attempts.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-crash-dieting`](../PROHIBITIONS.md) | recommend crash dieting |
| [`nutrition.no-starvation-approaches`](../PROHIBITIONS.md) | recommend starvation-level approaches |
| [`nutrition.no-exact-loss-rate-promises`](../PROHIBITIONS.md) | promise exact weight-loss rates |

## Additions this standard makes beyond the source

- R1's account of what determines the composition of the loss.
- R3's guidance on what to do when someone is already pursuing such an approach — the source's
  prohibition covers recommending one and is silent on the harder case.
- R4's observation that a broken promise teaches the wrong lesson.
- R5 in full, and specifically the point that cutting further at each slowdown is how crash dieting
  is arrived at incrementally rather than chosen.
- R6's symmetry and R7's legitimation of maintenance.

## Relationship to other standards

[Standard 32](32-energy-balance.md) covers the framework this operates in.
[Standard 34](34-protein.md) and [Standard 36](36-micronutrient-adequacy.md) cover what a deficit
must not sacrifice. [Standard 40](40-sustainability.md) generalises R2's argument.
[Standard 23](23-sustainable-progression.md) makes the same case in training.
[Standard 1](01-wellness-vs-medical-assessment.md) supplies R3's boundary.
[Standard 26](26-strength.md) R5 supplies R1's lean-mass mechanism.

## Implementation

All three prohibitions are `manual-review` at `none` assurance and report not-evaluated without a
recorded human review.

No detector attempts to identify a crash diet from a number. That would require knowing the person's
size, composition, activity, and circumstances, and a threshold-based check would produce both false
positives on legitimate supervised protocols and false negatives on aggressive advice framed
carefully. A confident wrong answer here is worse than no answer, so none is offered.
