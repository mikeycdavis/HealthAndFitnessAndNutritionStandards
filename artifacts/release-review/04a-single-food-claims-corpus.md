# Evidence pack 04a — corpus for `nutrition.no-single-food-disease-claims`

Companion to [pack 04](04-nutrition-no-single-food-disease-claims.md), built before review on the
pattern packs 03a and 01a established.

**The rule.** *Never claim a single food causes or cures complex disease without strong evidence*
(Standard 14 R3, source-verbatim).

**The shape of this review is different from the previous two.** Rule 03 asked whether claims made
were supportable — a corpus of assertions. Rule 01 asked whether language was proportionate — a
corpus of whole documents. This rule asks whether a class of claim is **absent**, which is a negative
and cannot be established by quoting things. So Part 1 is an exhaustive mechanical inventory of every
specific food named anywhere in the nutrition domain, which is what makes the absence checkable
rather than asserted.

---

# Part 1 — Every named food in the nutrition domain

Standards 32–41 run to roughly 7,800 words. A case-insensitive scan for specific foods and food
groups — `vegetable, legume, whole grain, fruit, meat, dairy, milk, coffee, tea, powder, bread, rice,
egg, fish, soy, gluten, nut, oil, butter, juice, snack, dessert` — returns **five lines in total**:

```text
standards/34-protein.md:53   vegetables and less satisfying to cut than fat or carbohydrate feels, so it tends to be the casualty
standards/35-fiber.md:32     Meeting a target from a powder is not the same nutritional outcome as meeting it from vegetables,
standards/35-fiber.md:33     legumes, and whole grains, and a plan should not treat them as interchangeable.
standards/38-hydration-nutrition.md:31  A meaningful share of daily fluid comes from food, and tea, coffee, milk, and other beverages
standards/38-hydration-nutrition.md:32  contribute. Coffee and tea are net contributors at ordinary intakes despite their reputation.
```

In context, the four distinct passages:

**1. `standards/34-protein.md` R4** — vegetables as an energy-density comparator, not a claim about
either food:

> Protein is the clearest case of this prohibition in practice: it is energy-dense relative to
> vegetables and less satisfying to cut than fat or carbohydrate feels, so it tends to be the
> casualty of a deficit unless explicitly protected.

**2. `standards/35-fiber.md` R2** — vegetables, legumes, whole grains named as fibre sources, in a
passage whose purpose is to *limit* a claim:

> This makes it a good proxy and not a substitute: the correlation runs through food patterns, and it
> breaks when fibre is supplied by supplementation rather than by the foods it usually accompanies.
> Meeting a target from a powder is not the same nutritional outcome as meeting it from vegetables,
> legumes, and whole grains, and a plan should not treat them as interchangeable.

**3–4. `standards/38-hydration-nutrition.md` R2** — tea, coffee, milk, on fluid contribution:

> A meaningful share of daily fluid comes from food, and tea, coffee, milk, and other beverages
> contribute. Coffee and tea are net contributors at ordinary intakes despite their reputation.

**No food is named as harmful. No food is named as protective. No disease is named anywhere in the
nutrition domain.** That is the claim this pack exists to let a reviewer check rather than accept.

For completeness, `docs/examples/pair-nutrition-guidance.md` names two more — a home-cooked stew
(used as a value-provenance case) and a slice of cake (used as a food-moralising case). Neither
carries a health claim.

**The same scan run over the rest of the repository** — standards 1–31, `templates/`,
`INSTRUCTIONS.md`, and `README.md` — returns exactly one line:

```text
standards/04-symptom-context.md:60   "You had coffee" is a reason a heart rate might be elevated
```

Coffee as a confounder for a heart-rate reading, in a requirement about not explaining findings away.
No food is named as harmful or protective anywhere in the repository, in any domain.

---

# Part 2 — The prohibition, and its reasoning

## `standards/14-evidence-quality.md` R3, in full

> ### R3 — Never claim a single food causes or cures complex disease without strong evidence
>
> Reproduced verbatim from the source:
>
> > claim a single food causes or cures complex disease without strong evidence
>
> Complex diseases have many contributing causes, and single-food claims almost always outrun their
> support — typically a mechanism demonstrated in vitro, or an association in an observational study
> with substantial confounding.
>
> The qualifier matters in both directions: this is not a prohibition on discussing diet and disease,
> which is a real and important subject. It is a prohibition on the causal or curative claim about a
> single food where the evidence does not carry it. And the cure claim is the more dangerous half,
> because it can displace treatment that works.
>
> Rule [`nutrition.no-single-food-disease-claims`](../PROHIBITIONS.md) — catalogued here, in the
> evidence standard, rather than in a nutrition standard, because its operative clause is about
> evidence.

## The catalogued rule

| Field | Value |
| --- | --- |
| `id` | `nutrition.no-single-food-disease-claims` |
| `kind` | `prohibition` |
| `severity` | `error` |
| `standard` | 14 |
| `validationType` | `manual-review` |
| `assurance` | `none` |
| `description` | *claim a single food causes or cures complex disease without strong evidence* (source-verbatim) |

`rationale`:

> Complex diseases have many contributing causes, and single-food claims almost always outrun their
> evidence — usually a mechanism in vitro or an association in an observational study. The harm is
> not only the false belief: a cure claim can displace treatment that works.

*(Reviewed under rule 03 as claim C183 and found supportable.)*

---

# Part 3 — The structural position that makes the prohibition self-enforcing

## `standards/37-dietary-quality.md` R1

> No single food determines the quality of a diet, and no single food is required for one. Quality
> emerges from what is eaten across days and weeks: adequacy, fibre and whole-food content, protein
> sufficiency, variety, and sustainability.
>
> Evaluating a diet by cataloguing the presence of particular foods produces a verdict about the list
> rather than about the diet.

*(Reviewed under rule 03 as claim C149.)*

This is load-bearing. If R1 holds, a single-food disease claim is not merely unsupported but
inconsistent with the repository's own account of what dietary quality is.

## `standards/37-dietary-quality.md` R4 — the alternative to moralising

> The alternative to moralising is not silence about food. Foods can be described by what they
> provide — protein, fibre, micronutrients, energy density, satiety, cost, convenience, enjoyment —
> and those descriptions support decisions without attaching a verdict to the person.

## `standards/37-dietary-quality.md` R5 — the cross-reference

> The prohibition against single-food disease claims belongs to Standard 14, because its operative
> clause is about evidence, and it is noted here because this is where such claims are usually made.
> Foods framed as toxic or as curative are R1's error carrying a health claim.

## `standards/40-sustainability.md` R2 — reputation is not a justification

> What is not a proportionate justification: that it produces faster results, that it simplifies
> tracking, or that a food group has been assigned a reputation.

## `standards/36-micronutrient-adequacy.md` R5 — supplements routed to the evidence standard

> Claims about what a supplement does are subject to Standard 14 in full — this is a domain where
> confident claims routinely outrun their evidence.

## `standards/36-micronutrient-adequacy.md` R6 — no deficiency by inference

> Attributing symptoms to a specific micronutrient deficiency from dietary patterns or from how
> someone feels is inference presented as a finding.

---

# Part 4 — The nearest thing to a violation

`standards/35-fiber.md` R2 is the closest the repository comes to a food-to-outcome claim, and pack
04 flagged it in advance. In full:

> ### R2 — Fiber tracks much of what "dietary quality" means
>
> Fibre intake correlates with the whole-food, plant-containing patterns that dietary quality
> guidance generally points toward. It is therefore a useful single indicator — a plan meeting a
> reasonable fibre target is usually meeting other things too.
>
> This makes it a good proxy and not a substitute: the correlation runs through food patterns, and it
> breaks when fibre is supplied by supplementation rather than by the foods it usually accompanies.
> Meeting a target from a powder is not the same nutritional outcome as meeting it from vegetables,
> legumes, and whole grains, and a plan should not treat them as interchangeable.

**Why this is not the prohibited claim, and what a reviewer should test.** It is about a nutrient
rather than a food; it is an association rather than a causal or curative claim; it names no disease;
and its second paragraph exists to bound it. Claims C137 and C138 were reviewed under rule 03 and not
found defective. The question here is narrower: whether the qualification holds *for this
prohibition* — whether "usually meeting other things too" could be read by an adopter as licensing
the single-nutrient-to-outcome inference this rule forbids.

Adjacent, and worth the same test — `standards/40-sustainability.md` R2's list of what restriction
costs, and `standards/33-sustainable-calorie-changes.md` R1 on the composition of body-mass loss.
Both make claims about physiological outcomes, but neither names a food and neither names a disease.
They belong to rule 03, which reviewed them as C167 and C122.

---

# Part 5 — The 15 nutrition `rationale` fields

Pack 04 flagged these as the least-scrutinised prose in the domain, and rule 03's review proved the
flag correct: two of the fifteen carried defects. All fifteen were reviewed under rule 03 (C181–C188
plus restatements) and the two defects were remediated at `79d39d1`.

For this rule the question is narrower — do any of them make a food-to-disease claim? The three that
come closest:

**`nutrition.no-single-food-disease-claims`** — quoted in Part 2 above. The rule's own rationale is
the one place the repository discusses food and disease at length, and it does so to prohibit rather
than to assert.

**`nutrition.no-food-moralizing`** *(remediated at `79d39d1`)*:

> Framing food as good or bad, and eating as being good or bad, attaches shame to an ordinary daily
> activity. Moralising food can contribute to shame and to rigid eating patterns, and weight-related
> stigma and internalised stigma are associated with disordered-eating outcomes. Stated at
> association strength deliberately: no demonstrated causal chain is claimed, and none is needed,
> because moralising has no benefit to set against the risk. The framing is also simply inaccurate:
> no single food determines a diet's quality.

Note the last clause restates Standard 37 R1 — the structural position — inside the catalog.

**`nutrition.no-unjustified-extreme-restriction`**:

> Eliminating whole food groups narrows nutrient intake and is hard to sustain, so it needs a reason
> proportionate to the cost — an allergy, a diagnosed condition, a clinical protocol. Restriction
> adopted without one tends to persist past any benefit and to expand.

Names food *groups* generically, no specific group, no disease.

---

# Part 6 — The gap, left open deliberately

`docs/examples/pair-nutrition-guidance.md` is the domain's worked compliant/violating pair. Its
violating version breaks six rules:

| Breaks | How |
| --- | --- |
| `nutrition.no-crash-dieting` | A fixed 1,200 kcal target set to hit a date |
| `nutrition.no-exact-loss-rate-promises` | "about a kilo a week — that gets you there with a week to spare" |
| `nutrition.no-fabricated-values` | "I've logged the stew at 650 kcal, 30 g protein" |
| `nutrition.no-food-moralizing` | "ruined the week", "stay clean", "back on track" |
| `fitness.no-punitive-compensation` | "add an extra gym session to make up for it" |
| `nutrition.no-adequacy-sacrifice` | 1,200 kcal with no reference to protein, fibre, or micronutrients |

**It does not exercise `nutrition.no-single-food-disease-claims`.** Nothing else in the repository
does either. A reader can see what five other nutrition prohibitions look like when broken, and never
sees this one.

## The question, and why the example has not been written

Pack 04 recorded this as a probable documentation gap. The reviewer has since sharpened it into the
question this review turns on:

> whether that's merely a documentation gap or whether the corpus itself fails to demonstrate the
> prohibition clearly enough for release

**The example has deliberately not been written.** Adding it before review would answer the question
rather than let a reviewer answer it, and the two outcomes call for different responses:

- **Documentation gap.** The prohibition is adequately specified — Standard 14 R3 defines it, R1 of
  Standard 37 makes it structurally coherent, Standard 40 R2 and Standard 36 R5 route the adjacent
  cases to it — and what is missing is a demonstration. The fix is one worked pair, and the rule is
  otherwise establishable.
- **Corpus failure.** The absence of any worked violation is evidence that the prohibition is not
  operationalised: nothing in the repository shows an adopter what the boundary between "discussing
  diet and disease", which R3 explicitly permits, and "the causal or curative claim about a single
  food", which it forbids, actually looks like. On that reading the rule is not establishable until
  the boundary is demonstrated, not merely stated.

The distinction matters beyond this rule. Three other prohibitions have no worked violating example
either — `nutrition.no-starvation-approaches`, `nutrition.no-identical-response-assumption`, and
`nutrition.no-scale-change-as-fat-change` — so a finding of corpus failure here would imply a broader
release condition than one example.

---

# Where the implementer's confidence is thinnest

1. **The gap above**, which is the review's substance.
2. **Standard 35 R2's proxy argument.** Not defective on rule 03's reading, but "a plan meeting a
   reasonable fibre target is usually meeting other things too" is the one sentence an adopter could
   over-read into a single-nutrient-to-outcome claim.
3. **The prohibition is catalogued against Standard 14, not a nutrition standard.** That is
   defensible — its operative clause is "without strong evidence" — but it means a reader working
   through the nutrition domain meets the prohibition only via Standard 37 R5's cross-reference.
   Whether that placement makes it harder to find is a fair question.
4. **The mechanical inventory proves absence only for the food names it scanned for.** The word list
   in Part 1 is finite and hand-chosen. It covers the whole repository, not just the nutrition
   domain, but a claim phrased around a food it does not list — a named supplement, a branded
   product, a compound rather than a food — would not appear in it. The inventory narrows the search
   honestly; it does not exhaust it, and a reviewer should treat it as a starting point rather than
   as proof.

## Disposition

```text
Rule:        nutrition.no-single-food-disease-claims
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (citing standard and requirement)
```
