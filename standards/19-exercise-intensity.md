# Standard 19 — Exercise Intensity

Intensity is the most misread variable in training. This standard governs how it is prescribed and
carries three prohibitions, all of which are versions of the same error: treating a cost as if it
were a benefit.

Source: item 19 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project prescribes, measures, or evaluates how hard someone trains.

## Requirements

### R1 — Intensity is chosen for an adaptation, and the choice is stated

Different intensities produce different adaptations, and higher is not a superset of lower. Easy
aerobic work, threshold work, and maximal efforts each develop things the others do not, and they
carry very different recovery costs.

A prescription states what the intensity is for. "Hard" is not a target; the target is what the
session is meant to develop, and the intensity follows from it.

### R2 — Never treat maximum effort as inherently superior

Reproduced verbatim from the source:

> treat maximum effort as inherently superior

Most adaptation comes from accumulated work at sustainable intensities, and maximal effort carries a
recovery cost that limits how much of it is useful. Treating it as inherently better inverts the
ratio that actually produces progress, and it selects for people who tolerate punishment rather than
people who improve.

Rule [`fitness.no-max-effort-as-superior`](../PROHIBITIONS.md).

### R3 — Never equate exhaustion with workout quality

Reproduced verbatim from the source:

> equate exhaustion with workout quality

Exhaustion measures how depleted someone is, which is a cost. A session can be exhausting and
useless — the wrong stimulus, applied until something ran out — or comfortable and highly productive.

Treating depletion as the goal produces training nobody can sustain and, in aggregate, less of it.

Rule [`fitness.no-exhaustion-as-quality`](../PROHIBITIONS.md).

### R4 — Never treat heart rate alone as a complete measure of exercise quality

Reproduced verbatim from the source:

> treat heart rate alone as a complete measure of exercise quality

Heart rate is one signal and a genuinely useful one, but it moves on heat, hydration, caffeine,
sleep, illness, and stress independently of training. It also says nothing about the qualities much
of training exists to develop — force production, movement quality, skill, technique under fatigue.

The specific failure: optimising the number rather than the thing it proxies. Someone who trains to
hit a heart-rate zone will, on a hot day, do less work to hit it and record a successful session.

Rule [`fitness.no-heart-rate-as-complete-measure`](../PROHIBITIONS.md).

### R5 — Read intensity from several signals

Heart rate alongside perceived exertion, the work actually performed, and — where it matters —
technical quality and repetitions in reserve. Where signals disagree, the disagreement is
information: a heart rate higher than the effort warrants is one of the more useful early signals
that recovery is inadequate ([Standard 20](20-recovery.md)).

Perceived exertion deserves more respect than it usually gets. It integrates everything the person's
body knows, including the things no device measures.

### R6 — Intensity is relative to the individual

A prescription is anchored to the person's own capacity, per
[Standard 17](17-baseline-fitness.md) R3, and specifically not to an absolute or to an age-predicted
value whose individual error exceeds the width of the zones drawn from it.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-max-effort-as-superior`](../PROHIBITIONS.md) | treat maximum effort as inherently superior |
| [`fitness.no-exhaustion-as-quality`](../PROHIBITIONS.md) | equate exhaustion with workout quality |
| [`fitness.no-heart-rate-as-complete-measure`](../PROHIBITIONS.md) | treat heart rate alone as a complete measure of exercise quality |

Three of the eleven fitness prohibitions attach here — more than to any other standard — because
intensity is where the confusion between cost and benefit concentrates.

## Additions this standard makes beyond the source

- R1's requirement that a prescription state what the intensity is for, and the point that higher
  intensity is not a superset of lower.
- R4's worked failure: hitting a heart-rate zone with less work on a hot day and recording it as
  success.
- R5 in full, including the argument for perceived exertion and the reading of signal disagreement as
  an early recovery warning.
- The observation in R2 that maximal-effort worship selects for tolerance of punishment rather than
  for improvement.

## Relationship to other standards

[Standard 17](17-baseline-fitness.md) supplies what intensity is relative to.
[Standard 20](20-recovery.md) covers the cost side, and [Standard 22](22-training-volume.md) the
amount. [Standard 25](25-cardiovascular-conditioning.md) covers the intensity distribution across a
training week. [Standard 24](24-pain-injury-signals.md) covers the signals that stop a session
regardless of its intensity target.

## Implementation

All three prohibitions are `manual-review` at `none` assurance and report not-evaluated without a
recorded human review. No detector evaluates how a project prescribes intensity, and none is claimed.

No rule in the catalog is bound solely to R1, R5, or R6; they are specified here and unimplemented in
tooling, which is stated rather than left to be discovered.
