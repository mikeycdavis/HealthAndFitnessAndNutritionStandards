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

This repository is evaluated against its own standards, version `1.0.0-dev`, declared in
[`project-policy.yml`](project-policy.yml).

Its current status is **`NOT_EVALUATED`**. Five rules apply here that no machine evaluates —
`escalation.tier-language-calibrated`, `trend.trends-over-events`,
`health.no-fabricated-medical-facts`, `nutrition.no-single-food-disease-claims`, and
`integrity.no-standards-manipulation` — and no human has reviewed them. Recording an attestation
anyway would be the "falsify evidence for" clause of the very invariant being attested.

Run `standards status .` for the current list; do not maintain a copy of it by hand. An earlier
version of this paragraph said "four" and omitted `nutrition.no-single-food-disease-claims`, which is
the kind of drift a hand-maintained count produces. `test/instructions.test.mjs` now asserts this
paragraph against what the tool actually reports.

**The last of the five can never be attested**, because the integrity invariant is not attestable by
design — self-certifying one's own integrity is worth nothing. That has a consequence for the verdict
model which is recorded under Known gaps below.

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
npm test            # 130 tests, including a mutation test per guard
npm run audit       # evidence, not a verdict
npm run check       # the verdict; the CI gate
```

CI runs them in that order. `check` is the gate.

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

**Complete for 1.0.0-dev.** All 42 standards written, 59 rules catalogued, the CLI implemented with
five subcommands, 130 tests passing, all guards green.

**Known gaps**, stated rather than left to be discovered:

- No detector reads content for correctness. All 21 implemented checks establish presence only.
- Two detectors are substring scans and cannot distinguish a stated target from a passing mention.
- The allergen check of Standard 41 R2 is deliberately unbuilt — see INSTRUCTIONS.md §10.
- No `.svg` renders are committed; the `.mmd` sources are canonical and the absence is declared in
  ADR 0006.
- The version is `1.0.0-dev`. At a release version the inventory guard additionally requires every
  standard to exist, which it now does.
- **`COMPLIANT` is currently unreachable by any project, including this one.** The integrity
  invariant is required, evaluated by human review, and never attestable — so it permanently reports
  `not-evaluated`, and the verdict rule "any applicable required rule that nothing established yields
  `NOT_EVALUATED`" therefore fires for every project forever. Found during release certification, not
  yet resolved; see the release note below. This is a semantics decision rather than a bug fix,
  because either resolution changes what a verdict means.
