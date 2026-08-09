# Standard 37 — Dietary Quality

Dietary quality is a property of an overall pattern, not of individual foods. This standard carries
the prohibition on moralising food, which is the failure most likely to cause direct harm to a
reader.

Source: item 37 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project describes, evaluates, or recommends what someone eats.

## Requirements

### R1 — Quality is a property of the pattern

No single food determines the quality of a diet, and no single food is required for one. Quality
emerges from what is eaten across days and weeks: adequacy ([Standard 36](36-micronutrient-adequacy.md)),
fibre and whole-food content ([Standard 35](35-fiber.md)), protein sufficiency
([Standard 34](34-protein.md)), variety, and sustainability
([Standard 40](40-sustainability.md)).

Evaluating a diet by cataloguing the presence of particular foods produces a verdict about the list
rather than about the diet.

### R2 — Never moralize food as evidence of personal virtue or failure

Reproduced verbatim from the source:

> moralize food as evidence of personal virtue/failure

Framing foods as good or bad, and eating them as being good or bad, attaches shame to an ordinary
daily activity performed several times a day. Shame does not improve adherence: it predicts
concealment and abandonment, and it is a documented component of disordered eating patterns.

The framing is also simply inaccurate, per R1.

Rule [`nutrition.no-food-moralizing`](../PROHIBITIONS.md).

### R3 — What moralising looks like in practice

It is rarely as explicit as calling a food bad. The forms:

- **Moral vocabulary for food** — "clean", "guilt-free", "sinful", "cheat meal", "junk", "treat" used
  as a moral rather than a descriptive category.
- **Moral vocabulary for the person** — "being good", "falling off the wagon", "earning" or "burning
  off" a food.
- **Compensation framing** — presenting exercise as payment for eating, which is
  [`fitness.no-punitive-compensation`](../PROHIBITIONS.md) arriving from the nutrition side.
- **Streak framing** — presenting a single food choice as breaking something, which converts one
  choice into an abandoned plan.
- **Praise for restriction** — congratulating someone for eating less, which is moralising in the
  direction people notice least and which is actively harmful to some readers.

The last two are the ones systems produce without intending to, because both are natural features of
tracking and gamification.

### R4 — Describe foods by contribution

The alternative to moralising is not silence about food. Foods can be described by what they provide
— protein, fibre, micronutrients, energy density, satiety, cost, convenience, enjoyment — and those
descriptions support decisions without attaching a verdict to the person.

Enjoyment belongs on that list. A pattern nobody enjoys is one nobody sustains
([Standard 40](40-sustainability.md)).

### R5 — Never claim a single food causes or cures complex disease without strong evidence

The prohibition against single-food disease claims belongs to
[Standard 14](14-evidence-quality.md), because its operative clause is about evidence, and it is
noted here because this is where such claims are usually made. Foods framed as toxic or as curative
are R1's error carrying a health claim.

Rule [`nutrition.no-single-food-disease-claims`](14-evidence-quality.md).

### R6 — Guidance stays alert to disordered eating

Restriction, moral framing, compensation, and rigid rules are features of guidance that can be
harmful to someone with or predisposed to a disordered relationship with food. A project cannot
screen for this, and it can avoid the framings that make it worse — which is most of what R2 through
R4 amount to.

Where someone describes patterns suggesting a disorder, that is
[Standard 3](03-safety-and-escalation-tiers.md)'s "worth discussing with a professional" tier, and
the recognise-but-do-not-name boundary of [Standard 12](12-red-flags.md) R2 applies.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-food-moralizing`](../PROHIBITIONS.md) | moralize food as evidence of personal virtue/failure |

## Additions this standard makes beyond the source

- R3's enumeration, which is the substantive addition. The source's prohibition is a single line, and
  none of the five forms announces itself as moralising — two of them are ordinary features of habit
  tracking.
- R4's contribution-based alternative, including enjoyment as a legitimate criterion.
- R6 in full. The source does not mention disordered eating; a standard prohibiting food moralising
  without naming why is missing its strongest reason.

## Relationship to other standards

[Standard 14](14-evidence-quality.md) carries R5's prohibition.
[Standard 35](35-fiber.md) and [Standard 36](36-micronutrient-adequacy.md) supply R1's components.
[Standard 40](40-sustainability.md) receives R4's enjoyment argument.
[Standard 30](30-adherence.md) R5 makes the same point about training.
[Standard 3](03-safety-and-escalation-tiers.md) and [Standard 12](12-red-flags.md) supply R6's
handling.

## Implementation

`nutrition.no-food-moralizing` is `manual-review` at `none` assurance and reports not-evaluated
without a recorded human review.

A keyword detector for R3's vocabulary was considered and rejected. The words in that list appear
just as readily in guidance explaining why *not* to use them — this standard's own text would trip
it — and a check that flagged careful writing while missing moralising expressed in neutral
vocabulary would train projects to avoid words rather than to avoid the framing. That is the
worked example under `docs/examples/` doing the job instead.
