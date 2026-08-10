# Health, Fitness, and Nutrition Standards

Forty-two numbered standards for personal health analysis, fitness planning, exercise interpretation,
and nutrition guidance — and the commands that evaluate a project against them.

> **This repository governs wellness guidance. It is not medical advice.**
>
> It publishes standards for how software and agents should produce general health, fitness, and
> nutrition information. It does not diagnose conditions, does not provide medical assessment, and is
> not a substitute for evaluation by a qualified clinician. Nothing in its worked examples describes a
> real person. The boundary this paragraph draws is itself
> [Standard 1](standards/01-wellness-vs-medical-assessment.md).

## What this is

Not a document collection. A structured, auditable, testable system for determining what must be
done, what should be done, what must never be done, when a standard applies, what evidence
demonstrates compliance, how that is verified, and when a previous decision must be revisited.

```bash
standards init .              # bootstrap a project (--dry-run first; it predicts apply exactly)
standards audit .             # gather evidence — never a verdict
standards check .             # the verdict, and the CI gate
standards explain <rule-id> . # why a rule applies here, and what would satisfy it
standards status .            # what has expired, gone stale, or is awaiting review
```

Zero third-party dependencies. Node 18 or later. There is no install step, and CI has none either —
that absence is what makes the dependency policy structural rather than aspirational.

## The one thing to understand first

**Most of these standards cannot be checked by a machine, and this repository says so rather than
pretending otherwise.**

Of 59 rules, 21 have an implemented check and every one of them establishes only that an artifact or
a section *exists*. The other 38 — including all 34 prohibitions and the integrity invariant — are
evaluated by human review, and until a review is recorded they report **not evaluated**, never
passed.

That is why a well-formed project's first result is `NOT_EVALUATED` (exit code 4) rather than
`COMPLIANT`. Nothing failed, but nothing failing is not evidence that anything passed. A detector can
establish that a document contains a section called `## Measurement Quality`; it cannot establish that
the analysis inside it is sound, and a system that reported the first as though it were the second
would produce a confident green on guidance that might be dangerous.

In this domain a false green is worse than no answer. The system is built so it can always say *we do
not have enough evidence*, and so that nothing forces it to say anything else.

## Prohibitions

Thirty-four things that must never be done, indexed in **[PROHIBITIONS.md](PROHIBITIONS.md)**.

They are first-class: a `kind` in the catalog, an index of their own, and a section in the standard
that owns each one. Never exemptible — an exception naming one stops evaluation with
`BLOCKED_BY_INVARIANT` rather than being recorded. They may be declared *not applicable*, which is a
different claim and a legitimate one, and the difference between the two is the subject of
[Standard 42](standards/42-standards-integrity.md) R3.

## The standards

**Foundations** — the boundary every other standard operates inside.

| # | Standard | Prohibitions |
| --- | --- | --- |
| 1 | [Wellness Guidance vs Medical Assessment](standards/01-wellness-vs-medical-assessment.md) | 1 |
| 2 | [Trend-over-Event Principle](standards/02-trend-over-event.md) | — |
| 3 | [Safety and Escalation Tiers](standards/03-safety-and-escalation-tiers.md) | 1 |

**Health** — interpreting a person's measurements.

| # | Standard | Prohibitions |
| --- | --- | --- |
| 4 | [Symptom Context](standards/04-symptom-context.md) | — |
| 5 | [Physiological Measurements](standards/05-physiological-measurements.md) | 1 |
| 6 | [Measurement Quality](standards/06-measurement-quality.md) | 2 |
| 7 | [Individual Baseline](standards/07-individual-baseline.md) | 1 |
| 8 | [Trends](standards/08-trends.md) | 1 |
| 9 | [Medications Where Relevant](standards/09-medications-where-relevant.md) | 1 |
| 10 | [Known Contextual Factors](standards/10-known-contextual-factors.md) | shares 9's |
| 11 | [Uncertainty](standards/11-uncertainty.md) | 1 |
| 12 | [Red Flags](standards/12-red-flags.md) | 2 |
| 13 | [Appropriate Escalation](standards/13-appropriate-escalation.md) | — |
| 14 | [Evidence Quality](standards/14-evidence-quality.md) | 2 |
| 15 | [Limits of Interpretation](standards/15-limits-of-interpretation.md) | 1 |

**Fitness** — planning and interpreting training.

| # | Standard | Prohibitions |
| --- | --- | --- |
| 16 | [Goals](standards/16-goals.md) | — |
| 17 | [Baseline Fitness](standards/17-baseline-fitness.md) | 1 |
| 18 | [Progressive Overload](standards/18-progressive-overload.md) | 1 |
| 19 | [Exercise Intensity](standards/19-exercise-intensity.md) | 3 |
| 20 | [Recovery](standards/20-recovery.md) | 1 |
| 21 | [Rest](standards/21-rest.md) | shares 30's |
| 22 | [Training Volume](standards/22-training-volume.md) | 1 |
| 23 | [Sustainable Progression](standards/23-sustainable-progression.md) | 1 |
| 24 | [Pain/Injury Signals](standards/24-pain-injury-signals.md) | 1 |
| 25 | [Cardiovascular Conditioning](standards/25-cardiovascular-conditioning.md) | — |
| 26 | [Strength](standards/26-strength.md) | — |
| 27 | [Mobility Where Relevant](standards/27-mobility-where-relevant.md) | — |
| 28 | [Sleep](standards/28-sleep.md) | — |
| 29 | [Hydration (Fitness)](standards/29-hydration-fitness.md) | — |
| 30 | [Adherence](standards/30-adherence.md) | 1 |
| 31 | [Trend-Based Progress](standards/31-trend-based-progress.md) | 1 |

**Nutrition** — planning and evaluating diet.

| # | Standard | Prohibitions |
| --- | --- | --- |
| 32 | [Energy Balance](standards/32-energy-balance.md) | 2 |
| 33 | [Sustainable Calorie Changes](standards/33-sustainable-calorie-changes.md) | 3 |
| 34 | [Protein](standards/34-protein.md) | — |
| 35 | [Fiber](standards/35-fiber.md) | — |
| 36 | [Micronutrient Adequacy](standards/36-micronutrient-adequacy.md) | 1 |
| 37 | [Dietary Quality](standards/37-dietary-quality.md) | 1 |
| 38 | [Hydration (Nutrition)](standards/38-hydration-nutrition.md) | — |
| 39 | [Goal Compatibility](standards/39-goal-compatibility.md) | — |
| 40 | [Sustainability](standards/40-sustainability.md) | 1 |
| 41 | [Dietary Restrictions/Context Where Known](standards/41-dietary-restrictions-and-context.md) | 1 |

**The standards system itself.**

| # | Standard | |
| --- | --- | --- |
| 42 | [Standards Integrity](standards/42-standards-integrity.md) | the invariant |

Eleven standards carry no rule of their own. Each says so in its own Implementation section, with the
reason, so that a reader checking coverage does not have to guess whether it is an omission.

## Mechanically verifiable versus judgment-based

The original specification asks for this distinction to be identified clearly. It is encoded in two
orthogonal catalog fields — `validationType` (what kind of check the rule calls for) and `assurance`
(what the current implementation can actually establish) — rather than asserted in prose.

| | Rules | What a check establishes |
| --- | --- | --- |
| **Machine-evaluated** | 21 | That an artifact or section exists and is non-empty. Never that its content is correct. All carry `assurance: partial` and an explicit note saying what they cannot claim. |
| **Judgment-based** | 38 | Nothing mechanical. Includes all 34 prohibitions and the integrity invariant. Satisfied only by recorded human review; otherwise not evaluated. |

**No rule in this release claims `full` assurance**, and the catalog loader refuses to load one that
claims it while being human-evaluated.

## Verdicts and exit codes

| Verdict | Exit | Means |
| --- | --- | --- |
| `COMPLIANT` | 0 | Every applicable *obligation* was established and passed, and the integrity screen detected nothing. See the caveat below — this is narrower than "every applicable rule" |
| `COMPLIANT_WITH_EXCEPTIONS` | 0 | As above, with approved time-bounded waivers |
| `NON_COMPLIANT` | 1 | Evaluated, and something that applies is failing |
| — | 2 | Configuration or schema error, including no policy |
| `BLOCKED_BY_INVARIANT` | 3 | The evaluation itself was manipulated. Report it; do not fix the rules it names |
| `NOT_EVALUATED` | 4 | Insufficient evidence to reach a verdict |

**4 is not a worse 0.** Mapping it to 0 would let a project that evaluated nothing pass a gate;
mapping it to 1 would call a project non-compliant when nothing is known to be wrong with it.

**`COMPLIANT` is narrower than it sounds, and the gap is a recommendation.** Only rules that can
block — requirements at required strength, prohibitions, the invariant — must be established for the
verdict. An applicable **recommendation** with no evidence stays `not-evaluated`, reports as a
warning, enters neither the score's numerator nor its denominator, and does not stop the verdict
reaching `COMPLIANT`. So the word means:

> every applicable obligation capable of blocking compliance has been satisfactorily established,
> with recommendations reported separately

and not *every applicable rule has been established*. This repository is its own example: a
`COMPLIANT` verdict here would be reached with `health.evidence-quality-noted` — applicable, and a
recommendation — carrying no evidence at all. Read the per-rule counts beside the verdict, not the
word alone.

The integrity invariant has a state of its own, **`screened`** — every bound integrity check ran and
none fired. It is not a pass: absence of detected manipulation is weak evidence, whereas detected
manipulation is decisive and stops the run at exit 3. It is reported beside the verdict rather than
inside it, so `COMPLIANT` never quietly stands in for "and Standard 42 is satisfied"
([ADR 0007](artifacts/adr/0007-screened-as-a-distinct-invariant-state.md)).

## Layout

```text
standards/           42 numbered standards
rules/               the rule catalog, one JSON file per category
schemas/             project-policy.schema.json
scripts/             the CLI and the guard scripts
templates/           what an adopting project copies
docs/                architecture, the escalation tiers, worked examples
test/                node:test suites and fixture repositories
artifacts/prompts/   the two source documents, verbatim
artifacts/adr/       six architecture decision records
artifacts/*.json     two human-reviewed inventories — the tamper evidence
PROHIBITIONS.md      the first-class prohibition index
project-policy.yml   this repository's own policy, dogfooded
```

## Adopting these standards

Start with **[INSTRUCTIONS.md](INSTRUCTIONS.md)**.

Do not copy the standards documents into your repository. Reference the version in your
`project-policy.yml` and keep only project-specific declarations locally. A copied standard is a
second definition that drifts silently, and the drift surfaces when two projects disagree about what
a rule means.

## Decisions

| | |
| --- | --- |
| [0001](artifacts/adr/0001-canonical-rule-identity.md) | Canonical rule identity, fixed before any rule existed |
| [0002](artifacts/adr/0002-prohibitions-are-a-first-class-rule-kind.md) | Prohibitions are a first-class rule kind |
| [0003](artifacts/adr/0003-integrity-invariant-and-its-tamper-evidence.md) | The integrity invariant, and how it is protected |
| [0004](artifacts/adr/0004-derived-numbered-spec.md) | A derived numbered specification, sources preserved |
| [0005](artifacts/adr/0005-audit-and-check-are-separate-commands.md) | `audit` and `check` are separate commands |
| [0006](artifacts/adr/0006-mermaid-is-the-canonical-diagram-source.md) | Mermaid is the canonical diagram source |

The design record is [`docs/design/architecture.md`](docs/design/architecture.md), which includes the
analysis of which policy-as-code concepts this domain needed and which it did not.

## Independence

This repository is standalone and depends on no other standards repository. Two low-level utilities —
a strict YAML subset parser and a JSON Schema subset evaluator — were adopted once as source and are
maintained here. Nothing resolves against another repository at runtime, and nothing cites one as an
authority.

## Versioning

Three versions travel independently: the framework version in `VERSION`, the package version, and the
`schemaVersion` of the JSON output. A new requirement or prohibition is a major change; a new
recommendation is minor; documentation and detector fixes are patch. See
[CHANGELOG.md](CHANGELOG.md).

Standards are named `NN-<kebab-title>.md`, zero-padded, contiguous from 1, with no gaps —
mechanically enforced, because a series with a hole in it is how "did I cover everything" becomes a
memory exercise.
