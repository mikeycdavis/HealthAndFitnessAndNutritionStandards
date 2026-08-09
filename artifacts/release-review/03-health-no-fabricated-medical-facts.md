# Evidence pack 03 — `health.no-fabricated-medical-facts`

**The rule.** *Never fabricate medical facts* (Standard 14 R2, source-verbatim).

**Why it applies here.** This repository holds no patient data and interprets nobody's measurements,
but it makes factual claims about physiology throughout — in standards prose and in the `rationale`
field of every catalog entry. Those claims are the subject.

**What the reviewer must decide.** Whether each claim is supportable, or is invented, overstated, or
presented with more authority than the evidence carries. Note that the most common form of this
failure is not invention: it is a real finding stated more strongly than its evidence, generalised
past the population it was found in, or given a precision it never had (Standard 14 R2).

---

## Scope of the material

| Location | Volume |
| --- | --- |
| `standards/04-…` through `standards/15-…` (health) | ~10,300 words |
| `rules/health.json` + `rules/nutrition.json` rationales | ~1,650 words |
| `standards/17`, `20`, `24`, `25`, `26`, `27`, `28`, `29` (physiological claims in fitness) | see §4 |

An automated pass over the health and nutrition standards identifies **73 sentences carrying
empirical assertions** (numeric quantities, comparatives, mechanisms, or prevalence claims). Those are
grouped below by what kind of check each needs.

---

## 1. Numeric claims — the ones with the least room to hide

These are the claims a reader could check against a literature value, and where being wrong is
unambiguous.

| Claim | Location | Implementer's note |
| --- | --- | --- |
| Age-predicted maximum heart rate carries "an individual error of roughly ±10–12 beats per minute, which is wider than the zones drawn from it" | `standards/17-baseline-fitness.md` R3 | **The most precise numeric claim in the repository.** Commonly cited standard deviations for the 220−age formula sit in this range, but the number varies by the equation and population studied. Flagged in §5. |
| A resting heart rate of 48 is "unremarkable for the endurance-trained person"; 68 is "a rise of roughly 30%" from a baseline of 52 | `standards/07-individual-baseline.md` R1, `docs/examples/interpretation-worth-discussing.md` | Arithmetic, and an illustrative case. Low risk. |
| "population reference range of roughly 60–100 bpm" | `docs/examples/interpretation-normal-variation.md` | Conventional. |
| Body weight "moves by more in a day … than a week of actual fat change amounts to" | `standards/02-trend-over-event.md` R3, `standards/32-energy-balance.md` R4 | Directionally well supported; stated qualitatively rather than with a figure, deliberately. |

**No gram-per-kilogram protein figures, no fibre targets, and no calorie thresholds are published
anywhere in the repository.** Standards 34, 35, and 36 each state explicitly that they withhold
numeric targets because such figures vary by population and guideline body and would be read as
authoritative. A reviewer should confirm that abstention held — it is the single biggest deliberate
constraint on this class of claim.

## 2. Measurement-accuracy claims

`standards/06-measurement-quality.md` R3 carries a table of what consumer devices actually measure
versus infer. Reproduced in full:

| Reported as | Repository claims it actually is |
| --- | --- |
| Sleep stages | "Inferred from movement and heart rate; agreement with polysomnography is moderate at best" |
| Blood oxygen | "Optically estimated; sensitive to contact, motion, skin tone, and perfusion" |
| Calorie burn | "Modelled from movement and heart rate; error is routinely large" |
| Stress or readiness scores | "Proprietary composites, usually undocumented" |
| Body composition by impedance | "Sensitive to hydration, and moves with it rather than with fat" |

Related, `standards/28-sleep.md` R3: "Total sleep duration is measured considerably better than its
composition."

**What to check:** whether "moderate at best" is a fair summary of a varied literature, and whether
the skin-tone sensitivity of pulse oximetry is stated at the right strength — it is a documented and
clinically consequential effect, and understating it would be a different failure from overstating it.

## 3. Pharmacological claims

`standards/09-medications-where-relevant.md` R1 lists medication classes and their effects on
measurements. The standard prefaces the list with "stated as illustration rather than as a reference
table" and adds "A project need not encode pharmacology to satisfy this standard."

Claims made: beta blockers lower heart rate and blunt its exertional response; diuretics and
antihypertensives move blood pressure and fluid balance, and fluid balance moves body weight;
corticosteroids affect glucose, fluid retention, and sleep; stimulants including prescribed ones raise
resting heart rate; thyroid medication shifts heart rate, temperature, and weight; antidepressants and
antihistamines affect sleep architecture.

**What to check:** these are the claims most likely to be read as clinical reference despite the
disclaimer. Are they individually correct, and is the framing sufficient to stop them being used as
one?

## 4. Physiological mechanism claims in the fitness standards

- Adaptation occurs during recovery, not during the session (`18` R1).
- Delayed-onset soreness tracks novelty and eccentric load, not adaptation, and fades as training
  status improves (`20` R3).
- Connective tissue adapts more slowly than the cardiovascular and muscular systems (`22` R4,
  `25` R5, `26` R4).
- Inadequate sleep reduces recovery, impairs performance, raises perceived exertion at a given
  workload, and affects appetite regulation (`28` R1).
- Exercise-associated hyponatraemia is uncommon but serious, and has been made more likely by advice
  to drink as much as possible (`29` R2).
- Resistance training supports bone density, muscle mass retention with age, and tendon tolerance;
  with adequate protein it preserves lean mass in a deficit (`26` R5).
- Prolonged static stretching immediately before maximal-force work can transiently reduce force
  production — stated with "The effect is modest and its practical relevance depends on the goal"
  (`27` R4).
- Several widely-repeated claims for stretching (injury prevention generally, soreness prevention,
  posture correction) are "substantially weaker than their confident presentation suggests"
  (`27` R2).

## 5. Where the implementer's confidence is thinnest

Examine these hardest.

1. **`standards/17-baseline-fitness.md` R3 — the ±10–12 bpm figure.** The most precise numeric claim
   in the repository, and the one most exposed to being wrong in a checkable way. Consider whether it
   should be qualitative ("an individual error wide enough to exceed the zones drawn from it").

2. **`standards/24-pain-injury-signals.md` R1 — the discomfort-versus-injury table.** Six rows
   distinguishing training discomfort from injury pain by quality, location, timing, course, effect
   on movement, and accompanying signs. Clinically conventional, and the highest-consequence content
   in the repository if any row is wrong or if the table format implies more diagnostic authority than
   general wellness guidance should carry. The standard says "No single row is decisive" — is that
   sufficient?

3. **`standards/25-cardiovascular-conditioning.md` R2 — the intensity distribution.** "For most
   people and most goals, the majority of cardiovascular volume belongs at genuinely easy intensity."
   Well supported for trained endurance athletes; the generalisation to "most people and most goals"
   is an extrapolation the evidence supports less strongly than the sentence implies.

4. **`standards/06-measurement-quality.md` R3 — "moderate at best".** A one-phrase summary of a
   literature with real variation between devices and populations.

5. **The `rationale` field of all 36 health and nutrition rules.** These are prose that a reader will
   treat as authoritative, and they were written to explain rather than to be cited. They receive less
   scrutiny than standards text because they sit in JSON.

## 6. What the repository already does to bound this class of claim

Relevant to the disposition, and worth weighing rather than taking on trust:

- No numeric clinical targets are published (Standards 34, 35, 36 state the abstention explicitly).
- `standards/12-red-flags.md` deliberately does not enumerate specific red-flag presentations,
  stating that doing so "would produce a clinical triage list, which is outside what this series is
  competent to publish".
- `standards/14-evidence-quality.md` R1 supplies a hierarchy of support and what each level licenses;
  R5 warns against the opposite failure of reporting absence of evidence as evidence of absence.
- Every worked example is labelled fictional.
- `health.evidence-quality-noted` (a recommendation, also unattested) asks that claims carry an
  indication of their support. A reviewer may reasonably find that the repository asks this of
  adopters more rigorously than it practises it — that finding would be a content defect to fix,
  not a reason to withhold this rule.

## 7. Disposition

```text
Rule:        health.no-fabricated-medical-facts
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (per-claim, citing standard and requirement)
```

If **defective**, the fix is to the claim — reword, qualify, or remove it — followed by a re-run of
the full gate. Not to the rule, and not to the evaluator.
