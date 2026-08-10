# Standard 40 — Sustainability

A dietary approach that ends is an approach that did not work, whatever it achieved while it lasted.
This standard treats sustainability as a design requirement and carries the prohibition on
unjustified extreme restriction.

Source: item 40 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project recommends a dietary approach.

## Requirements

### R1 — The horizon is the one the goal implies, and it is usually longer than the plan

Most dietary goals are goals about a state, and a state has to be maintained. A plan that reaches a
target and cannot be continued has solved half the problem, since regain following an approach that
ends is a common outcome. Whether regain routinely carries someone past their starting point is a
stronger claim, and it is not asserted here.

The question a plan should be able to answer: what does this look like once the target is reached?

### R2 — Never recommend extreme restriction without appropriate justification

Reproduced verbatim from the source:

> recommend extreme restriction without appropriate justification

Eliminating whole food groups narrows nutrient intake ([Standard 36](36-micronutrient-adequacy.md))
and is hard to sustain, so it requires a reason proportionate to the cost — an allergy, a diagnosed
condition, a clinical protocol, an established intolerance, or a considered ethical or religious
commitment the person holds themselves.

What is not a proportionate justification: that it produces faster results, that it simplifies
tracking, or that a food group has been assigned a reputation
([Standard 37](37-dietary-quality.md) R1, and
[`nutrition.no-single-food-disease-claims`](14-evidence-quality.md)).

Restriction adopted without a proportionate reason tends to persist past any benefit and to expand.

Rule [`nutrition.no-unjustified-extreme-restriction`](../PROHIBITIONS.md).

### R3 — What makes an approach sustainable

Sustainability is not willpower. The properties that predict it:

- **Fits the person's life** — schedule, budget, cooking capacity, household, work pattern.
- **Includes foods they like** — enjoyment is a functional requirement
  ([Standard 37](37-dietary-quality.md) R4), not a concession.
- **Tolerates imperfection** — an approach that fails on a missed day is one that will fail.
- **Survives ordinary life** — travel, restaurants, holidays, illness, and other people.
- **Requires effort proportionate to its benefit** — elaborate tracking has a maintenance cost that
  eventually exceeds what people will pay.

A plan can be assessed against these before it is started, which is considerably cheaper than
assessing it afterwards.

### R4 — Adherence is a property of the plan

Where an approach is not adhered to, the plan is the first thing to examine — the same argument
[Standard 30](30-adherence.md) R4 makes about training, and it applies more strongly here because
eating happens several times a day and is deeply entangled with everything else in a person's life.

Framing non-adherence as a personal failing is also
[`nutrition.no-food-moralizing`](../PROHIBITIONS.md) territory.

### R5 — Restriction has a psychological cost

Rigid restriction is associated with preoccupation with the restricted food and with a pattern in
which breaking the rule leads to abandoning it entirely.

Observational work associates flexible restraint with better long-run outcomes than rigid restraint.
That literature is more contested than the summary suggests, the direction of the relationship is
not settled, and more recent work has challenged the simplest versions of the claim. It is a reason
to prefer flexibility where two approaches are otherwise comparable — not an established superiority
holding independent of nutritional content.

This also bears on [Standard 37](37-dietary-quality.md) R6: rigid rules are among the features that
make guidance harmful to someone predisposed to a disordered relationship with food.

### R6 — Simplicity is worth real nutritional cost

An approach a person will follow beats a superior one they will not, and the margin is large enough
that simplicity should usually win where the two conflict. This is the nutrition domain's version of
[Standard 30](30-adherence.md) R1, and it is the requirement most often violated by plans designed to
be defensible rather than followable.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`nutrition.no-unjustified-extreme-restriction`](../PROHIBITIONS.md) | recommend extreme restriction without appropriate justification |

## Additions this standard makes beyond the source

- R1's horizon question — what this looks like after the target — which is the single most useful
  test of a plan.
- R2's enumeration of what does and does not count as proportionate justification. The source's
  prohibition turns entirely on "appropriate", and leaving that undefined would make the rule
  unusable.
- R3's properties, which make sustainability assessable in advance rather than in retrospect.
- R5's psychological cost, and R6's explicit trade of nutritional optimality for followability.

## Relationship to other standards

[Standard 33](33-sustainable-calorie-changes.md) covers the sustainable rate of change.
[Standard 36](36-micronutrient-adequacy.md) covers what restriction costs.
[Standard 37](37-dietary-quality.md) supplies R4's and R5's framing concerns.
[Standard 39](39-goal-compatibility.md) R6 and [Standard 23](23-sustainable-progression.md) R6 make
the same life-fit argument. [Standard 30](30-adherence.md) is the training counterpart throughout.
[Standard 41](41-dietary-restrictions-and-context.md) covers the restrictions a person already has,
as distinct from ones a plan imposes.

## Implementation

`nutrition.no-unjustified-extreme-restriction` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review.

No detector evaluates sustainability. Whether an approach fits a person's life is not visible in a
repository, and R3's properties are assessed against a person rather than against a file.
