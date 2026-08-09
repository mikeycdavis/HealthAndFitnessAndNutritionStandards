# Standard 4 — Symptom Context

A measurement without its circumstances is close to uninterpretable. This standard requires that what
the person was experiencing, and what was happening around them, is captured alongside the number.

Source: item 4 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any interpretation of a person's health data. Context is usually known at the moment of
measurement and lost shortly afterwards, which is why capturing it is a requirement rather than a
suggestion.

## Requirements

### R1 — Symptoms accompany the measurement, and usually outweigh it

Where symptoms are reported, they are recorded with the measurement and carry more interpretive
weight than it does. A resting heart rate of 105 with no symptoms is a different observation from the
same number with chest tightness and breathlessness, and the second is not a worse version of the
first — it is a different question.

This ordering matters for escalation: [Standard 3](03-safety-and-escalation-tiers.md) R3 states that
symptoms and red flags dominate a reassuring number, and this standard is where the symptoms enter
the record.

### R2 — Circumstances are part of the observation

The circumstances that routinely change what a measurement means:

- **Timing** — time of day, position (lying, sitting, standing), time since waking, time since eating.
- **Recent activity** — exercise, physical exertion, stairs, the walk from the car.
- **Substances** — caffeine, alcohol, nicotine, medication taken or missed ([Standard 9](09-medications-where-relevant.md)).
- **State** — illness, poor sleep, acute stress, pain.
- **Environment** — heat, cold, altitude, travel and time-zone shift.
- **Cycle and life stage** — where relevant to what is being measured.

The list is not a form to complete. It is a set of things that, when present and unrecorded, will
later look like a finding.

### R3 — Absence of context is recorded as absence, not as normality

A record that says nothing about circumstances is ambiguous between "conditions were unremarkable"
and "nobody asked". Only the first supports an interpretation, so the record says which it is.

This is the same discipline as [Standard 9](09-medications-where-relevant.md) R3 and
[Standard 41](41-dietary-restrictions-and-context.md) R3 — silence is not information, and the cheap
fix is to write "none reported" rather than to write nothing.

### R4 — Context is captured at the time

Reconstructing circumstances later is guesswork that reads as fact once written down. Where a system
records measurements, the moment of recording is when the context is available.

Rule [`health.symptom-context-recorded`](../PROHIBITIONS.md) requires an interpretation record to
carry a context section.

### R5 — Context does not become an excuse

Circumstances explain a measurement; they do not dismiss it. "You had coffee" is a reason a heart
rate might be elevated and not a reason to stop paying attention to it, particularly where symptoms
accompany it. The failure of explaining away is a form of false reassurance
([Standard 12](12-red-flags.md)) reached by a respectable-looking route.

Where context plausibly accounts for an observation, the honest statement names the explanation and
what would distinguish it from the alternatives — which is [Standard 11](11-uncertainty.md)'s
requirement, not a replacement for it.

## Additions this standard makes beyond the source

The source names "symptom context" as a topic to cover and does not say what covering it consists of.
R1's precedence rule, R2's list, R3's treatment of silence, R4's timing requirement, and R5's warning
about explaining away are all this standard's.

R5 in particular is included because the failure it names is invisible from inside: dismissing a
finding by naming a plausible confounder feels like careful reasoning.

## Relationship to other standards

[Standard 9](09-medications-where-relevant.md) covers medications, a class of context important
enough to have its own standard and its own prohibition.
[Standard 10](10-known-contextual-factors.md) covers the wider set.
[Standard 12](12-red-flags.md) governs symptoms that escalate on their own.
[Standard 6](06-measurement-quality.md) covers how the measurement was taken, which is a different
question from what surrounded it.

## Implementation

`health.symptom-context-recorded` is a `document` requirement at `partial` assurance. A detector
establishes that an interpretation record has a non-empty `## Context` section. It cannot establish
that the context recorded there is complete, relevant, or correctly weighted against the measurement
— R1 and R5, the substance of this standard, are not mechanically checkable.

The template at [`templates/interpretation-record.md`](../templates/interpretation-record.md) defines
the heading the detector looks for, so the vocabulary is in one place.
