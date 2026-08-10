# Standard 6 — Measurement Quality

How a measurement was taken determines what it can support. This standard requires that quality is
assessed, recorded, and allowed to constrain the interpretation — and it forbids the two ways quality
is usually lost.

Source: item 6 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to every physiological measurement a project interprets, and with particular force to
consumer devices, which report values with no indication of how well they were obtained.

## Requirements

### R1 — Quality is assessed before the value is interpreted

The order matters. A measurement's quality determines the range of conclusions it can support, so
assessing it afterwards means the conclusion was already formed and quality becomes something to
argue against rather than a constraint.

What bears on quality:

- **The device and its known error** — every measurement method has one; some are large.
- **Conditions** — position, movement, cuff size and placement, sensor contact, ambient temperature.
- **Protocol adherence** — whether the measurement followed the conditions its reference range assumes.
- **Internal consistency** — whether the value is plausible against the person's other data.
- **Device-reported confidence** — where a device supplies one, which some do and most do not.

### R2 — Never ignore measurement quality

Reproduced verbatim from the source:

> ignore measurement quality

Interpreting a number without its quality treats an artifact as a finding. A blood pressure taken
immediately after climbing stairs, a sleep stage inferred from a night the wearer slept badly with
the device loose, a weight taken at a different time of day against one taken fasted — each carries an
error that can exceed the effect being discussed.

The prohibition covers the passive case as much as the active one. Not asking about quality when it
was available is ignoring it.

Rule [`health.no-ignored-measurement-quality`](../PROHIBITIONS.md).

### R3 — Never treat wearable measurements as perfectly accurate

Reproduced verbatim from the source:

> treat wearable measurements as perfectly accurate

A wearable displays a number identically whether it measured well or badly. The display carries no
error bar, and the absence of one reads as precision.

The categories where this matters most, because the value is an inference rather than a measurement:

| Reported as | Actually |
| --- | --- |
| Sleep stages | Inferred from movement and heart rate; agreement with polysomnography varies by device and by stage, and is insufficient to treat a stage estimate as ground truth |
| Blood oxygen | Optically estimated; sensitive to contact, motion, skin tone, and perfusion |
| Calorie burn | Modelled from movement and heart rate; error is routinely large |
| Stress or readiness scores | Proprietary composites, usually undocumented |
| Body composition by impedance | Sensitive to hydration, and moves with it rather than with fat |

Devices are still useful — their *trends* often carry real signal even where their absolute values do
not, which is one more reason [Standard 2](02-trend-over-event.md) matters. What is forbidden is
treating the number as ground truth.

Rule [`health.no-wearable-as-ground-truth`](../PROHIBITIONS.md).

### R4 — Quality constrains the conclusion, and often the right answer is "measure again"

Where quality is poor, the honest response is usually not a hedged interpretation but another
measurement. A poor measurement earns *worth monitoring* in
[Standard 3](03-safety-and-escalation-tiers.md)'s tiers far more often than it earns escalation, and
saying "this reading is unreliable; here is how to take a better one" is more useful than either
interpreting it or discarding it silently.

### R5 — Quality is recorded

An interpretation record states how the measurement was taken and what that implies. Recording it at
the time is cheap; reconstructing it later is guesswork.

Rule [`health.measurement-quality-recorded`](../PROHIBITIONS.md).

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-ignored-measurement-quality`](../PROHIBITIONS.md) | ignore measurement quality |
| [`health.no-wearable-as-ground-truth`](../PROHIBITIONS.md) | treat wearable measurements as perfectly accurate |

## Additions this standard makes beyond the source

- R1's ordering requirement — quality assessed before interpretation, not after — and its list of
  what bears on quality.
- R3's table of commonly-inferred wearable values. The source's prohibition is a single line; which
  values are inferences rather than measurements is the part a practitioner needs.
- R4 in full, including the observation that "measure again" is frequently the correct output. The
  source does not address what to do about poor quality, only that it must not be ignored.
- R3's note that device trends can carry signal where absolute values do not, which keeps the
  prohibition from being read as "wearables are useless".

## Relationship to other standards

[Standard 5](05-physiological-measurements.md) covers what a measurement is and its provenance.
[Standard 3](03-safety-and-escalation-tiers.md) R3 makes quality an input to tier assignment.
[Standard 11](11-uncertainty.md) covers expressing the resulting uncertainty.
[Standard 15](15-limits-of-interpretation.md) covers the limits that remain even when quality is good.

## Implementation

`health.measurement-quality-recorded` is a `document` requirement at `partial` assurance: a detector
establishes that an interpretation record has a non-empty `## Measurement Quality` section. It
establishes nothing about whether the assessment in it is right.

Both prohibitions are `manual-review` at `none` assurance and report not-evaluated without a recorded
human review. The gap between them and the detector is the clearest illustration in this series of
why `validationType` and `assurance` are separate fields: a section existing and a quality assessment
being sound are not the same claim, and a system that conflated them would report a green on
guidance that had ignored quality entirely inside a well-formed heading.
