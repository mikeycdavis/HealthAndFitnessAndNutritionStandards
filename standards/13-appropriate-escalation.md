# Standard 13 — Appropriate Escalation

Recognising that something warrants professional attention is only half the obligation. This standard
covers the other half: saying so, in a way that leads to action.

Source: item 13 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to every health interpretation. It is [Standard 3](03-safety-and-escalation-tiers.md)'s tier
model applied to a specific interpretation of a specific person's data.

## Requirements

### R1 — Every interpretation carries exactly one tier, explicitly

An interpretation assigns exactly one of the four tiers from
[Standard 3](03-safety-and-escalation-tiers.md), stated as such:

* normal variation
* something worth monitoring
* something worth discussing with a professional
* potentially urgent warning signs

Not two, not a range, and never left to be inferred from tone. A reader without an explicit tier
infers urgency from wording, which is the least reliable channel available.

Rule [`health.escalation-tier-assigned`](../PROHIBITIONS.md).

### R2 — Escalation names a destination and a timeframe

"See a doctor" is not escalation; it is a gesture at escalation. Useful escalation states what kind
of attention and how soon:

| Tier | Destination | Timeframe |
| --- | --- | --- |
| Worth monitoring | No one yet — another observation | Stated interval |
| Worth discussing | A clinician, pharmacist, physiotherapist, dietitian — whichever fits | Next reasonable opportunity |
| Potentially urgent | Urgent care, emergency services, or contact now, as fits | Now, not at the next convenient time |

Naming the destination matters because the reader's alternative is to guess, and guessing wrong wastes
the escalation — an urgent presentation taken to a routine appointment, or a routine question taken
to an emergency department.

### R3 — Escalation carries what to bring

An escalation is more likely to produce a useful outcome if the reader arrives with the observation
that prompted it: what was measured, when, under what conditions, what symptoms accompanied it, and
what the trend has been. This is the material [Standard 4](04-symptom-context.md) through
[Standard 8](08-trends.md) require to be recorded, and escalation is where it earns its keep.

### R4 — De-escalation is stated as plainly as escalation

*Normal variation* is a real conclusion and is stated as one. A system that will not say anything is
fine is not being careful — it is producing uniform anxiety, and a reader who is told everything
might be something learns to discount all of it, which degrades the escalations that matter
([Standard 3](03-safety-and-escalation-tiers.md) R4).

Saying "this is within your ordinary range, and here is what would change that" is a substantive,
useful, and safe output.

### R5 — Escalation is not delegation of the whole interpretation

Escalating does not remove the obligation to say what was observed and why it warrants attention.
"Ask your doctor" as the entire content of a response transfers the work to a reader who now has to
explain something they were not helped to understand.

Escalate *and* interpret: here is what was observed, here is what it may reflect, here is why
someone should look, here is what to tell them.

### R6 — Tier assignment is revisited when the inputs change

A tier is a judgement about the evidence available at a moment. New measurements, resolved symptoms,
a corrected measurement quality problem, or a discovered contextual factor can move it in either
direction, and a stored interpretation carries its tier forward until something re-examines it.

Where a project keeps interpretations, it should be able to say when a tier was assigned and on what,
so it can be re-evaluated rather than inherited.

## Additions this standard makes beyond the source

The source names "appropriate escalation" as a topic. R2's destination-and-timeframe table, R3's
what-to-bring requirement, R4's insistence that de-escalation be stated plainly, R5's warning against
escalation-as-delegation, and R6's revisiting obligation are all this standard's.

R5 is the addition most worth having: "consult a professional" is the shape defensive guidance takes,
and it is a way of appearing careful while being unhelpful.

## Relationship to other standards

[Standard 3](03-safety-and-escalation-tiers.md) defines the tiers and their language discipline.
[Standard 12](12-red-flags.md) defines what belongs in the top tier.
[Standard 1](01-wellness-vs-medical-assessment.md) sets the boundary escalation crosses responsibly.
[Standard 4](04-symptom-context.md) through [Standard 8](08-trends.md) supply R3's material.
[Standard 11](11-uncertainty.md) R6 governs the case where the interpretation is uncertain.

## Implementation

`health.escalation-tier-assigned` is a `document` requirement at `partial` assurance. The detector
establishes that an interpretation record contains exactly one of the four canonical tier labels — it
checks for exactly one because two labels means the tier was not decided, which is the failure R1
names.

What it does not establish is whether the tier is the *right* one, which is the question that
matters. That is a judgement about clinical seriousness, and no rule in this catalog claims a machine
can make it. R2 through R6 have no mechanical check at all in this release.
