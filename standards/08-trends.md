# Standard 8 — Trends

A trend is what turns a series of measurements into evidence. This standard governs how one is
constructed, what it can support, and the prohibition that separates a trend from a single reading
wearing a trend's clothes.

Source: item 8 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project reasons about change in a person's health measurements over time. It is
[Standard 2](02-trend-over-event.md)'s principle applied to the health domain.

## Requirements

### R1 — A trend has a direction, a period, a magnitude, and a spread

A statement that something is "trending up" is not a trend. What makes one:

| | |
| --- | --- |
| **Direction** | Which way, stated |
| **Period** | Over what span, and how many observations |
| **Magnitude** | How much change |
| **Spread** | How much the underlying measurement varies anyway |

The last is what most reporting omits and what determines whether the trend means anything. A three
beat-per-minute rise means one thing when the measurement varies by one beat day to day and nothing
at all when it varies by eight.

### R2 — Never treat a single reading as a long-term trend

Reproduced verbatim from the source:

> treat a single reading as a long-term trend

One point has no direction. Presenting it as one manufactures a pattern out of noise, and the reader
acts on a movement that may reverse tomorrow for reasons nobody recorded.

The failure has a common disguise: comparing today's reading against a stored average and reporting
the difference as a change. That is still one observation, however many were used to build the thing
it was compared against.

Rule [`health.no-single-reading-as-trend`](../PROHIBITIONS.md).

### R3 — Enough observations, over a period appropriate to the quantity

How many is enough depends on the ratio of the effect to the noise, and different quantities need
very different spans:

- **Body weight** — daily variation routinely exceeds a week of real change, so weeks, not days.
- **Resting heart rate** — moves on sleep, alcohol, illness, heat; a week or more, and interpreted
  with what was going on ([Standard 4](04-symptom-context.md)).
- **Blood pressure** — multiple readings per occasion, multiple occasions, per the protocol the
  reference range assumes.
- **Sleep duration** — highly variable and weekday-patterned; a week is the minimum unit and even
  that mixes weekday with weekend.

Where the available data is too short to support a trend, the honest statement is that it is too
short — not a trend qualified with hedging.

### R4 — Gaps, changes of method, and selection are part of the trend

Three things quietly invalidate a trend:

1. **Gaps.** A trend across a missing month is two trends with a line drawn between them.
2. **Method changes.** A new device, a new measurement time, or a new protocol can produce an
   apparent change that is entirely instrumental ([Standard 6](06-measurement-quality.md)).
3. **Selection.** Measurements taken when someone felt like measuring are not a random sample of
   their days, and the bias usually runs in the direction of the story.

A trend statement notes any of these that apply.

### R5 — A trend describes; it does not explain

A trend establishes that something changed. It does not establish why, and personal health data
rarely contains what would be needed to find out
([Standard 15](15-limits-of-interpretation.md), and
[`health.no-causation-from-correlation`](../PROHIBITIONS.md)).

Report the change, and name the candidate explanations as candidates.

### R6 — A trend can be the finding

Where a baseline itself has shifted — a resting heart rate that has moved from 52 to 68 over two
months, entirely within population normal ranges throughout — the shift is the observation, and it
may be more informative than any single value in it. This is the case [Standard 7](07-individual-baseline.md)
R1 exists for, and it is the strongest argument for keeping individual histories at all.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-single-reading-as-trend`](../PROHIBITIONS.md) | treat a single reading as a long-term trend |

## Additions this standard makes beyond the source

- R1's four components, and the argument that spread is the one that determines meaning.
- R2's note on the disguised form — comparing one reading against a stored average.
- R3's per-quantity guidance on how long a period is needed.
- R4 in full: gaps, method changes, and selection bias.
- R5's separation of description from explanation, and R6's case for the shift itself being the
  finding.

## Relationship to other standards

[Standard 2](02-trend-over-event.md) states the principle this standard applies.
[Standard 7](07-individual-baseline.md) supplies what a trend is measured against and receives R6's
shifted baseline. [Standard 31](31-trend-based-progress.md) is the training counterpart, and
[Standard 32](32-energy-balance.md) the nutrition one. [Standard 6](06-measurement-quality.md)
supplies R4's method changes.

## Implementation

`health.no-single-reading-as-trend` is `manual-review` at `none` assurance. Nothing mechanical
inspects whether a claim about change rests on enough observations; it reports not-evaluated without
a recorded human review.

No detector in this release evaluates trend construction. R1's components and R4's invalidators are
specified here and not built, and that gap is stated rather than papered over.
