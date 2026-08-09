# Standard 34 — Protein

Protein is the macronutrient a plan most often gets wrong in the direction that matters, because its
consequences are slow and invisible. This standard governs setting a target for it.

Source: item 34 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans or evaluates dietary intake.

## Requirements

### R1 — Protein is a stated target, not a residual

A plan states a protein target with its basis, rather than letting protein be whatever is left after
energy and preference have decided everything else.

Rule [`nutrition.targets-recorded`](../PROHIBITIONS.md) requires energy, protein, and fibre together,
and protein is in that list because it is the one most often displaced when energy is the focus.

### R2 — Requirements scale with body mass, training, age, and energy availability

The relevant modifiers, without prescribing numbers this repository is not positioned to publish as
clinical guidance:

- **Body mass or lean mass** — the base against which any target is expressed.
- **Training** — resistance training in particular raises requirements.
- **Energy deficit** — requirements rise as energy falls, because protein is otherwise used for
  energy rather than for tissue.
- **Age** — older adults require more per meal to achieve the same anabolic response.

The interaction in the third point is the one most often missed: the situation where protein matters
most is exactly the one where total intake is being cut.

### R3 — Protein in a deficit is what preserves lean mass

Together with resistance training ([Standard 26](26-strength.md) R5), adequate protein is the main
determinant of how much of a body mass loss is fat rather than muscle
([Standard 33](33-sustainable-calorie-changes.md) R1).

A deficit that cuts protein proportionally with everything else loses a larger share as lean tissue —
which is worse for function, worse for expenditure, and largely invisible on a scale that only
reports total mass.

### R4 — Protein must not be squeezed out by a calorie target

Reproduced verbatim from the source, a plan must never:

> ignore nutritional adequacy in pursuit of calorie reduction

Protein is the clearest case of this prohibition in practice: it is energy-dense relative to
vegetables and less satisfying to cut than fat or carbohydrate feels, so it tends to be the casualty
of a deficit unless explicitly protected.

Rule [`nutrition.no-adequacy-sacrifice`](../PROHIBITIONS.md), catalogued against
[Standard 36](36-micronutrient-adequacy.md).

### R5 — Targets respect the person's dietary context

A protein target that ignores what someone will actually eat is not a plan. Vegetarian and vegan
patterns, allergies, budget, cooking access, religious practice, appetite, and medical restrictions
all shape how — and whether — a target can be met
([Standard 41](41-dietary-restrictions-and-context.md)).

Where a target is difficult within the person's constraints, the honest response is to say so and
work within them, not to prescribe the number and treat non-adherence as the person's failure
([Standard 30](30-adherence.md) R4).

### R6 — More is not indefinitely better

Beyond the range that supports the relevant adaptations, additional protein does not produce
additional benefit, and it displaces other foods — including the fibre-bearing ones of
[Standard 35](35-fiber.md). Very high targets also make a plan harder to follow, which costs more
than the marginal protein gains.

Where a project has reason to discuss high intakes, medical conditions affecting protein handling
are a matter for a clinician ([Standard 1](01-wellness-vs-medical-assessment.md)).

## Additions this standard makes beyond the source

The source lists "protein" as a bare word. All six requirements are this standard's. The two most
consequential:

- R2's interaction between deficit and requirement, which inverts the naive expectation that eating
  less means needing less.
- R4's identification of protein as the clearest practical case of the adequacy prohibition, which is
  what connects a bare topic to an existing rule rather than inventing a new one.

This standard deliberately publishes no gram-per-kilogram figures. Numeric targets are clinical
guidance, they vary by population and purpose, and a figure stated here would be read as
authoritative and cited past its evidence — which is exactly what
[Standard 14](14-evidence-quality.md) forbids. What it specifies is that a target exists, has a
basis, and accounts for R2's modifiers.

## Relationship to other standards

[Standard 32](32-energy-balance.md) requires the target be stated.
[Standard 33](33-sustainable-calorie-changes.md) R1 and [Standard 26](26-strength.md) R5 receive R3.
[Standard 36](36-micronutrient-adequacy.md) carries R4's prohibition.
[Standard 41](41-dietary-restrictions-and-context.md) supplies R5's constraints.
[Standard 35](35-fiber.md) is displaced by R6's failure.

## Implementation

No rule is catalogued against this standard directly. Its documentation requirement is carried by
`nutrition.targets-recorded`, catalogued against [Standard 32](32-energy-balance.md) because that
rule covers energy, protein, and fibre in one target section — a single rule rather than three, so
that a plan cannot satisfy one third of it and report progress.

That rule is a `document` requirement at `partial` assurance: a detector establishes that the plan's
`## Targets` section names energy, protein, and fiber. It does not check that the protein figure is
appropriate for the person, which would require knowing their mass, training, age, and energy
intake.

`nutrition.no-adequacy-sacrifice` is `manual-review` at `none` assurance and reports not-evaluated
without a recorded human review.
