# Standard 25 — Cardiovascular Conditioning

Cardiovascular training develops several distinct qualities through different intensities. This
standard governs prescribing it coherently rather than as undifferentiated hard work.

Source: item 25 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans or recommends cardiovascular training.

## Requirements

### R1 — Different intensities develop different things

The adaptations do not stack in a single dimension:

| Roughly | Develops | Recovery cost |
| --- | --- | --- |
| Easy, conversational | Aerobic base, capillary and mitochondrial density, fat oxidation, tissue tolerance | Low |
| Moderate | A mix, and a well-known trap — see R3 | Moderate |
| Threshold | Sustainable pace at the edge of steady state | Moderate to high |
| Hard intervals | Maximal oxygen uptake, high-intensity tolerance | High |

A plan states which quality each session is for. "Cardio" as a single undifferentiated instruction
loses the distinction entirely.

### R2 — Most volume sits at low intensity

For most people and most goals, the majority of cardiovascular volume belongs at genuinely easy
intensity, with a smaller proportion hard. This is not a compromise for beginners — it is broadly
how well-conditioned endurance athletes train, and the reason is recovery: easy volume can be
accumulated, hard volume cannot.

### R3 — The moderate-intensity trap

The most common failure in self-directed cardiovascular training is that easy sessions drift up and
hard sessions drift down, leaving everything at a moderate intensity that is tiring enough to impair
recovery and not hard enough to drive high-end adaptation.

This is [Standard 21](21-rest.md) R3's easy-day failure seen from the training side, and it is worth
stating in both places because it is so common. A plan that prescribes intensity without giving the
person a way to tell whether they are hitting it will produce this outcome by default.

### R4 — Prescribe in terms the person can apply on the day

Perceived exertion and the talk test are robust to heat, sleep, caffeine, and illness in a way heart
rate is not, and they require no device. Where heart rate is used, it is anchored to a measured
maximum rather than an age prediction, and read alongside other signals
([Standard 19](19-exercise-intensity.md) R4 and R5).

The practical test of a prescription is whether someone can tell, mid-session, whether they are doing
it right.

### R5 — Adaptation is slower in connective tissue than in the cardiovascular system

Cardiovascular fitness improves faster than tendons, ligaments, and bone adapt to the associated
impact and volume. This is why a rapidly improving runner can feel capable of far more than their
tissues tolerate, and it is the specific mechanism behind
[Standard 22](22-training-volume.md) R4's dangerous case.

Progression in impact-bearing cardiovascular work should be governed by the slower system.

### R6 — Cardiovascular training interacts with everything else

Substantial cardiovascular volume competes with strength training for recovery and, at high volumes,
for adaptation. A plan pursuing both states which leads ([Standard 16](16-goals.md) R3) rather than
prescribing full programmes of each and leaving the interference implicit.

## Additions this standard makes beyond the source

The source names "cardiovascular conditioning" as a topic. R1's table, R2's distribution, R3's
moderate-intensity trap, R4's applicability test, R5's connective-tissue lag, and R6's interference
argument are all this standard's.

R3 is the most useful of these in practice: it names a failure that is nearly universal in
self-directed training and that no prohibition in the source covers.

## Relationship to other standards

[Standard 19](19-exercise-intensity.md) covers intensity generally and carries the prohibition
against reading heart rate as a complete measure.
[Standard 21](21-rest.md) R3 is R3 from the rest side.
[Standard 22](22-training-volume.md) R4 receives R5.
[Standard 26](26-strength.md) is the other half of R6's interference.
[Standard 17](17-baseline-fitness.md) supplies what intensity is relative to.

## Implementation

No rule in the catalog is bound solely to this standard. Its content is enforced indirectly through
[Standard 19](19-exercise-intensity.md)'s three prohibitions, [Standard 18](18-progressive-overload.md)'s
progression requirement, and [Standard 22](22-training-volume.md)'s volume prohibition.

This is a deliberate choice to keep the catalog at the granularity where rules are distinguishable: a
`fitness.cardiovascular-*` rule would either restate one of those or be too vague to evaluate. The
standard is normative prose that the existing rules enforce, and no detector evaluates it directly.
