# Standard 10 — Known Contextual Factors

Medications are one class of thing that changes what a measurement means. This standard covers the
rest, and establishes the obligation to use what is known.

Source: item 10 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any interpretation where factors bearing on the measurement are known to the project.
Like [Standard 9](09-medications-where-relevant.md), it governs the use of information held, not the
collection of information.

## Requirements

### R1 — The factors that materially affect interpretation

Not an exhaustive list — an exhaustive list is not possible — but the classes that recur:

| Class | Examples |
| --- | --- |
| **Physiological state** | Illness, infection, injury, recovery from either, pregnancy, menstrual cycle phase |
| **Sleep** | Duration, quality, timing, shift work, recent disruption |
| **Load** | A new training block, unusual exertion, a competition, detraining |
| **Substances** | Caffeine, alcohol, nicotine — dose and timing both matter |
| **Environment** | Heat, cold, humidity, altitude, air quality |
| **Disruption** | Travel, time-zone change, schedule change |
| **Psychological** | Acute stress, chronic stress, anxiety about the measurement itself |
| **Life stage and history** | Age, relevant conditions, relevant surgical history |

### R2 — Known factors are used, not merely recorded

Recording a factor and then interpreting as though it were absent satisfies the letter of a
documentation requirement and none of the point. The obligation is that the interpretation changes
where the factor bears on it.

This is why the prohibition in [Standard 9](09-medications-where-relevant.md) covers "medications or
contextual factors" together, and why the detector that checks for a factors section can only claim
`partial` assurance: presence in a record and use in reasoning are different things, and only the
first is visible to a machine.

### R3 — Factors modify; they do not dismiss

A contextual factor explains part of an observation. It does not remove it from consideration,
particularly where symptoms accompany it ([Standard 4](04-symptom-context.md) R5).

"You slept badly and it was hot" is a plausible partial account of an elevated resting heart rate and
not a reason to stop looking, especially if the elevation persists once those factors have passed.
The distinction between explaining and explaining away is the same one
[Standard 12](12-red-flags.md) protects against from the other direction.

### R4 — Unknown factors are a limit on the interpretation

Where relevant factors are unknown, the interpretation is correspondingly limited, and saying so is
part of [Standard 11](11-uncertainty.md)'s requirement. An interpretation produced without knowing
whether the person is ill, sleeping, or under acute stress is not wrong — it is provisional, and it
should read as provisional.

### R5 — Factors are re-examined, not assumed persistent

Context expires. A factor recorded three months ago — a training block, an illness, a period of
disrupted sleep — may no longer apply, and carrying it forward silently produces the mirror of
ignoring it: an observation explained away by something that is no longer true.

Where a factor is used to explain an observation, its currency is part of the claim.

## Prohibitions

This standard shares [Standard 9](09-medications-where-relevant.md)'s prohibition, which names
"medications or contextual factors" in a single clause:

| Rule | Never |
| --- | --- |
| [`health.no-silently-ignored-modifiers`](../PROHIBITIONS.md) | silently ignore medications or contextual factors known to materially affect interpretation |

The rule is catalogued against Standard 9 because that is where its medication half is developed;
its contextual half belongs here.

## Additions this standard makes beyond the source

- R1's classification. The source names "known contextual factors" without enumerating them.
- R2's distinction between recording and using, which is the substantive obligation and the one a
  documentation check cannot reach.
- R3's separation of explaining from explaining away.
- R4's treatment of unknown factors as a limit rather than an absence.
- R5 in full — that context expires, and a stale factor is its own failure mode.

## Relationship to other standards

[Standard 9](09-medications-where-relevant.md) covers medications and carries the shared prohibition.
[Standard 4](04-symptom-context.md) covers the circumstances immediately surrounding a measurement,
where this standard covers the wider and more persistent set.
[Standard 11](11-uncertainty.md) receives R4. [Standard 28](28-sleep.md) and
[Standard 29](29-hydration-fitness.md) develop two of R1's classes in the training domain.

## Implementation

No rule is catalogued solely against this standard. `health.modifiers-recorded` (a `document`
recommendation at `partial` assurance) and `health.no-silently-ignored-modifiers` (`manual-review`,
`none`) are both catalogued against [Standard 9](09-medications-where-relevant.md) and carry this
standard's content as well.

That is a deliberate choice rather than an omission: the source's prohibition names both in one
clause, and splitting it into two rules would create a pair that could drift apart, with a project
satisfying one and not the other while the clause it came from meant a single thing. The cost is
that this standard has no rule of its own, which is recorded here so that a reader checking coverage
does not mistake it for a gap.
