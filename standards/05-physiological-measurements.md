# Standard 5 — Physiological Measurements

Physiological measurements are the raw material of everything else in the health domain. This
standard governs what they are, what they can carry, and the one thing that must never happen to
them.

Source: item 5 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project records, stores, or reasons about measurements of a person's body — heart
rate and its variability, blood pressure, temperature, weight and composition, blood oxygen, glucose,
respiratory rate, sleep duration and staging, step and activity counts.

## Requirements

### R1 — A measurement is a value, a unit, a time, a method, and a provenance

A number on its own is not a measurement. What must travel with it:

| | Why |
| --- | --- |
| **Value and unit** | A weight of 70 is meaningless; unit confusion is a real and recurring source of error |
| **Time** | Nearly every physiological quantity varies through the day |
| **Method or device** | Determines what the value can be compared against ([Standard 6](06-measurement-quality.md)) |
| **Provenance** | Whether the value was measured, estimated, derived, or is unknown |

Provenance is the one most often dropped, and the one whose loss is least recoverable. An inferred
sleep stage and a measured heart rate look identical once both are numbers in a row.

### R2 — Derived values are labelled as derived

Many consumer "measurements" are inferences: sleep stages from movement and heart rate, body fat from
impedance, VO2max from pace and heart rate, calorie burn from almost anything. These are model
outputs, and the model's error is a property of the value.

A derived value carries what it was derived from. Treating one as a direct measurement attributes an
authority to it that the device does not claim for itself
([Standard 6](06-measurement-quality.md) R3).

### R3 — Never fabricate a measurement

Reproduced verbatim from the source:

> fabricate health measurements

A measurement that was never taken corrupts everything computed from it, and unlike a wrong
interpretation it leaves no trace of being wrong. The prohibition covers more than inventing a number
outright:

- filling a gap with an estimate and presenting it as observed;
- carrying a previous value forward as though it were current;
- reporting a value at a precision the method cannot support;
- inferring a value from another and recording it as measured.

Each is reasonable as an *estimate*, clearly labelled. Each is fabrication when the label is dropped.

Rule [`health.no-fabricated-measurements`](../PROHIBITIONS.md).

### R4 — Missing is a value

Where a measurement is absent, the record says so. An absent measurement is information — it means an
interpretation rests on less than it might appear to — and replacing it with a plausible number
destroys that information while looking like an improvement.

### R5 — Precision is not accuracy

A device reporting body fat to one decimal place is not measuring to one decimal place. Reporting a
value at the precision the display offers, rather than the precision the method supports, implies an
accuracy that misleads without stating anything false.

Round to what the method supports, or state the uncertainty alongside the value.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-fabricated-measurements`](../PROHIBITIONS.md) | fabricate health measurements |

## Additions this standard makes beyond the source

The source names "physiological measurements" as a topic. R1's five components, R2's treatment of
derived values, R3's enumeration of what counts as fabrication, R4's insistence that missing is a
value, and R5's separation of precision from accuracy are all this standard's.

R3's enumeration is the substantive addition: the source's single line reads as a prohibition on
lying, and the common failures are subtler than that — carrying a value forward, or reporting an
estimate without its label.

## Relationship to other standards

[Standard 6](06-measurement-quality.md) governs how well a measurement was taken.
[Standard 7](07-individual-baseline.md) governs what it is compared against.
[Standard 8](08-trends.md) governs assembling measurements over time.
[Standard 32](32-energy-balance.md) applies the same provenance discipline to nutrition values, and
[`nutrition.no-fabricated-values`](../PROHIBITIONS.md) is this prohibition's counterpart there.

## Implementation

`health.no-fabricated-measurements` is `manual-review` at `none` assurance. Nothing mechanical can
distinguish a recorded measurement from an invented one — that is precisely the property that makes
fabrication dangerous. It reports not-evaluated without a recorded human review.

R1's provenance requirement has a partial mechanical analogue in the nutrition domain
([`nutrition.value-provenance`](../PROHIBITIONS.md)), which scans for provenance markers on numeric
values. No equivalent detector exists for physiological measurements in this release, and none is
claimed.
