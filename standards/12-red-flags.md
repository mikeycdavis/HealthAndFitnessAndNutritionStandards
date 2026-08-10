# Standard 12 — Red Flags

Some observations warrant attention on their own, immediately, regardless of trend or baseline. This
standard defines that category and carries the two prohibitions with the worst consequences in the
series.

Source: item 12 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project receives symptoms or measurements from a person. It defines what belongs
in [Standard 3](03-safety-and-escalation-tiers.md)'s highest tier and the narrow exception to
[Standard 2](02-trend-over-event.md)'s trend-over-event principle.

## Requirements

### R1 — A red flag is defined by asymmetry of cost, not by probability

A red flag is not an observation that is probably serious. It is an observation where the cost of
being wrong in one direction is very much larger than in the other, so the decision does not turn on
the probability at all — which is what makes the category work without anyone having to estimate one.

That asymmetry is why red flags escalate on a single observation. Waiting for a trend is a reasonable
policy when the cost of waiting is low, and it stops being reasonable exactly here.

### R2 — Red flags are recognised, not diagnosed

Recognising that something warrants urgent evaluation is inside the boundary of wellness guidance;
saying what it is, is not ([Standard 1](01-wellness-vs-medical-assessment.md)).

The in-scope form: *this combination is one that warrants prompt evaluation, and here is what to do.*
The out-of-scope form names the condition. The distinction holds even when the condition seems
obvious — and especially then, because a confident wrong name can send someone to the wrong place.

### R3 — Never provide false reassurance when serious warning signs are present

Reproduced verbatim from the source:

> provide false reassurance when serious warning signs are present

This is the failure with the worst consequence in this series. Reassurance is what a worried person
is looking for, so it is accepted readily and questioned rarely — and when it is wrong, it delays
care at the moment delay costs most.

The forms it takes are usually not outright statements that everything is fine:

- explaining away a symptom with a plausible benign cause ([Standard 4](04-symptom-context.md) R5);
- answering the measurement and not the symptom that came with it;
- reporting that a number is within a normal range when the concern was never the number;
- burying the escalation in a paragraph of reassurance, where a reader will not find it;
- treating uncertainty as a reason to wait ([Standard 11](11-uncertainty.md) R6).

Rule [`health.no-false-reassurance`](../PROHIBITIONS.md).

### R4 — Never tell someone to ignore serious symptoms

Reproduced verbatim from the source:

> tell someone to ignore serious symptoms

Instructing someone to disregard a symptom substitutes a judgement the system is not positioned to
make, in the direction that forecloses action. Even where the symptom probably is benign, "probably"
is not a basis for telling someone to stop paying attention.

The prohibition also covers the implied instruction. "That's completely normal, nothing to worry
about" is a dismissal whether or not the word ignore appears.

Rule [`health.no-dismissing-serious-symptoms`](../PROHIBITIONS.md).

### R5 — Escalation language is direct and calm

Someone reading a tier-four message may already be frightened. The writing's job is to say what to do
and why, not to add urgency for emphasis.

What that looks like: name the observation, say plainly that it warrants prompt evaluation, say what
kind — emergency care, urgent appointment, contacting a clinician now — and say what to bring or
mention. Then stop. Piling on consequences does not increase the chance someone acts; past a point it
reduces it.

This is [Standard 3](03-safety-and-escalation-tiers.md) R4 applied at the top tier, where the
temptation to over-emphasise is strongest.

### R6 — A red flag is not softened by a reassuring measurement

Where a red-flag symptom is present, a normal measurement does not lower the tier. The measurement
narrows the possibilities; it does not close the question. A normal heart rate alongside chest pain
does not make the chest pain a lesser observation.

This precedence is stated in [Standard 3](03-safety-and-escalation-tiers.md) R3 and repeated here
because this is where it is most likely to be violated by a system that has a number and a symptom
and treats the number as the harder evidence.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-false-reassurance`](../PROHIBITIONS.md) | provide false reassurance when serious warning signs are present |
| [`health.no-dismissing-serious-symptoms`](../PROHIBITIONS.md) | tell someone to ignore serious symptoms |

## Additions this standard makes beyond the source

- R1's definition of a red flag by cost asymmetry rather than probability, and the resulting
  exception to the trend-over-event principle.
- R2's recognise-but-do-not-name boundary.
- R3's enumeration of the forms false reassurance takes, which is the substantive addition: none of
  them look like reassurance while being written.
- R4's extension to the implied dismissal.
- R5's language discipline at the top tier, and R6's precedence rule.

This standard deliberately does not enumerate specific red-flag presentations. Doing so would produce
a clinical triage list, which is outside what this series is competent to publish and would be read
as authoritative. What it defines is the category and the obligations around it; which presentations
belong in it is a clinical question for the project's own advisers.

## Relationship to other standards

[Standard 3](03-safety-and-escalation-tiers.md) supplies the tiers this standard's subject occupies.
[Standard 2](02-trend-over-event.md) R2 carries the exception R1 justifies.
[Standard 13](13-appropriate-escalation.md) covers acting on it.
[Standard 4](04-symptom-context.md) R5 and [Standard 11](11-uncertainty.md) R6 name two routes to the
failure R3 forbids. [Standard 1](01-wellness-vs-medical-assessment.md) sets R2's boundary.

## Implementation

Both prohibitions are `manual-review` at `none` assurance, and no detector approximates either. This
is the standard where the distance between what tooling can establish and what matters is greatest,
and it is worth being explicit about why: false reassurance is a property of how a whole response
lands on a particular reader, and any keyword-based approximation would flag careful writing while
missing the fluent, plausible, wrong answer that is the actual danger.

Both report not-evaluated until a human review is recorded. In this domain that is the honest
position, and a mechanical green here would be worse than no check at all.
