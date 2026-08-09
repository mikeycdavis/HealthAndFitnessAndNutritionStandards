<!--
INTERPRETATION RECORD TEMPLATE

Copy this to artifacts/interpretations/<date>-<subject>.md for each interpretation of a person's
health data.

WHY THESE SECTIONS AND NOT OTHERS. Each one exists because its absence is a specific failure the
standards name, and each is what a detector looks for:

  Context                            Standard 4  — a number without its circumstances is
                                                   close to uninterpretable
  Measurement Quality                Standard 6  — how it was taken bounds what it can support
  Baseline                           Standard 7  — the alternative to naming a comparator is an
                                                   unstated population comparison
  Uncertainty                        Standard 11 — recorded at the time it is honest; added later
                                                   it reads as a retraction
  Medications and Contextual Factors Standard 9  — silence is ambiguous between "none" and
                                                   "nobody asked"
  Escalation Tier                    Standard 13 — without it the reader infers urgency from tone

The headings are exact. `standards audit` looks for them literally, and the test suite asserts this
template and the detectors still agree.

WHAT THE CHECK ESTABLISHES: that each section exists and is non-empty. Nothing more. Whether the
analysis inside is sound is judgment, and every rule bound to these sections carries assurance
"partial" and says so. Filling in the headings does not make an interpretation good.

An honest "not known" is a complete answer in any of these sections, and is much better than
leaving one blank or writing something plausible.
-->

# Interpretation — <what was observed>, <date>

<One or two sentences: what prompted this, and what it concluded. Written so someone reading only
this paragraph is not misled.>

## Observation

<What was measured or reported. Value, unit, time, and method — see Standard 5 R1. Mark each value
as measured, estimated, or unknown; never fill a gap with a plausible number.>

## Context

<Symptoms reported, and the circumstances around the measurement: timing, position, recent activity,
food, caffeine, alcohol, illness, sleep, stress, heat, travel.

Where none were reported, write "None reported" — not nothing. Silence here is ambiguous between
"conditions were unremarkable" and "nobody asked", and only the first supports an interpretation.>

## Measurement Quality

<The device or method, the conditions, and any reason to trust this reading less than usual.

Where quality is poor, say so plainly. "This reading is unreliable; here is how to take a better
one" is usually a more useful output than an interpretation of it.>

## Baseline

<What this is being read against: this person's own range over a stated period, or an explicit
statement that no individual baseline is known and what is being used instead.

A baseline is a range over a period, not a number. "Resting heart rate 50-55 on waking, over the
last three months" — not "52".>

## Medications and Contextual Factors

<Medications known to affect what is being measured, and other factors that bear on it.

Where none are known, write "None known" — which is a different claim from "none".>

## Uncertainty

<How confident this interpretation is, and what else could account for the observation.

List the alternatives and say what would distinguish them. If only one explanation came to mind,
that is usually a fact about the effort spent rather than about the observation.

"There is not enough here to say" is a legitimate and often correct conclusion.>

## Escalation Tier

<Exactly one of:

  normal variation
  worth monitoring
  worth discussing with a professional
  potentially urgent

then say what follows from it: for monitoring, over what interval; for the upper two, what kind of
attention, how soon, and what to bring.

Escalate on the seriousness, not on the confidence — "we are not sure what this is" is a reason to
have someone look, not a reason to wait.>
