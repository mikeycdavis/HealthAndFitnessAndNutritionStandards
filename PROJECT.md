# HealthAndFitnessAndNutritionStandards

## Purpose

Publishes 42 numbered standards for personal health analysis, fitness planning, exercise
interpretation, and nutrition guidance, together with the commands that evaluate an adopting project
against them.

## Scope

This repository provides general wellness standards and the tooling to evaluate against them. It does
not diagnose conditions, does not provide medical assessment, and is not a substitute for evaluation
by a qualified clinician. Nothing in its worked examples describes a real person.

It holds no personal health data, interprets nobody's measurements, and delivers no guidance to any
reader about their own health, training, or diet. That is the basis of every not-applicable
declaration in [`project-policy.yml`](project-policy.yml).

It does make claims about physiology and nutrition, in standards prose and in the rationale of every
catalog entry — so the evidence-quality rules apply here in full and are declared applicable.

## Standards

This repository is evaluated against its own standards, version `1.0.0`, declared in
[`project-policy.yml`](project-policy.yml).

Its current status is **`COMPLIANT`**. No rules apply here that are still awaiting evidence: the four
that no machine can evaluate — `escalation.tier-language-calibrated`, `trend.trends-over-events`,
`health.no-fabricated-medical-facts`, and `nutrition.no-single-food-disease-claims` — now carry
attestations recorded by a named human reviewer on 2026-08-11, each fixed to the material reviewed by
a content digest. Two of them approve remediated material: the first review of the tier corpus and of
the medical-claims corpus each returned `DEFECTIVE`, and the defects were fixed in the content rather
than in the rule that found them.

`health.evidence-quality-noted` applies here and still has no evidence. It is a recommendation, so it
neither forces `NOT_EVALUATED` nor enters the score — which means this `COMPLIANT` verdict is reached
with one applicable rule unestablished. Designed behaviour, disclosed here rather than left to be
discovered.

**This status was `COMPLIANT` once before, briefly and wrongly.** Four attestations were recorded at
`ad6bdcb` and withdrawn at `7b650f2`: the content was sound and the per-rule states matched the frozen
prediction exactly, but the `reviewedBy` identity was written on the authority of a draft rather than
of the person named. Every gate stayed green throughout, because provenance is not a property any of
them can read. The current attestations differ from the withdrawn ones in the one respect that
mattered — the reviewer stated the decision. See
[`artifacts/release-review/attestation-2026-08-11.md`](artifacts/release-review/attestation-2026-08-11.md).

The integrity invariant itself reports **`screened`**: all nine bound integrity checks executed and
none detected a violation (ADR 0007). Screened is not passed — absence of detected manipulation is
weak evidence, whereas detected manipulation is decisive and would stop the run with exit 3.

Run `standards status .` for the current list; do not maintain a copy of it by hand. This paragraph
has been wrong twice — once saying "four" when the tool said five, then "five" when the fix made it
four again — which is exactly why `test/instructions.test.mjs` now asserts it against the tool's
own output rather than trusting the prose.

## Stack

Node 18 or later. ESM, `node:` builtins only, **zero third-party dependencies**. Tests use
`node:test`. There is no install step here or in CI, which is what makes the dependency policy
structural rather than aspirational.

## Commands

```bash
npm run inventory   # has the standards series changed shape?
npm run rules       # has a rule been dropped, downgraded, or reclassified?
npm run fidelity    # is quoted source text still the source's?
npm run policy      # is this repository's own policy well-formed?
npm run diagrams    # does each embedded diagram match its Mermaid source?
npm test            # 160 tests, including a mutation test per guard
npm run audit       # evidence, not a verdict
npm run check       # the verdict; the CI gate
```

CI runs them in that order. `check` is the gate, and since the 1.0.0 release mechanics it accepts
only exit 0 — the transitional `|| [ $? -eq 4 ]` allowance is gone.

## Architectural rules

- **The catalog defines rule identity. The policy defines applicability. The evaluator produces
  evidence. None of the three may redefine the others** — enforced by `assertBindings`.
- **A skip never counts as a pass.** A rule nothing evaluated reports not-evaluated.
- **No rule claims `full` assurance.** A `manual-review` rule claiming it fails to load.
- **Prohibitions and the invariant are never exemptible**, and the invariant is additionally never
  attestable and never not-applicable — all enforced in code, not by convention.
- **The two reviewed inventories are never regenerated from a run.** That property is the whole of
  their value.

## Where things live

| | |
| --- | --- |
| `standards/` | The 42 standards |
| `rules/` | The catalog, one JSON file per category |
| `scripts/` | The CLI and the five guards |
| `templates/` | What an adopting project copies |
| `docs/design/architecture.md` | The design record, including the concept analysis |
| `docs/examples/` | Worked examples, reused as test fixtures |
| `artifacts/prompts/` | The two source documents, verbatim and never edited |
| `artifacts/adr/` | Six architecture decision records |
| `artifacts/*-inventory.json` | The two human-reviewed enumerations |
| `PROHIBITIONS.md` | The prohibition index — checked, not generated |

## Current state

**Complete for 1.0.0.** All 42 standards written, 59 rules catalogued, the CLI implemented with
five subcommands, 160 tests passing, all guards green.

**Known gaps**, stated rather than left to be discovered:

- No detector reads content for correctness. All 21 implemented checks establish presence only.
- Two detectors are substring scans and cannot distinguish a stated target from a passing mention.
- The allergen check of Standard 41 R2 is deliberately unbuilt — see INSTRUCTIONS.md §10.
- No `.svg` renders are committed; the `.mmd` sources are canonical and the absence is declared in
  ADR 0006.
- The version is `1.0.0`. A release version makes the inventory guard additionally require every
  standard to exist, which it does.
- Detector paths are fixed. A project using a different layout must declare the affected rules
  not-applicable rather than configure the paths.

**Resolved during release certification:** `COMPLIANT` was unreachable by any project, because the
integrity invariant is required, human-evaluated, and never attestable, so it permanently sat in the
"nothing established this" set. Fixed by ADR 0007's `screened` state. The fix was deliberately narrow:
it did not turn this repository green, which stayed at exit 4 until four human attestations were
recorded, and the invariant still reports `screened` rather than passed or attested.
