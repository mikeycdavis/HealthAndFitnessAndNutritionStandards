# Changelog

Three versions travel independently and are not the same number:

| | Where | Changes when |
| --- | --- | --- |
| Framework version | `VERSION` | A standard or rule is added, changed, or retired |
| Package version | `package.json` | The tooling is released |
| Output schema version | `schemaVersion` in JSON output | The output format changes |

**Semantic versioning applied to standards.** A new requirement or prohibition is a **major** change,
because it can make a compliant project non-compliant — that is the intended behaviour rather than a
regression. A new recommendation is **minor**. Documentation, detector fixes, and clarifications that
do not change what a rule means are **patch**.

## 1.0.0-dev

The first release. Built in ten milestones, each with a gate that had to be green before the next
began.

### Added

- **42 standards.** Three foundations (the wellness/medical boundary, the trend-over-event principle,
  the four escalation tiers), twelve health, sixteen fitness, ten nutrition, and one governing the
  integrity of the standards system itself.
- **59 rules** across six categories: 34 prohibitions, 17 requirements, 7 recommendations, and 1
  invariant. `kind` is a first-class catalog field rather than a boolean flag on a requirement,
  because prohibitions are the majority here (ADR 0002).
- **`PROHIBITIONS.md`** — the prohibition index, hand-written and checked against the catalog rather
  than generated, so that it breaks loudly instead of going stale quietly.
- **The integrity invariant** (Standard 42), with `BLOCKED_BY_INVARIANT` and exit code 3. An attempt
  to waive a prohibition, lower a strength, attest past a finding, or exempt the invariant stops the
  evaluation rather than failing a rule.
- **Five CLI subcommands** — `init`, `audit`, `check`, `explain`, `status` — chosen for the loop an
  operator works in rather than copied from a list. `init`'s dry run is `plan()` without `apply()`,
  so it cannot describe something different from what apply does.
- **`NOT_EVALUATED` with exit code 4.** Insufficient evidence is a first-class outcome, and in this
  domain it is the expected first result.
- **Five guards** — the standards series inventory, the rule inventory, source fidelity, policy
  validation, and diagram freshness — each with a mutation test.
- **130 tests**, including a fire and do-not-fire pair for every detector.
- **Templates, worked examples, and fixtures**, with the fixtures built from the examples so an
  example that stopped satisfying the standards fails the build.

### Found while building

Things the guards, the tests, or dogfooding caught, kept here because a changelog that only lists
features implies the process was smoother than it was.

- **Running the tool against this repository found a design bug in the integrity screen.** It treated
  any finding bound to a not-applicable rule as a contradicted scope claim. But most findings report
  an *absence* — "no fitness plan" — which is evidence *for* a declaration that this project plans no
  training. As written, every correctly scoped project would have been reported as committing an
  integrity violation. Findings now declare `subjectExists`, and only a finding that presupposes the
  artifact exists can contradict a scope claim.
- **Writing the policy exposed a false green in the verdict logic.** With 34 prohibitions that no
  machine evaluates, a project where nothing failed would have been reported `COMPLIANT`. Nothing
  failing is not evidence that anything passed. An applicable required rule that nothing established
  now yields `NOT_EVALUATED`.
- **The use/mention trap was hit twice while writing test fixtures**, in two different detectors: a
  document that names the thing it claims is absent satisfies a substring scan. Both fixtures were
  fixed and both `$assuranceNote`s now state the limit plainly.
- **A test asserted the wrong thing.** "This repository produces no findings" was written against
  `audit`, which reads no policy and therefore reports that this repository has no fitness plan —
  true, and irrelevant. Asserting on it would have forced this repository to fabricate a training
  plan for a person who does not exist. It now asserts on `check`.
- **An anchor check disagreed with every anchor that works in a browser**, because it collapsed
  whitespace runs where GitHub replaces each space individually.

### Dogfooded

This repository carries its own `project-policy.yml` and is evaluated by its own CI.

Its status is **`NOT_EVALUATED`**, and it is left that way. Five rules apply here that only a human
can establish, and no human has reviewed them. Recording an attestation to make CI green would be the
"falsify evidence for" clause of the invariant being attested — so the honest state is reported
instead, and the CI step that runs `check` accepts exit 4 with a comment explaining why.

Two real failures surfaced during the build and were fixed rather than declared out of scope: the
README carried no wellness-scope disclosure, and `docs/escalation-tiers.md` did not exist.

### Known limitations

Stated because a limitation that is not written down reads as a claim.

- Detectors establish presence, never correctness. All 21 carry `assurance: partial` and a note.
- No rule claims `full` assurance, and the loader refuses one that would.
- Nothing evaluates a prohibition. All 34 report not-evaluated without a recorded human review.
- The allergen check of Standard 41 R2 is deliberately unbuilt: the detectors read documents, not
  runtime data, and a check that appeared to verify allergen safety without that access would be the
  most dangerous false green this system could produce.
- The guards make manipulation loud, not impossible. Anyone with commit access can edit them.
- No `.svg` renders are committed. The `.mmd` sources are canonical and the absence is declared
  (ADR 0006).
