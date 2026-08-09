# Standard 15 — Limits of Interpretation

There are questions personal health data cannot answer, no matter how much of it there is or how
carefully it is analysed. This standard names those limits and requires that they be respected rather
than reasoned around.

Source: item 15 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any analysis of a person's health, training, or nutrition data. It is the standard that
says what the whole health domain cannot do.

## Requirements

### R1 — Personal health data is an uncontrolled experiment with one participant

The structural facts, which no amount of data volume changes:

- **No control condition.** What would have happened otherwise is unobserved.
- **Many variables move together.** Sleep, stress, training, diet, illness, and season are
  correlated with each other, so their effects cannot be separated by observation.
- **Small effective sample.** Days are not independent observations; consecutive days share almost
  everything.
- **Selection in the measurements.** People measure when they think to, which is not at random.
- **Feedback.** Seeing the data changes the behaviour that generates it.

These limits are properties of the data, not deficiencies in the analysis, and a more sophisticated
method does not remove them.

### R2 — Never infer causation solely from correlation in personal health data

Reproduced verbatim from the source:

> infer causation solely from correlation in personal health data

Personal data produces coincidences abundantly: dozens of tracked variables over hundreds of days
will yield striking associations by chance alone. A causal claim drawn from one tells someone to
change a behaviour that may have nothing to do with the outcome — and the change will then appear to
work, because regression toward the mean does the rest.

The word **solely** leaves room for the legitimate case. A personal association plus an established
mechanism plus a deliberate test is a reasonable basis for a provisional conclusion. The association
alone is not.

Rule [`health.no-causation-from-correlation`](../PROHIBITIONS.md).

### R3 — What the data can support

Stating the limits is not the same as saying the data is useless, and this standard should not be
read as counselling paralysis. Personal data supports, well:

- describing what happened;
- comparing the present against the person's own history ([Standard 7](07-individual-baseline.md));
- identifying trends ([Standard 8](08-trends.md));
- generating hypotheses worth testing deliberately;
- noticing observations that warrant attention ([Standard 12](12-red-flags.md)).

That is a substantial and genuinely useful list. The failure this standard guards against is
upgrading an item on it into a causal claim.

### R4 — A deliberate test is different from an observation

Where someone changes one thing on purpose, holds the rest as steady as they can, and observes what
happens — with enough time on each side to see past the noise — that is a weak experiment rather than
a mere correlation, and it supports a correspondingly stronger claim.

Recommending such a test is one of the more useful things a system can do with an interesting
association, and it is the honest alternative to asserting the cause.

### R5 — Interpretation is recorded so it can be revisited

An interpretation that is not written down cannot be checked against what actually happened, and the
limits above make that check the main way anyone learns whether their reasoning was any good.

Rule [`health.interpretation-record`](../PROHIBITIONS.md).

### R6 — The limits are stated, not merely observed

Where an analysis reaches the edge of what the data supports, it says so. A reader who is not told
about the limits will assume there are none, because a confident presentation is indistinguishable
from a well-supported one.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-causation-from-correlation`](../PROHIBITIONS.md) | infer causation solely from correlation in personal health data |

## Additions this standard makes beyond the source

- R1's enumeration of the structural limits, and the point that data volume does not address them.
- R2's reading of "solely", and the observation that regression toward the mean will make a spurious
  intervention appear to work.
- R3 in full. Without it the standard reads as counselling paralysis, which would be both wrong and
  counterproductive.
- R4's distinction between a deliberate test and an observation, which is the constructive path out
  of R2.
- R6's requirement that limits be stated rather than merely respected.

## Relationship to other standards

[Standard 11](11-uncertainty.md) covers expressing the uncertainty these limits produce.
[Standard 8](08-trends.md) R5 makes the same description-versus-explanation point for trends.
[Standard 14](14-evidence-quality.md) governs general claims where this governs personal ones.
[Standard 41](41-dietary-restrictions-and-context.md) and
[`nutrition.no-identical-response-assumption`](../PROHIBITIONS.md) apply R1's individual-variation
argument to diet.

## Implementation

`health.interpretation-record` is a `structural` requirement at `partial` assurance: a detector
establishes that interpretation records exist under the expected path. It says nothing about their
accuracy or completeness.

`health.no-causation-from-correlation` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.

R1, R3, R4, and R6 have no mechanical check. They describe a way of reasoning, and this repository
does not claim that a file scan can observe how someone reasoned.
