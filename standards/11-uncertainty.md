# Standard 11 — Uncertainty

Most consumer health observations admit several explanations. This standard requires that the
alternatives are named and that confidence tracks the evidence, and it forbids the confident single
answer.

Source: item 11 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to every health interpretation. It is the disposition the rest of the health domain depends
on: [Standard 6](06-measurement-quality.md), [Standard 8](08-trends.md), and
[Standard 15](15-limits-of-interpretation.md) all generate uncertainty that has to be expressed
somewhere, and this is where.

## Requirements

### R1 — Name the alternatives, not just the leading explanation

An interpretation states the plausible explanations for what was observed, not only the most likely
one. Listing them is not a formality — it is what reveals when the leading explanation is not
actually ahead of the others, which is the situation most likely to produce a wrong confident answer.

A useful discipline: if only one explanation comes to mind, that is usually a fact about the effort
spent rather than about the observation.

### R2 — Say what would distinguish them

Naming alternatives without saying how to tell them apart leaves a reader with a longer list and no
way forward. Each alternative should carry what would support or eliminate it: another measurement,
a different condition, a symptom to watch for, the passage of time.

This is also what makes an interpretation actionable without escalating it. "If it is the heat, it
will settle within a day of the weather breaking; if it persists past that, it is worth another look"
gives the reader something to do that is neither alarm nor dismissal.

### R3 — Never claim certainty where multiple explanations are possible

Reproduced verbatim from the source:

> claim certainty where multiple explanations are possible

Stated certainty closes off the alternatives in the reader's mind, and it is what makes a wrong
conclusion hard to revisit later — including by the system that produced it, if the conclusion is
stored and built upon.

Certainty is claimed by grammar as much as by assertion. "This is dehydration" and "this is
consistent with dehydration, among other things" carry the same information and different claims.

Rule [`health.no-unwarranted-certainty`](../PROHIBITIONS.md).

### R4 — Uncertainty is expressed at the strength it actually has

Hedging everything is not the safe alternative to false certainty; it is a different failure. A
system that qualifies every statement equally conveys no information about which statements are
solid, and readers respond by ignoring the qualifiers entirely.

Confidence should be graded and the grades should mean something:

| Roughly | Means |
| --- | --- |
| This is what the measurement shows | An observation, not an interpretation |
| This is consistent with X, and X is much the most likely | Alternatives exist but are unlikely |
| This could be X or Y; here is what distinguishes them | Genuinely open |
| There is not enough here to say | The honest answer, and available at all times |

The last row deserves emphasis. "Not enough information" is a legitimate output, and a system that
cannot produce it will manufacture one of the others.

### R5 — Uncertainty is recorded, not just felt

An interpretation record states its confidence and its alternatives. Recorded at the time, this is
honest; added later it reads as a retraction, and the record is what allows the interpretation to be
revisited when the next measurement arrives.

Rule [`health.uncertainty-recorded`](../PROHIBITIONS.md).

### R6 — Uncertainty does not lower an escalation tier

An uncertain interpretation of a potentially serious observation escalates on the seriousness, not on
the confidence. "We are not sure what this is" is a reason to have someone look, not a reason to
wait.

Uncertainty and urgency are independent axes, and collapsing them produces false reassurance
([Standard 12](12-red-flags.md)) by a route that feels like intellectual honesty.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-unwarranted-certainty`](../PROHIBITIONS.md) | claim certainty where multiple explanations are possible |

## Additions this standard makes beyond the source

- R1's discipline — that a single explanation coming to mind is usually a fact about the effort
  spent.
- R2 in full. Naming alternatives without distinguishers is a common half-measure that leaves a
  reader worse off.
- R3's observation that certainty is claimed by grammar as much as by assertion.
- R4's grading, and specifically the argument that uniform hedging is its own failure. The source
  prohibits false certainty and says nothing about the overcorrection.
- R6 in full, which is the most consequential addition here: uncertainty is not a reason to
  de-escalate.

## Relationship to other standards

[Standard 6](06-measurement-quality.md) and [Standard 15](15-limits-of-interpretation.md) generate
much of the uncertainty this standard expresses.
[Standard 3](03-safety-and-escalation-tiers.md) receives R6.
[Standard 14](14-evidence-quality.md) is the adjacent question of how well established a general
claim is, where this standard is about a particular interpretation.
[Standard 42](42-standards-integrity.md) R5 applies the same disposition to compliance conclusions.

## Implementation

`health.uncertainty-recorded` is a `document` requirement at `partial` assurance: a detector
establishes that an interpretation record has a non-empty `## Uncertainty` section. Whether the
confidence expressed there is calibrated is `health.no-unwarranted-certainty`, which is
`manual-review` at `none` assurance and reports not-evaluated without a recorded human review.

There is a pleasing consistency in this standard's own tooling: the check can establish that
uncertainty was written down and cannot establish that it was right, which is exactly the kind of
limit R4 asks a system to state rather than obscure.
