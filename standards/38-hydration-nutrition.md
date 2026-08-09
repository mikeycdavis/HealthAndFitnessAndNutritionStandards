# Standard 38 — Hydration (Nutrition)

Hydration as a dietary matter — daily fluid intake, what it comes from, and how much of the common
guidance about it is supportable. [Standard 29](29-hydration-fitness.md) covers hydration around
training.

Source: item 38 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

*The source lists `hydration` once in the fitness list and once in the nutrition list. The two are
disambiguated as items 29 and 38 in the derived specification; see
[ADR 0004](../artifacts/adr/0004-derived-numbered-spec.md).*

## Scope

Applies wherever a project gives guidance about daily fluid intake.

## Requirements

### R1 — Fluid needs vary and are not a universal number

Requirements vary with body size, activity, climate, diet, and health status. The widely repeated
fixed daily volume is not well supported as a universal target, and repeating it is
[Standard 14](14-evidence-quality.md)'s failure — a confident number with weaker provenance than its
ubiquity suggests.

Thirst is a reasonable guide for most healthy adults under ordinary conditions. Where a project
offers a target, it says what it depends on.

### R2 — Fluid comes from food and from drinks other than water

A meaningful share of daily fluid comes from food, and tea, coffee, milk, and other beverages
contribute. Coffee and tea are net contributors at ordinary intakes despite their reputation.

Guidance that counts only plain water understates intake and produces advice to drink more than
someone needs.

### R3 — More is not indefinitely better

Beyond meeting needs, additional fluid produces no benefit, and in the extreme carries risk — see
[Standard 29](29-hydration-fitness.md) R2 for the exercise-associated case. Framing hydration as a
quantity to maximise is the same error as framing training volume that way
([Standard 22](22-training-volume.md)).

### R4 — Hydration interacts with the rest of the plan

Fibre increases require adequate fluid to be comfortable ([Standard 35](35-fiber.md) R4). Alcohol,
high-sodium intake, and some medications affect fluid balance. Beverages contribute energy, which
belongs in the energy accounting of [Standard 32](32-energy-balance.md) rather than being invisible
because it was drunk.

### R5 — Some situations are clinical

Fluid restriction or specific fluid targets are prescribed in several conditions, and in those cases
general "drink more" guidance is wrong and potentially harmful. Persistent unusual thirst, marked
changes in urination, or fluid retention are matters for evaluation rather than for hydration
advice ([Standard 1](01-wellness-vs-medical-assessment.md),
[Standard 13](13-appropriate-escalation.md)).

### R6 — Hydration status is not well measured by consumer tools

Apps and devices that report hydration status estimate it from logging or from poorly validated
proxies. Presenting such an estimate as a measurement is
[`health.no-wearable-as-ground-truth`](../PROHIBITIONS.md), and the same caution applies to
consumer-facing interpretations of urine colour, which is affected by supplements, foods, and
medications as well as by hydration.

## Additions this standard makes beyond the source

The source lists "hydration" as a bare word. All six requirements are this standard's. Two worth
flagging:

- R1's and R2's correction of two pieces of very widely repeated guidance — the fixed daily volume
  and the exclusion of other beverages. Both are cases where a standards series requiring evidence
  quality elsewhere would be inconsistent to let common belief stand.
- R5, which prevents general guidance from being issued to people for whom it is contraindicated —
  the same structure as [Standard 35](35-fiber.md) R5.

## Relationship to other standards

[Standard 29](29-hydration-fitness.md) covers hydration around training.
[Standard 35](35-fiber.md) R4 receives R4's fibre interaction.
[Standard 32](32-energy-balance.md) receives R4's beverage energy.
[Standard 14](14-evidence-quality.md) governs R1.
[Standard 6](06-measurement-quality.md) governs R6.
[Standard 41](41-dietary-restrictions-and-context.md) covers R5's individual context.

## Implementation

No rule in the catalog is bound solely to this standard. Its content is carried by the wearable
prohibition, the evidence-quality rules, and the escalation rules.

No detector evaluates hydration guidance.
