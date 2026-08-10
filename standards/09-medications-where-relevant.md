# Standard 9 — Medications Where Relevant

Medications change what measurements mean. This standard requires that known ones are taken into
account, and forbids holding that information and passing over it.

Source: item 9 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies where a project holds or is told about a person's medications. The source's qualifier —
"where relevant" — is load-bearing: this standard does not require a project to collect medication
data. It governs what happens when the information is present.

## Requirements

### R1 — Medications are a class of contextual factor important enough to name separately

[Standard 10](10-known-contextual-factors.md) covers contextual factors generally. Medications get
their own standard because their effects are often large, systematic, and specifically documented —
they do not merely add noise, they can shift the expected value or alter what it means.

Examples of the effect, stated as illustration rather than as a reference table:

- Beta blockers lower heart rate and blunt its response to exertion, so a heart-rate-derived training
  intensity or fitness estimate does not mean what it usually means.
- Diuretics and antihypertensives move blood pressure and fluid balance, and fluid balance moves
  body weight.
- Corticosteroids affect glucose, fluid retention, and sleep.
- Stimulants, including prescribed ones, raise resting heart rate.
- Thyroid medication shifts heart rate, temperature, and weight.
- Some antidepressants and some antihistamines affect sleep architecture, which wearable sleep
  staging then reports as a sleep quality change. Both are broad classes and the effects vary
  substantially by agent — which is itself the reason a project should record what someone actually
  takes rather than reason from the class.

A project need not encode pharmacology to satisfy this standard. It needs to record what is known and
not interpret as though it were absent.

### R2 — Never silently ignore a known modifier

Reproduced verbatim from the source:

> silently ignore medications or contextual factors known to materially affect interpretation

The word carrying the weight is **silently**. A project may lack medication information; that is a
limitation, and a statable one. What is forbidden is having it and producing an interpretation as
though it were not there.

The forms this takes:

- computing a heart-rate training zone for someone on a beta blocker without noting it;
- flagging a resting heart rate as elevated for someone on a stimulant;
- reading a weight change as fat change for someone whose diuretic dose changed;
- comparing against a baseline established before a medication started.

Rule [`health.no-silently-ignored-modifiers`](../PROHIBITIONS.md).

### R3 — Unknown is recorded as unknown

Where medications are not known, the record says so. Silence is ambiguous between "none" and "nobody
asked", and only one of those supports an interpretation. Writing "not known" is cheap and preserves
the distinction.

Rule [`health.modifiers-recorded`](../PROHIBITIONS.md) — a recommendation rather than a requirement,
because many legitimate projects hold no medication data at all. Where it is held, R2's prohibition
applies with full force.

### R4 — Recording is not advising

This standard requires noting how a medication bears on an interpretation. It does not license
commenting on the medication itself.

Statements about whether a medication is appropriate, whether a dose should change, or whether
something should be stopped are medical assessment ([Standard 1](01-wellness-vs-medical-assessment.md)),
and telling someone to stop or alter a medication is outside what wellness guidance may do — reaching
the same class of harm as [`health.no-dismissing-serious-symptoms`](12-red-flags.md) by a different
route.

The in-scope form is: *this measurement is being read in the context of a medication known to affect
it; here is what that means for the interpretation; a change to it is a conversation with the
prescriber.*

### R5 — Medication changes date a baseline

Starting, stopping, or changing a medication that affects a measurement invalidates baselines
established before it ([Standard 7](07-individual-baseline.md) R3). Comparing across such a change
produces a finding about the medication, presented as a finding about the person.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-silently-ignored-modifiers`](../PROHIBITIONS.md) | silently ignore medications or contextual factors known to materially affect interpretation |

## Additions this standard makes beyond the source

- R1's illustrations, and the explicit statement that a project need not encode pharmacology to
  satisfy this standard — only to avoid interpreting as though known information were absent.
- R2's enumeration of the forms silent ignoring takes.
- R3's treatment of unknown as a recorded value.
- R4 in full. The source does not distinguish accounting for a medication from advising about one,
  and the second is a boundary crossing with real potential for harm.
- R5's link between medication change and baseline invalidation.

## Relationship to other standards

[Standard 10](10-known-contextual-factors.md) covers the wider class of factors and shares this
standard's prohibition. [Standard 1](01-wellness-vs-medical-assessment.md) sets the boundary R4
defends. [Standard 7](07-individual-baseline.md) receives R5.
[Standard 6](06-measurement-quality.md) is the adjacent question of how well the measurement was
taken, as opposed to what modifies its meaning.

## Implementation

`health.modifiers-recorded` is a `document` recommendation at `partial` assurance: a detector
establishes that an interpretation record has a non-empty `## Medications and Contextual Factors`
section. It cannot tell whether the factors listed are complete, and it cannot tell whether a listed
factor was actually taken into account in the reasoning — which is the whole of R2.

`health.no-silently-ignored-modifiers` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review. The distance between "the section is non-empty" and
"the medication was accounted for" is exactly the distance between `partial` and `none`.
