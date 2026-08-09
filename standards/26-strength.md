# Standard 26 — Strength

Strength training develops force production, and the qualities it protects — muscle mass, bone
density, tendon tolerance, movement competence — matter well beyond athletic performance. This
standard governs prescribing it.

Source: item 26 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans or recommends resistance training.

## Requirements

### R1 — Strength is prescribed as load, repetitions, sets, and proximity to failure

The four together determine the stimulus, and proximity to failure is the one most often left
implicit. "Three sets of ten" describes very different sessions depending on whether the tenth
repetition was comfortable or barely completed, and a plan that omits it has not specified the
intensity at all.

Repetitions in reserve — how many more could have been done — is the most transferable way to state
it, and it works without knowing a tested maximum.

### R2 — Technical quality bounds useful load

Load added beyond the point where movement quality degrades is not training the intended pattern; it
is training a compensation, under load. This is a specific instance of
[Standard 19](19-exercise-intensity.md)'s prohibition on treating maximum effort as inherently
superior, and it is where that prohibition has the most direct injury consequence.

A prescription that cannot be performed well is too heavy, whatever the number says.

### R3 — Training close to failure is a tool, not a default

Proximity to failure drives adaptation and carries a recovery cost that rises steeply near the
limit. Repeatedly training to failure across a whole programme raises fatigue substantially for a
modest additional stimulus, and it degrades the technical quality R2 requires.

This is why [`fitness.no-max-effort-as-superior`](../PROHIBITIONS.md) matters here specifically: in
resistance training the belief that harder is always better has an immediate mechanical consequence.

### R4 — Frequency, and the tissue that adapts slowest

Distributing work across the week generally beats concentrating it, for the same reason volume beats
intensity at the margin: it is recoverable. Tendons and connective tissue adapt more slowly than
muscle, so a programme whose loads rise as fast as strength does will outrun tendon tolerance —
[Standard 22](22-training-volume.md) R4's mechanism in the resistance domain.

### R5 — Strength training is broadly protective, and this is worth saying

Resistance training supports bone density, muscle mass retention with age, tendon and joint
tolerance, and functional capacity in later life. It is frequently omitted from plans built around
cardiovascular goals or weight loss, and that omission has costs that appear slowly.

In a calorie deficit particularly, resistance training plus adequate protein is what preserves lean
mass ([Standard 34](34-protein.md), [Standard 33](33-sustainable-calorie-changes.md)), and a
weight-loss plan without it loses a larger proportion of that weight as muscle.

### R6 — Progression in strength follows the general rule

[Standard 18](18-progressive-overload.md) applies without modification: one variable at a time, on a
stated trigger, with a stated response when the trigger is not met, and with planned reductions.
Strength progression is unusually prone to load being added on a schedule rather than on a trigger,
because the numbers are so easy to increment.

## Additions this standard makes beyond the source

The source names "strength" as a topic. R1's four components — particularly proximity to failure —
R2's quality bound, R3's cost curve, R4's tendon lag, R5's protective case and the lean-mass argument
in a deficit, and R6's note about schedule-driven loading are all this standard's.

R5's second paragraph is the one that connects this standard to the nutrition domain, and it is the
reason a weight-loss plan that ignores resistance training is a worse plan rather than merely a
narrower one.

## Relationship to other standards

[Standard 19](19-exercise-intensity.md) carries the prohibitions R2 and R3 depend on.
[Standard 18](18-progressive-overload.md) governs R6.
[Standard 22](22-training-volume.md) R4 shares R4's mechanism.
[Standard 25](25-cardiovascular-conditioning.md) R6 covers the interference between the two.
[Standard 33](33-sustainable-calorie-changes.md) and [Standard 34](34-protein.md) receive R5.
[Standard 24](24-pain-injury-signals.md) governs the signals that stop a set.

## Implementation

No rule in the catalog is bound solely to this standard, for the same reason as
[Standard 25](25-cardiovascular-conditioning.md): its requirements are enforced through the intensity
prohibitions, the progression requirement, and the volume prohibition, and a `fitness.strength-*`
rule would either restate one of those or be too vague to evaluate.

No detector evaluates resistance-training prescriptions.
