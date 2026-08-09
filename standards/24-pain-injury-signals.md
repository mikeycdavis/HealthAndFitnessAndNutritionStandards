# Standard 24 — Pain/Injury Signals

Pain during training is sometimes ordinary and sometimes a signal that damage is occurring. This
standard governs telling them apart, deciding in advance what to do, and carries the prohibition on
training through the second kind.

Source: item 24 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans, prescribes, or responds to training. It is the fitness domain's
counterpart to [Standard 12](12-red-flags.md), and it shares that standard's asymmetry of cost.

## Requirements

### R1 — Training discomfort and injury pain are different signals

Not degrees of the same thing. The distinctions that carry the decision:

| | Training discomfort | Injury pain |
| --- | --- | --- |
| Quality | Burning, heaviness, breathlessness, general ache | Sharp, stabbing, catching, or a distinct localised pain |
| Location | Diffuse, in the working muscles | Localised, often at a joint, tendon, or bone |
| Timing | During effort; eases when it stops | May start suddenly, persist after stopping, or appear at rest |
| Course | Fades over hours to a couple of days | Persists, or worsens with continued use |
| Effect on movement | Movement remains normal | Altered movement, guarding, loss of range, instability |
| What it accompanies | Effort | Sometimes swelling, bruising, numbness, weakness, or a sound at onset |

No single row is decisive. Sharp pain at a joint that alters how someone moves is the clear case, and
the clear case is the one this standard is most concerned with.

### R2 — Never recommend training through sharp or significant injury pain

Reproduced verbatim from the source:

> recommend training through sharp/significant injury pain

Sharp pain signals that something is being damaged, and training through it converts a recoverable
problem into a lasting one. The distinction in R1 is well understood by people who train and
routinely blurred by systems that treat persistence as a virtue.

Rule [`fitness.no-training-through-sharp-pain`](../PROHIBITIONS.md).

### R3 — The response protocol is decided in advance

The decision to stop is made worst in the moment, by someone invested in finishing the session.
Deciding the rule beforehand, when nothing is at stake, is what makes it followable when something
is.

A protocol states: what distinguishes the two kinds of signal, what to do on encountering the second
(stop the movement, not merely reduce it), what to do afterwards, and what warrants professional
evaluation rather than self-management.

Rule [`fitness.pain-response-protocol`](../PROHIBITIONS.md) — a recommendation, because not every
project plans training in enough depth to carry one. Where a project does plan training, R2 applies
regardless.

### R4 — Modification is usually available, and stopping is not all-or-nothing

Stopping a movement rarely means stopping training. Pain in one movement often leaves others
unaffected, and offering the modification is what makes the stopping rule realistic rather than
aspirational — a protocol whose only option is "stop training" will be ignored.

The modification is specific to the signal, and where nothing can be done without provoking it, that
is itself the answer.

### R5 — Some presentations warrant evaluation rather than management

Certain signals are outside what a training plan should attempt to manage: pain following a distinct
traumatic event, inability to bear weight, marked swelling, numbness or weakness, a joint that gives
way, pain that wakes someone at night, or pain that is not improving over a reasonable period.

This is [Standard 3](03-safety-and-escalation-tiers.md)'s upper tiers applied to training, and the
recognise-but-do-not-name boundary of [Standard 12](12-red-flags.md) R2 applies: a plan can say this
warrants assessment; it cannot say what the injury is.

### R6 — Persistent minor signals are read as a pattern

Recurring niggles that individually never justify stopping are one of the clearest signs that load
has outrun tolerance ([Standard 20](20-recovery.md) R5). Each in isolation is unremarkable, which is
why they need to be read together — an application of [Standard 2](02-trend-over-event.md) in the
direction where the trend is the warning.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-training-through-sharp-pain`](../PROHIBITIONS.md) | recommend training through sharp/significant injury pain |

## Additions this standard makes beyond the source

- R1's table. The source's prohibition presupposes the distinction and does not draw it, and the
  distinction is the part a practitioner needs.
- R3's argument for deciding in advance, and what a protocol must contain.
- R4 in full — the observation that an all-or-nothing stopping rule gets ignored, so modification is
  what makes the protocol real.
- R5's list, bounded by the recognise-but-do-not-name rule.
- R6's reading of accumulated niggles as a trend rather than a series of non-events.

## Relationship to other standards

[Standard 12](12-red-flags.md) is the health-domain counterpart and supplies R5's boundary.
[Standard 3](03-safety-and-escalation-tiers.md) supplies the tiers.
[Standard 20](20-recovery.md) R5 receives R6.
[Standard 18](18-progressive-overload.md) and [Standard 22](22-training-volume.md) cover the load
that produces these signals. [Standard 2](02-trend-over-event.md) supplies R6's reading.

## Implementation

`fitness.pain-response-protocol` is a `document` recommendation at `partial` assurance: a detector
establishes that the plan has a non-empty `## Pain and Injury Response` section. Whether the protocol
in it is correct is `fitness.no-training-through-sharp-pain`, which is `manual-review` at `none`
assurance and reports not-evaluated without a recorded human review.

The gap is worth naming here as it was in [Standard 6](06-measurement-quality.md): a section
existing and a protocol being sound are different claims, and this is a standard where the
consequence of confusing them lands on someone's body.
