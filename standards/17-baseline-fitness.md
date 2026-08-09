# Standard 17 — Baseline Fitness

Intensity is meaningful only relative to current capacity. This standard requires that capacity is
established before it is prescribed against, and forbids prescribing without it.

Source: item 17 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project prescribes or recommends training. It is
[Standard 7](07-individual-baseline.md)'s argument in the training domain: the same prescription is
trivial for one person and injurious for another.

## Requirements

### R1 — Baseline is current capacity, history, and constraints

Three components, and the second two are the ones usually skipped:

| | |
| --- | --- |
| **Current capacity** | What the person can do now — distances, loads, durations, at what effort |
| **Training history** | How long they have trained, how recently, at what volume. A returning athlete and a true beginner have the same current capacity and very different tolerances |
| **Constraints** | Injuries current and past, conditions, medications ([Standard 9](09-medications-where-relevant.md)), time, equipment, access |

Training history matters because tissue tolerance and technical competence do not decay at the same
rate as fitness. Someone returning after a year off has the fitness of a beginner and the confidence
and technique of a trained person, which is a combination that produces injuries.

### R2 — Never prescribe intensity without considering baseline and context

Reproduced verbatim from the source:

> prescribe intensity without considering baseline/context

A prescription issued without a baseline is a guess presented as a plan, and the error falls hardest
on the least trained — the people least able to recognise that a prescription is unreasonable and
most likely to be hurt by attempting it.

Rule [`fitness.no-intensity-without-baseline`](../PROHIBITIONS.md).

### R3 — Intensity is expressed relative to the individual

Prescriptions anchored to the person rather than to an absolute: a percentage of a tested maximum, a
rating of perceived exertion, a pace relative to a recent time trial, a heart rate relative to a
measured — not age-predicted — maximum, or simply repetitions in reserve.

Age-predicted maximum heart rate deserves specific mention because it is ubiquitous and has an
individual error of roughly ±10–12 beats per minute, which is wider than the zones drawn from it.
Using it is acceptable where nothing better exists, provided the error is acknowledged — which is
[Standard 7](07-individual-baseline.md) R4's requirement in another domain.

### R4 — Establishing a baseline must not itself be unsafe

Maximal testing is a poor first interaction with someone whose capacity is unknown. Submaximal
estimates, conservative starting loads adjusted over the first weeks, and perceived-effort anchors
all establish a workable baseline without requiring an untrained person to find their limit.

Starting conservatively and adjusting costs a week or two. Getting it wrong in the other direction
costs considerably more.

### R5 — Baselines are recorded and dated

A recorded baseline is dated by the recording, which is what makes it visibly stale later. An
unrecorded one is silently assumed to still hold, and a plan continues to prescribe against a
capacity from a year ago.

Rule [`fitness.baseline-recorded`](../PROHIBITIONS.md).

### R6 — Baselines move in both directions

Illness, layoff, poor sleep, life stress, and age all reduce capacity, sometimes quickly. A plan that
only ever revises the baseline upward will eventually be prescribing against a capacity the person no
longer has, which is where the load-versus-recovery failures in
[Standard 18](18-progressive-overload.md) begin.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-intensity-without-baseline`](../PROHIBITIONS.md) | prescribe intensity without considering baseline/context |

## Additions this standard makes beyond the source

- R1's three components, and the argument that training history is distinct from current capacity —
  the returning-athlete case is a well-known injury pattern the source does not mention.
- R3's treatment of age-predicted maximum heart rate, including the size of its individual error.
- R4 in full. Requiring a baseline creates pressure to test for one, and maximal testing of an
  untrained person is a foreseeable harm the requirement itself could cause.
- R6's insistence that baselines move downward too.

## Relationship to other standards

[Standard 7](07-individual-baseline.md) is the health-domain counterpart.
[Standard 19](19-exercise-intensity.md) governs what is prescribed against this baseline.
[Standard 18](18-progressive-overload.md) governs moving it.
[Standard 16](16-goals.md) supplies the destination.
[Standard 24](24-pain-injury-signals.md) covers R1's injury constraints.

## Implementation

`fitness.baseline-recorded` is a `document` requirement at `partial` assurance: a detector
establishes that the fitness plan has a non-empty `## Baseline` section. It cannot establish that the
baseline is accurate, current, or complete.

`fitness.no-intensity-without-baseline` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review. A section existing does not establish that
prescriptions were actually derived from what is in it.
