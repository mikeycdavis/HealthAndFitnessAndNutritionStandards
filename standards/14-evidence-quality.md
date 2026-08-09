# Standard 14 — Evidence Quality

Health and nutrition claims vary enormously in how well established they are, and presented at
uniform confidence they are read at uniform confidence. This standard requires that the difference is
visible, and forbids inventing the evidence.

Source: item 14 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to general claims about health, physiology, training, and nutrition — as distinct from
interpretations of a particular person's data, which are [Standard 11](11-uncertainty.md)'s subject.
It governs what a project asserts about the world.

## Requirements

### R1 — Claims carry an indication of how well established they are

A reader cannot distinguish a robust, replicated finding from a plausible mechanism unless told, and
in the absence of a signal they assume the claims are of a piece. The weakest one then borrows the
credibility of the strongest.

Roughly descending, the kinds of support a claim can have:

| Support | What it licenses |
| --- | --- |
| Consistent evidence across well-designed trials, in the relevant population | A confident general claim |
| A single trial, or trials with mixed results | A claim stated as provisional |
| Observational association | An association, explicitly not a cause |
| Mechanism or extrapolation from adjacent findings | A hypothesis, labelled as one |
| Common practice, expert opinion, tradition | Reportable as practice, not as evidence |
| Nothing identifiable | Not stated as a claim at all |

The point is not to demand citations for ordinary statements. It is that a claim doing real work in
guidance should be traceable to something better than confident writing.

### R2 — Never fabricate medical facts

Reproduced verbatim from the source:

> fabricate medical facts

A confident false medical claim is more dangerous than an admission of ignorance, because it is
acted upon. Fabrication includes inventing a reference range, a mechanism, a statistic, a guideline,
or a study — anything asserted with more authority than its actual source supports.

The most common form is not invention from nothing. It is a real finding stated more strongly than
its evidence, generalised past the population it was found in, or given a precise number it never
had.

Rule [`health.no-fabricated-medical-facts`](../PROHIBITIONS.md).

### R3 — Never claim a single food causes or cures complex disease without strong evidence

Reproduced verbatim from the source:

> claim a single food causes or cures complex disease without strong evidence

Complex diseases have many contributing causes, and single-food claims almost always outrun their
support — typically a mechanism demonstrated in vitro, or an association in an observational study
with substantial confounding.

The qualifier matters in both directions: this is not a prohibition on discussing diet and disease,
which is a real and important subject. It is a prohibition on the causal or curative claim about a
single food where the evidence does not carry it. And the cure claim is the more dangerous half,
because it can displace treatment that works.

Rule [`nutrition.no-single-food-disease-claims`](../PROHIBITIONS.md) — catalogued here, in the
evidence standard, rather than in a nutrition standard, because its operative clause is about
evidence.

### R4 — "I don't know" is a complete answer

Where the evidence does not support a claim, saying so is the correct output. This is not a failure
of the system; it is the system working, and it is the direct application of
[Standard 42](42-standards-integrity.md) R5 to subject-matter claims rather than compliance ones.

A system that cannot say "I don't know" will fabricate, because the alternative to an answer is an
answer.

### R5 — Absence of evidence is reported as absence

"No good evidence supports X" and "evidence shows X does not work" are different statements, and
collapsing them is a failure in the opposite direction from R2. Many things are unstudied rather than
disproven, and reporting the first as the second is its own overreach.

### R6 — Evidence quality is labelled where guidance is given

Rule [`health.evidence-quality-noted`](../PROHIBITIONS.md) — a recommendation — asks that substantive
claims carry an indication of their support where a reader will see it.

It is a recommendation rather than a requirement because the appropriate weight varies with context:
a passing statement in a summary does not need what a claim underpinning a recommendation does. The
prohibitions in R2 and R3 apply regardless.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-fabricated-medical-facts`](../PROHIBITIONS.md) | fabricate medical facts |
| [`nutrition.no-single-food-disease-claims`](../PROHIBITIONS.md) | claim a single food causes or cures complex disease without strong evidence |

## Additions this standard makes beyond the source

- R1's hierarchy and the "what it licenses" column, which is what makes the hierarchy usable rather
  than decorative.
- R2's observation that the common form of fabrication is overstatement rather than invention.
- R3's note that the cure claim is the more dangerous half, and the explicit statement that this is
  not a prohibition on discussing diet and disease.
- R4 and R5 in full. R5 is the addition most easily missed: overcorrecting into "X doesn't work" is
  as much an evidence failure as the claim it corrects.

## Relationship to other standards

[Standard 11](11-uncertainty.md) is the counterpart for interpretations of a particular person's
data; this standard governs general claims. [Standard 15](15-limits-of-interpretation.md) covers what
personal data can support. [Standard 37](37-dietary-quality.md) links here for food claims, and
[Standard 5](05-physiological-measurements.md)'s prohibition on fabricated measurements is this
standard's analogue for data rather than claims.
[Standard 42](42-standards-integrity.md) R5 is R4 applied to compliance conclusions.

## Implementation

`health.no-fabricated-medical-facts` and `nutrition.no-single-food-disease-claims` are both
`manual-review` at `none` assurance. Establishing that a claim is supported requires knowing the
literature, which no check in this repository does; both report not-evaluated without a recorded
human review.

`health.evidence-quality-noted` is likewise `manual-review` at `none` — a detector could look for
citation markers, but their presence establishes nothing about whether the citation supports the
claim, and a check that rewarded citation density would be actively counterproductive.

This standard applies to this repository itself. Its own policy declares
`health.no-fabricated-medical-facts`, `nutrition.no-single-food-disease-claims`, and
`health.evidence-quality-noted` applicable, because the rationale of every rule in the catalog and
the prose of every standard here makes claims about physiology and nutrition. Those three are among
the reasons this repository's own status is `NOT_EVALUATED`: no human has yet reviewed them.
