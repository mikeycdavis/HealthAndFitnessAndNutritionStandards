# Standard 36 — Micronutrient Adequacy

Adequacy is the dimension of a diet that gets dropped when attention is on calories, and its failures
are slow and invisible. This standard requires it be addressed explicitly and carries the prohibition
against trading it away.

Source: item 36 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project plans dietary intake, and with particular force where the plan reduces
energy or removes food groups.

## Requirements

### R1 — Adequacy is a constraint on the plan, not a hope about it

A plan states how it addresses nutritional needs beyond energy — which is a different question from
whether the energy target is right, and one that a plan optimising for energy will not answer by
accident.

Rule [`nutrition.adequacy-considered`](../PROHIBITIONS.md), as a recommendation: not every project
plans diet in enough depth to carry an adequacy section, and where one does, the prohibition in R2
applies regardless.

### R2 — Never ignore nutritional adequacy in pursuit of calorie reduction

Reproduced verbatim from the source:

> ignore nutritional adequacy in pursuit of calorie reduction

Calories are one dimension and the easiest to optimise against, which is exactly why adequacy is
lost. A deficit that leaves protein, fibre, or micronutrients short produces fatigue, lean mass loss,
and poor adherence — it undermines the outcome it was adopted for, while the scale reports success.

Rule [`nutrition.no-adequacy-sacrifice`](../PROHIBITIONS.md).

### R3 — Risk concentrates where the plan is narrow or the energy is low

Adequacy risk is not uniform. It rises with:

- **Lower total energy** — fewer calories means less room for everything, and requirements do not
  fall proportionally.
- **Excluded food groups** — each exclusion removes a cluster of nutrients, and the cluster is
  usually not obvious to the person excluding it.
- **Repetitive eating patterns** — variety is a substantial part of how adequacy is achieved in
  practice.
- **Life stage and circumstance** — pregnancy, growth, older age, and certain conditions and
  medications all change requirements.

A plan identifies which of these apply to it and says what it does about them.

### R4 — Name the nutrients the plan puts at risk

Generic reassurance that a plan is "balanced" is not adequacy consideration. The useful form names
the nutrients this particular plan's structure makes harder to obtain, and says how each is covered
or that it is not.

That is a specific and checkable claim rather than a comfortable one, and it is the difference
between an adequacy section that does work and one that occupies a heading.

### R5 — Supplementation is a tool with a specific place

Where a plan structurally cannot supply a nutrient, supplementation is a reasonable answer and should
be stated as part of the plan. What it is not is a general substitute for food-derived intake, and
recommending supplementation to correct a suspected deficiency, or at doses above ordinary intake, is
a clinical matter rather than a wellness one
([Standard 1](01-wellness-vs-medical-assessment.md)).

Claims about what a supplement does are subject to [Standard 14](14-evidence-quality.md) in full —
this is a domain where confident claims routinely outrun their evidence.

### R6 — Suspected deficiency is a matter for testing, not inference

Attributing symptoms to a specific micronutrient deficiency from dietary patterns or from how someone
feels is inference presented as a finding
([`health.no-diagnosis-from-single-measurement`](../PROHIBITIONS.md) and
[Standard 15](15-limits-of-interpretation.md)). Where a deficiency is genuinely suspected, that is a
reason to suggest evaluation, which is
[Standard 13](13-appropriate-escalation.md)'s "worth discussing with a professional".

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-adequacy-sacrifice`](../PROHIBITIONS.md) | ignore nutritional adequacy in pursuit of calorie reduction |

## Additions this standard makes beyond the source

- R3's risk factors, which turn a general obligation into something a plan can act on.
- R4's requirement to name specific nutrients, which is what separates a real adequacy section from a
  reassuring one.
- R5's placement of supplementation, and its subordination to the evidence standard.
- R6 in full — the deficiency-by-inference failure, which is common and sits squarely on the
  wellness/medical boundary.

No numeric requirements are published here, for the reasons given in
[Standard 34](34-protein.md): figures vary by population and guideline body, and one stated here
would be read as authoritative.

## Relationship to other standards

[Standard 33](33-sustainable-calorie-changes.md) creates R3's low-energy risk.
[Standard 40](40-sustainability.md) creates its exclusion risk.
[Standard 34](34-protein.md) R4 names protein as the clearest case of R2.
[Standard 35](35-fiber.md) is a specific instance.
[Standard 14](14-evidence-quality.md) governs R5's claims.
[Standard 13](13-appropriate-escalation.md) and [Standard 15](15-limits-of-interpretation.md) supply
R6's handling.

## Implementation

`nutrition.adequacy-considered` is a `document` recommendation at `partial` assurance: a detector
establishes that the nutrition plan has a non-empty `## Adequacy` section. It cannot establish that
the section names the right nutrients, or that adequacy is actually met — R4's substance is exactly
what the detector cannot see.

`nutrition.no-adequacy-sacrifice` is `manual-review` at `none` assurance and reports not-evaluated
without a recorded human review.
