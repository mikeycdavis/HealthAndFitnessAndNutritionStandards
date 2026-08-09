# Evidence pack 04 — `nutrition.no-single-food-disease-claims`

**The rule.** *Never claim a single food causes or cures complex disease without strong evidence*
(Standard 14 R3, source-verbatim).

**Why it is catalogued against Standard 14 rather than a nutrition standard.** Its operative clause is
"without strong evidence", which makes it a claim about evidence. Standard 37 links to it.

**What the reviewer must decide.** Whether the nutrition standards avoid attributing complex disease
causation or cure to individual foods without appropriately strong evidence.

---

## Material to review

| Path | What it contributes |
| --- | --- |
| `standards/32-…` through `standards/41-…` | The nutrition domain (~7,800 words) |
| `standards/14-evidence-quality.md` R3 | The prohibition and its reasoning |
| `standards/37-dietary-quality.md` | Where such claims would most naturally appear |
| `rules/nutrition.json` — the 15 `rationale` fields | Prose that reads as authoritative and sits in JSON |
| `docs/examples/pair-nutrition-guidance.md` | A worked compliant/violating pair |

## The structural position the repository takes

Standard 37 R1 is the load-bearing claim, and it is the one that makes this prohibition mostly
self-enforcing:

> No single food determines the quality of a diet, and no single food is required for one. Quality
> emerges from what is eaten across days and weeks.

Standard 14 R3 gives the reasoning:

> Complex diseases have many contributing causes, and single-food claims almost always outrun their
> support — typically a mechanism demonstrated in vitro, or an association in an observational study
> with substantial confounding.

and bounds the prohibition in both directions:

> The qualifier matters in both directions: this is not a prohibition on discussing diet and disease,
> which is a real and important subject. It is a prohibition on the causal or curative claim about a
> single food where the evidence does not carry it. And the cure claim is the more dangerous half,
> because it can displace treatment that works.

## What the reviewer is checking for

The repository asserts it makes no such claims. The check is whether that holds, including in the
places where such a claim would be easiest to make without noticing:

- **Standard 37 (Dietary Quality)** — the natural home for a "this food is bad for you" claim.
  R3 enumerates the forms food moralising takes and R4 requires foods be described "by what they
  provide". No food is named as harmful or protective anywhere.
- **Standard 40 (Sustainability)** — R2 explicitly rejects "that a food group has been assigned a
  reputation" as a justification for restriction, and links back to this prohibition.
- **Standard 35 (Fiber)** — R2 claims fibre "correlates with the whole-food, plant-containing patterns
  that dietary quality guidance generally points toward" and immediately bounds it: the correlation
  runs through food patterns and "breaks when fibre is supplied by supplementation". **This is the
  closest the repository comes to a food-to-outcome claim.** It is an association about a nutrient
  rather than a disease claim about a food, and it is qualified — but it is the one to examine.
- **Standard 36 (Micronutrient Adequacy)** — R5 places supplementation claims explicitly under
  Standard 14, noting "this is a domain where confident claims routinely outrun their evidence".
  R6 forbids attributing symptoms to a specific deficiency by inference.
- **Standard 33 (Sustainable Calorie Changes)** — makes claims about the *composition* of body mass
  loss under different deficits. These are physiological, not disease-causation, claims; they belong
  to pack 03.

## The worked violating example

`docs/examples/pair-nutrition-guidance.md` does not exercise this prohibition — its violating version
breaks crash dieting, exact-rate promises, fabricated values, food moralising, and punitive
compensation, but not single-food disease claims.

**A reviewer may reasonably record that as a gap:** the prohibition has no worked negative example
anywhere in the repository, so a reader never sees what violating it looks like. That would be a
content finding to fix (add the example), not a reason to withhold the rule — but it is the kind of
omission this review exists to surface.

## Where the implementer's confidence is thinnest

1. **Standard 35 R2's fibre-quality correlation** — the nearest thing to a nutrient-to-outcome claim,
   and the one whose qualification a reviewer should test.
2. **The 15 `rationale` fields in `rules/nutrition.json`.** Written to explain rather than to be
   cited, and less scrutinised than standards prose because they sit in JSON. `nutrition.no-food-moralizing`'s
   rationale asserts shame "is a documented component of disordered eating patterns"; `nutrition.no-crash-dieting`'s
   asserts severe deficits "are followed by regain often enough that the approach is self-defeating on
   its own terms". Both are claims about outcomes rather than about single foods, so they sit closer to
   pack 03 — but a reviewer looking only at standards prose would miss them.
3. **The absence of a worked violating example** for this prohibition specifically.

## Disposition

```text
Rule:        nutrition.no-single-food-disease-claims
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (citing standard and requirement)
```
