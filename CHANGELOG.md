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

## 1.0.0

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
- **160 tests**, including a fire and do-not-fire pair for every detector.
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

### The tier-four record under-escalated

The second independent review, of `escalation.tier-language-calibrated`, returned **DEFECTIVE** on
the highest-consequence document in this repository.

`docs/examples/interpretation-potentially-urgent.md` handles new exertional chest discomfort with
disproportionate breathlessness. It said *"Please arrange it today"*, and reserved emergency services
for the symptom recurring at rest or acquiring further features. [Standard 3](standards/03-safety-and-escalation-tiers.md)
R1 defines tier four as asking the reader to seek evaluation **now** rather than at the next
convenient time. "Today" is weaker than now, so the record failed the tier definition it was written
to illustrate.

The mechanism is the part worth recording. R4 says escalation language must not create alarmism. The
record removed the alarm correctly and removed some of the temporal urgency along with it, because
**nothing in the standard distinguished tone from timeframe.** The reviewer's formulation is the
distinction that was missing: *calm is constant across the tiers; urgency is not.* That now sits in
R4 itself, in `docs/escalation-tiers.md`, and in the example's own note, so an adopting project
imitating this repository inherits the correction rather than the defect.

The record now directs emergency services immediately and unconditionally, keeps its calm register,
and places its reassurance after the instruction rather than in a closing footnote — reassurance
ahead of an instruction competes with it. A second correction decoupled tier two's professional
contact from the completion of a one-to-two-week measurement series.

**No test was added, and none could be.** The tier detector checks that exactly one canonical label
appears in a record. The label here was always correct — *potentially urgent*. The entire defect was
in what the record then told the reader to do. That is what `assurance: none` means on this rule, and
it is the clearest demonstration in this repository of why a mechanical green would have been worse
than no check at all.

Before and after: [pack 01b](artifacts/release-review/01b-remediation-diff.md).

### Dogfooded

This repository carries its own `project-policy.yml` and is evaluated by its own CI.

Its status is **`COMPLIANT`**. It reported `NOT_EVALUATED` for most of this repository's life, because
four of its rules can only be established by a human and none had been; recording an attestation to
make CI green would have been the "falsify evidence for" clause of the invariant being attested. The
four attestations now recorded were decided by a named reviewer, not manufactured to reach a verdict.
The CI step that runs `check` accepted exit 4 for most of that time, with the reason written into the
workflow rather than hidden in a flag. That allowance was removed as part of the 1.0.0 release
mechanics; the gate is now `npm run check` and nothing else.

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
- `health.evidence-quality-noted` — a recommendation — applies here and has no evidence. Because it
  is a recommendation it does not force `NOT_EVALUATED` and does not enter the score, so this
  repository's `COMPLIANT` verdict is reached with one applicable rule carrying no evidence at all.
  Designed behaviour, disclosed rather than left to be discovered.
- Deferred work is in [BACKLOG.md](BACKLOG.md) with the reason for each deferral, so that a decision
  not to do something is distinguishable later from having forgotten it.

### Independent review completed

All four human-review rules carry an independent content-review disposition — **all four
ESTABLISHABLE**, two of them only after real defects were found and remediated. Recorded with their
evidence chains in [artifacts/release-review/dispositions.md](artifacts/release-review/dispositions.md).

A disposition is not an attestation. None carries a human `reviewedBy` identity, and the decision to
record an attestation belonged to a human reviewer and to nobody else. That decision was made
separately, and is recorded below.

A dry run in a scratch copy — deleted afterwards, the repository's own policy untouched — established
the release condition the reviewer set: with exactly those four attestations and nothing else
changed, `check` reports `COMPLIANT` at exit 0, the integrity invariant reports `screened` rather
than passed or attested, and every mechanical gate stays green. The full output is in the
dispositions record.

### An attestation was recorded and withdrawn

Four attestations were recorded at `ad6bdcb` and withdrawn in the commit immediately after. The
repository was `COMPLIANT` at exit 0 in between, and returned to `NOT_EVALUATED` at exit 4 — where it
stayed until the valid attestations recorded below.

Nothing about the content was wrong. The dispositions were sound, the per-rule states matched the
prediction frozen before any attestation existed — exactly four rules attested, the invariant
`screened`, `health.evidence-quality-noted` still not-evaluated — and all five guards and the whole
suite stayed green.

**The defect was provenance.** The `reviewedBy` identity was written on the authority of a draft
supplied by the reviewing agent, which cannot confer human authority on anything. The record
therefore asserted a human judgement whose author could not be established. The correction was
applied to the input: the attestations were withdrawn, and no disposition, standard, or line of
evaluator was changed in either direction.

**Why it is worth a changelog entry rather than a quiet revert.** This is the demonstration that
matching the predicted per-rule states is not sufficient. Every mechanical gate was green and the
verdict was exactly the one predicted, and it was still wrong — because provenance is not a property
any gate can read. The full account, including the withdrawn text preserved unedited, is in
[artifacts/release-review/attestation-2026-08-11.md](artifacts/release-review/attestation-2026-08-11.md).

### The four attestations were then recorded validly

The reviewer stated the four decisions themselves. All four **approved**, recorded under their own
identity on 2026-08-11, each with a `reviewedAgainst` digest fixing exactly the material read — so an
edit to any of those files returns the rule to not-evaluated rather than leaving an approval standing
over text nobody reviewed.

Two of the four approve **remediated** material rather than the versions first reviewed: the tier
corpus and the medical-claims corpus each returned `DEFECTIVE` on first review, and both were fixed in
the content. Neither rule, nor the evaluator, nor the policy's strengths were touched to obtain a
disposition.

The verdict moved to `COMPLIANT` at exit 0 — the same verdict `ad6bdcb` reached and was refused. What
changed is not the machinery and not the content. It is that the identity in `reviewedBy` is the
person who made the decision, because they made it.

### The certification pass found a defect the diff could not

An independent certification pass ran from the immutable baseline `7f59f8b` against candidate
`eb9a0f8`. It stopped before comparing per-rule states, on a defect in `.github/workflows/ci.yml`.

The comment above the release gate said this repository was `NOT_EVALUATED`, and said the exit-4
allowance could never be removed by recording reviews, because the integrity invariant permanently
prevents any project from reaching `COMPLIANT`. The second claim stopped being true at ADR 0007,
whose entire purpose was to make `COMPLIANT` reachable via `screened`. It sat directly above the line
the release mechanics exist to remove, and it said not to remove it.

**It was not findable by diffing.** The workflow had not changed since the baseline. It was found by
reading the surface an operator acts on and asking whether it was *true*, rather than whether it had
*moved*. Corrected at `9809afc`, comments only, gate line byte-identical. The limit it exposes is now
written into the certification procedure itself: diff-first protects against unexamined change; it
cannot establish that unchanged baseline content was ever correct.

### 1.0.0 release mechanics

Certification passed against `9809afc`. The mechanics then ran as a separate change, which is the
distinction this repository has kept throughout: authorization to perform release mechanics is not
evidence that they succeeded.

- `VERSION`, `package.json`, and the policy's `standardVersion` move from `1.0.0-dev` to `1.0.0`.
- CI's `|| [ $? -eq 4 ]` allowance and its transitional comment are removed. The gate is now
  `npm run check`, and exit codes 1, 2, 3, and 4 all fail the build.
- Derived surfaces updated: this file, `PROJECT.md`, the release-review ledger, and the backlog.

**No tag is cut here.** GitHub Actions cannot currently execute — the account's Actions billing or
spending limit blocks every run before a runner is acquired, so the workflow reports failure having
run zero steps. That is infrastructure not executed, not evidence about this repository. Because CI is
treated here as an enforcement surface rather than a formality, `v1.0.0` waits for an actual green
Actions run on the release commit.
