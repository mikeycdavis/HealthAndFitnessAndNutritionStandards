# Standard 35 — Fiber

Fibre is the component of dietary quality that is most often below what is generally recommended and
most easily lost when a diet narrows. This standard requires it be a stated target rather than an
assumed by-product.

Source: item 35 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans or evaluates dietary intake.

## Requirements

### R1 — Fiber is a stated target

A plan states a fibre target alongside energy and protein
([Standard 32](32-energy-balance.md) R6). It is in that list because it is the quality marker most
readily lost when a plan optimises for anything else, and because its absence produces no immediate
signal.

Rule [`nutrition.targets-recorded`](../PROHIBITIONS.md).

### R2 — Fiber tracks much of what "dietary quality" means

Fibre intake correlates with the whole-food, plant-containing patterns that dietary quality guidance
generally points toward. It is therefore a useful single indicator — a plan meeting a reasonable
fibre target is usually meeting other things too.

This makes it a good proxy and not a substitute: the correlation runs through food patterns, and it
breaks when fibre is supplied by supplementation rather than by the foods it usually accompanies.
Meeting a target from a powder is not the same nutritional outcome as meeting it from vegetables,
legumes, and whole grains, and a plan should not treat them as interchangeable.

### R3 — Restrictive approaches cut fiber first

Low-carbohydrate patterns, very low-energy diets, elimination diets, and any approach that removes
whole food groups tend to reduce fibre substantially, often without anyone noticing — there is no
acute symptom to prompt attention.

Where a plan adopts such an approach, fibre is explicitly addressed rather than assumed
([Standard 40](40-sustainability.md) and
[`nutrition.no-unjustified-extreme-restriction`](../PROHIBITIONS.md)).

### R4 — Increases are gradual and paired with fluid

A large, sudden increase in fibre commonly produces bloating, discomfort, and abdominal symptoms,
which is a reliable way to make someone abandon an otherwise good change. Increasing over weeks and
alongside adequate fluid ([Standard 38](38-hydration-nutrition.md)) is both more comfortable and more
likely to persist.

This is [Standard 30](30-adherence.md)'s principle applied to a dietary change: the version someone
keeps doing beats the version that is optimal on paper.

### R5 — Some people should not simply increase fiber

Several conditions and clinical situations call for restricting or specifically modifying fibre
intake. Where someone reports such a condition, general guidance to eat more fibre is not
appropriate, and the matter belongs with whoever is managing it
([Standard 1](01-wellness-vs-medical-assessment.md),
[Standard 41](41-dietary-restrictions-and-context.md)).

A blanket "eat more fibre" recommendation is one of the more common ways general guidance is issued
to someone for whom it is wrong.

## Additions this standard makes beyond the source

The source lists "fiber" as a bare word. All five requirements are this standard's, and two are worth
flagging:

- R2's proxy argument together with its limit. Treating fibre as a quality indicator is useful and
  becomes misleading the moment it is supplied in isolation.
- R5's exception, which prevents this standard from being read as a universal instruction — a
  standards series that requires attention to individual context elsewhere would be inconsistent to
  issue one here.

As with [Standard 34](34-protein.md), no numeric target is published. Figures vary by population and
guideline body, and one stated here would be read as authoritative
([Standard 14](14-evidence-quality.md)).

## Relationship to other standards

[Standard 32](32-energy-balance.md) requires the target be stated.
[Standard 37](37-dietary-quality.md) covers the quality R2 proxies.
[Standard 36](36-micronutrient-adequacy.md) covers the wider adequacy question.
[Standard 40](40-sustainability.md) receives R3.
[Standard 38](38-hydration-nutrition.md) supplies R4's fluid.
[Standard 41](41-dietary-restrictions-and-context.md) supplies R5's context.

## Implementation

No rule is catalogued against this standard directly. Its documentation requirement is carried by
`nutrition.targets-recorded`, catalogued against [Standard 32](32-energy-balance.md), which covers
energy, protein, and fibre in one target section.

That rule is a `document` requirement at `partial` assurance and checks that the plan's `## Targets`
section names fiber among energy and protein. Whether the figure is appropriate, and whether R2
through R5 are respected, has no mechanical check.
