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

### Found during release certification

The release review found two things by running `standards status` and reading the output rather than
trusting the prose. Both are the reason a release review exists.

- **`COMPLIANT` was unreachable by any project, forever.** Four individually correct decisions — the
  integrity invariant applies to everyone, is human-evaluated, is never attestable, and any
  applicable required rule that nothing established yields `NOT_EVALUATED` — composed into an
  impossible state. Verified against the most favourable possible policy. No test caught it because
  every test asserted behaviour that was locally correct; it was reachable only by asking whether the
  system can emit a verdict it defines. Fixed by [ADR 0007](artifacts/adr/0007-screened-as-a-distinct-invariant-state.md)'s
  `screened` state, and a regression test now asks that question.
- **A hand-maintained count had drifted.** `PROJECT.md`, `CHANGELOG.md`, and the CI comment each said
  four rules awaited human review while the tool reported five —
  `nutrition.no-single-food-disease-claims` had been made applicable and the prose never updated.
  Nothing compared the two. A test now does, and it caught the prose being wrong a second time when
  ADR 0007 moved the invariant out of that set and the count became four again. Derived operational
  state now comes from `standards status`, not from a copy in prose.

### Found by independent content review

`health.no-fabricated-medical-facts` applies to this repository, because every standard and every
rule rationale here makes claims about physiology. An independent reviewer — who did not write the
prose — read all 191 extracted claims against external evidence and returned **DEFECTIVE**.

No invented physiology was found. Every defect was a real finding stated past its evidence, which is
precisely the failure [Standard 14](standards/14-evidence-quality.md) R2 names as the most common
one. It was written that way by an author who had read R2 while writing it, which is the argument for
external review rather than for a longer checklist.

Six blocking findings and eight wording issues were remediated in
[pack 03b](artifacts/release-review/03b-remediation-diff.md). The load-bearing ones:

- **A precise number that was not universal.** Age-predicted maximum heart rate was given "an
  individual error of roughly ±10–12 beats per minute". The figure is real, but it varies with the
  equation and the population and no equation or population was named. Now stated qualitatively, with
  the operational conclusion — that zones drawn from a prediction are not precise thresholds —
  preserved.
- **A table that read as a diagnostic instrument.** Standard 24's discomfort-versus-injury table had
  a column headed *Injury pain*, which turned a list of reasons to stop into a differential. It is
  now framed around the behavioural decision, and the claim that "sharp pain signals that something
  is being damaged" is gone: pain and tissue damage do not correspond one-to-one, and the rule never
  needed them to.
- **A rationale that silently strengthened its standard.** Standard 37 said shame is "a documented
  component of disordered eating **patterns**"; the JSON rationale dropped the qualifier. Both are
  now one sentence, at association strength, pinned by `test/claim-strength.test.mjs` with a mutation
  test that reintroduces the exact drift. The rationale fields had been flagged in advance as the
  least-scrutinised surface in the repository, and this is the evidence that the flag was right.
- **Findings generalised past their population.** The low-intensity training distribution is
  supported for trained endurance athletes and was stated for "most people and most goals"; it is now
  scoped, with the wider application labelled a practical default rather than an established finding.

The rule was not weakened, the evaluator was not touched, no numeric target was introduced to make
the standards appear better-evidenced, and `check` still exits 4. The repository failed its own
release criterion and nobody changed the criterion.

### Dogfooded

This repository carries its own `project-policy.yml` and is evaluated by its own CI.

Its status is **`NOT_EVALUATED`**, and it is left that way. Four rules apply here that only a human
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
