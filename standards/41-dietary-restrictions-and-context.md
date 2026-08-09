# Standard 41 — Dietary Restrictions/Context Where Known

Guidance that ignores what a person cannot or will not eat is not merely unsuitable — where the
restriction is an allergy or a medical requirement, it is unsafe. This standard governs recording
that context and carries the prohibition on assuming everyone responds alike.

Source: item 41 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project gives dietary guidance. The source's qualifier — "where known" — governs
collection: this standard does not require a project to gather this information, and it governs what
happens when the information exists.

## Requirements

### R1 — The classes of restriction and context

| Class | Examples |
| --- | --- |
| **Safety-critical** | Allergies, coeliac disease, other medically required exclusions |
| **Medical** | Conditions and medications with dietary implications, including interactions |
| **Ethical and religious** | Vegetarian and vegan practice, religious observance including periods of fasting |
| **Intolerance and preference** | Digestive intolerances, textures and foods a person will not eat |
| **Practical** | Budget, cooking access and skill, time, food availability, who else eats the same meals |
| **Cultural** | Food traditions, staple patterns, what a normal meal is |

Only the first is unsafe to violate, and the others are the ones that determine whether a plan is
followed at all ([Standard 40](40-sustainability.md) R3). A plan that respects only the safety-critical
class produces guidance nobody uses.

### R2 — Safety-critical restrictions are absolute

An allergy or medically required exclusion is not a preference to be worked around or a constraint to
be optimised against. Guidance that includes an allergen for someone who has declared an allergy is a
direct harm, and no nutritional benefit offsets it.

Where a project generates food suggestions and holds this information, that is the one place in this
series where a mechanical check would be straightforwardly worth building.

### R3 — Unknown is recorded as unknown

Where restrictions are not known, the plan says so rather than leaving silence to be read as "none".
This is the same discipline as [Standard 4](04-symptom-context.md) R3 and
[Standard 9](09-medications-where-relevant.md) R3, and it matters most here because the default
assumption — that there are no restrictions — is the one that produces harm when wrong.

Rule [`nutrition.restrictions-recorded`](../PROHIBITIONS.md).

### R4 — Never assume every individual responds identically to a diet

Reproduced verbatim from the source:

> assume every individual responds identically to a diet

Responses differ with physiology, medication, health status, culture, budget, schedule, and
preference. Advice built on a single assumed response fits the average of a population that contains
nobody, and it fails first for the people whose circumstances differ most from whoever the guidance
was written for.

Rule [`nutrition.no-identical-response-assumption`](../PROHIBITIONS.md).

### R5 — State which parts of the guidance depend on what

Where guidance rests on an assumption about the person, the assumption is stated and so is what would
change if it were different. This makes the guidance correctable by a reader who knows something the
system does not — which, given R3, is frequently the case.

### R6 — Context changes and is re-asked

Restrictions and circumstances change: diagnoses arrive, budgets shift, households change, practices
begin or end. Context recorded once and carried forward indefinitely becomes wrong silently, in the
same way a stale baseline does ([Standard 7](07-individual-baseline.md) R3).

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-identical-response-assumption`](../PROHIBITIONS.md) | assume every individual responds identically to a diet |

## Additions this standard makes beyond the source

- R1's classification, and the observation that only the first class is unsafe to violate while the
  others determine whether the plan is used.
- R2's absoluteness, and the note that this is the one place a mechanical check would clearly earn
  its place.
- R3's treatment of unknown, with the reason it matters more here than elsewhere: the default
  assumption is the dangerous one.
- R5's requirement to expose assumptions so a reader can correct them, and R6's expiry.

## Relationship to other standards

[Standard 40](40-sustainability.md) R3 receives R1's practical classes, and covers restrictions a
plan imposes rather than ones the person has.
[Standard 34](34-protein.md) R5 and [Standard 35](35-fiber.md) R5 apply this standard's constraints
to specific targets. [Standard 9](09-medications-where-relevant.md) covers medications in the health
domain. [Standard 15](15-limits-of-interpretation.md) R1 makes R4's individual-variation argument
about data. [Standard 7](07-individual-baseline.md) R3 shares R6's expiry logic.

## Implementation

`nutrition.restrictions-recorded` is a `document` requirement at `partial` assurance: a detector
establishes that the nutrition plan has a non-empty `## Restrictions and Context` section. It cannot
establish that the restrictions recorded are complete, nor that the plan respects them.

`nutrition.no-identical-response-assumption` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.

R2's allergen check is deliberately **not** implemented here and is noted as the clearest candidate
for future work. Implementing it requires access to a project's food data and its stored
restrictions, which this repository's detectors do not have — they read a repository's documents, not
its runtime data. A check that appeared to verify allergen safety without that access would be the
most dangerous false green this system could produce, so none is offered.
