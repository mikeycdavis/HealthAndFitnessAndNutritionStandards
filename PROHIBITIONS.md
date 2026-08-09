# Prohibitions

The 34 things these standards say must never be done, and the one invariant that protects the
standards themselves.

This file exists because the design brief is explicit that must-never rules are first-class and
"must not be buried in documentation". It is one of three places every prohibition appears: here as
an index, in [`rules/`](rules/) as a catalog entry of `kind: "prohibition"`, and in a `## Prohibitions`
section of the standard that owns it.

**This file is hand-written and checked, not generated.** A test asserts that it lists exactly the
prohibitions the catalog contains, with matching ids and matching wording. A generated index is only
as trustworthy as the last time someone ran the generator, and a stale one looks exactly like a
current one; a checked one breaks loudly instead. See [ADR 0002](artifacts/adr/0002-prohibitions-are-a-first-class-rule-kind.md).

## What a prohibition is

| | |
| --- | --- |
| **Kind** | `prohibition` — a first-class rule type, not a flag on a requirement |
| **Severity** | Always `error`. Enforced by the catalog loader; a prohibition that reports as a warning fails to load |
| **Exceptions** | **Never.** An exception naming a prohibition does not get recorded — it stops the run with `BLOCKED_BY_INVARIANT` and exit code 3 |
| **Not applicable** | **Permitted**, with a reason and a revisit trigger. This is a different claim, and a legitimate one — see below |
| **Evaluation** | `manual-review`, `assurance: none`. Nothing mechanical establishes that guidance never gives false reassurance. Without a recorded human review, a prohibition reports **not-evaluated** — never passed |

### Not applicable is not a waiver

Prohibitions are never exemptible but may be declared not-applicable, and that is the one door left
open. What keeps it from becoming a waiver is what the reason has to establish:

```text
Exception:      "The rule applies, but we are permitted not to satisfy it."
Not applicable: "The prohibited behavior cannot occur within the evaluated scope."

For a prohibition:
  Exception                                  → never permitted
  Legitimate not-applicable                  → permitted
  False not-applicable, used as a waiver     → an integrity violation
```

A reason that says the behaviour is desired, tolerated, commercially necessary, or requested by users
is not a scope claim. Taking `nutrition.no-crash-dieting` as the example:

```text
Recipe-search application
  NOT APPLICABLE
  Reason: Application does not generate dietary plans, calorie targets,
          or weight-loss recommendations.

Weight-loss coaching application
  APPLICABLE

Weight-loss coaching application declaring
  "Not applicable because some users want rapid weight loss."
  BLOCKED_BY_INVARIANT
```

The evaluator cannot judge whether a reason is honest — that is a judgment question like the
prohibitions themselves. What it does enforce is that the reason exists, carries a revisit trigger,
is rendered in full by `standards explain`, and is contradicted when a check observes the behaviour
the declaration says cannot occur.

---

## The invariant

Standard 42 — [Standards Integrity](standards/42-standards-integrity.md)

| Rule | The rule |
| --- | --- |
| `integrity.no-standards-manipulation` | A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion. |

Never exemptible, never attestable, and never not-applicable — all three enforced in code, because
each is a way of making the invariant stop applying to the person it currently inconveniences.

---

## Health — 13

Wording below is the source specification's own, verbatim. `scripts/fidelity.mjs` checks it.

| Rule | Never | Standard |
| --- | --- | --- |
| `health.no-diagnosis-from-single-measurement` | diagnose a condition solely from one consumer measurement | [1](standards/01-wellness-vs-medical-assessment.md) |
| `health.no-single-reading-as-trend` | treat a single reading as a long-term trend | [8](standards/08-trends.md) |
| `health.no-ignored-measurement-quality` | ignore measurement quality | [6](standards/06-measurement-quality.md) |
| `health.no-fabricated-medical-facts` | fabricate medical facts | [14](standards/14-evidence-quality.md) |
| `health.no-fabricated-measurements` | fabricate health measurements | [5](standards/05-physiological-measurements.md) |
| `health.no-false-reassurance` | provide false reassurance when serious warning signs are present | [12](standards/12-red-flags.md) |
| `health.no-catastrophizing` | catastrophize ordinary measurements without supporting evidence | [3](standards/03-safety-and-escalation-tiers.md) |
| `health.no-unwarranted-certainty` | claim certainty where multiple explanations are possible | [11](standards/11-uncertainty.md) |
| `health.no-dismissing-serious-symptoms` | tell someone to ignore serious symptoms | [12](standards/12-red-flags.md) |
| `health.no-wearable-as-ground-truth` | treat wearable measurements as perfectly accurate | [6](standards/06-measurement-quality.md) |
| `health.no-causation-from-correlation` | infer causation solely from correlation in personal health data | [15](standards/15-limits-of-interpretation.md) |
| `health.no-silently-ignored-modifiers` | silently ignore medications or contextual factors known to materially affect interpretation | [9](standards/09-medications-where-relevant.md) |
| `health.no-population-average-as-baseline` | substitute generalized population averages for known individual baseline without acknowledging the difference | [7](standards/07-individual-baseline.md) |

## Fitness — 11

| Rule | Never | Standard |
| --- | --- | --- |
| `fitness.no-training-through-sharp-pain` | recommend training through sharp/significant injury pain | [24](standards/24-pain-injury-signals.md) |
| `fitness.no-load-increase-without-recovery` | increase training load indefinitely without recovery | [18](standards/18-progressive-overload.md) |
| `fitness.no-max-effort-as-superior` | treat maximum effort as inherently superior | [19](standards/19-exercise-intensity.md) |
| `fitness.no-fitness-judgment-from-one-workout` | judge fitness from one workout | [31](standards/31-trend-based-progress.md) |
| `fitness.no-heart-rate-as-complete-measure` | treat heart rate alone as a complete measure of exercise quality | [19](standards/19-exercise-intensity.md) |
| `fitness.no-intensity-without-baseline` | prescribe intensity without considering baseline/context | [17](standards/17-baseline-fitness.md) |
| `fitness.no-unsafe-progression-for-targets` | encourage unsafe progression solely to hit a target | [23](standards/23-sustainable-progression.md) |
| `fitness.no-soreness-as-effectiveness` | equate soreness with workout effectiveness | [20](standards/20-recovery.md) |
| `fitness.no-exhaustion-as-quality` | equate exhaustion with workout quality | [19](standards/19-exercise-intensity.md) |
| `fitness.no-punitive-compensation` | punish missed workouts with excessive compensatory exercise | [30](standards/30-adherence.md) |
| `fitness.no-extreme-volume-for-speed` | recommend extreme exercise volumes merely for faster results | [22](standards/22-training-volume.md) |

## Nutrition — 10

| Rule | Never | Standard |
| --- | --- | --- |
| `nutrition.no-crash-dieting` | recommend crash dieting | [33](standards/33-sustainable-calorie-changes.md) |
| `nutrition.no-starvation-approaches` | recommend starvation-level approaches | [33](standards/33-sustainable-calorie-changes.md) |
| `nutrition.no-food-moralizing` | moralize food as evidence of personal virtue/failure | [37](standards/37-dietary-quality.md) |
| `nutrition.no-single-food-disease-claims` | claim a single food causes or cures complex disease without strong evidence | [14](standards/14-evidence-quality.md) |
| `nutrition.no-unjustified-extreme-restriction` | recommend extreme restriction without appropriate justification | [40](standards/40-sustainability.md) |
| `nutrition.no-scale-change-as-fat-change` | treat short-term scale changes as equivalent to fat gain/loss | [32](standards/32-energy-balance.md) |
| `nutrition.no-adequacy-sacrifice` | ignore nutritional adequacy in pursuit of calorie reduction | [36](standards/36-micronutrient-adequacy.md) |
| `nutrition.no-fabricated-values` | fabricate calorie/macronutrient values when they are unknown | [32](standards/32-energy-balance.md) |
| `nutrition.no-exact-loss-rate-promises` | promise exact weight-loss rates | [33](standards/33-sustainable-calorie-changes.md) |
| `nutrition.no-identical-response-assumption` | assume every individual responds identically to a diet | [41](standards/41-dietary-restrictions-and-context.md) |

---

## Why these report not-evaluated

Every prohibition here is `manual-review` with `assurance: none`, so an evaluation run reports them
as **not-evaluated** unless a human review is recorded as an attestation. That is not a gap waiting
to be closed with better tooling — it is the honest position.

A detector can establish that a document contains a section called `## Measurement Quality`. It
cannot establish that the measurement-quality analysis in that section is sound, and a system that
reported the first as though it were the second would produce a confident green on guidance that
might be dangerous. In this domain a false green is worse than no answer, so the system is built to
be able to say *we do not have enough evidence to establish this* — and to keep saying it rather than
manufacturing confidence.

What the tooling does mechanically is protect the prohibitions themselves: their wording against
rewording, their existence and kind against quiet removal or downgrade, and the evaluation against
attempts to waive them. See [ADR 0003](artifacts/adr/0003-integrity-invariant-and-its-tamper-evidence.md).
