# Adopting these standards

For a project that produces health, fitness, or nutrition guidance and wants to be evaluated against
these standards.

**Do not copy the standards documents into your repository.** Reference the version in your
`project-policy.yml` and keep only project-specific declarations locally. A copied standard is a
second definition that will drift from this one, silently, and the drift is discovered only when two
projects disagree about what a rule means.

## Minimum adoption

```bash
standards init . --dry-run    # see the action list; nothing is written
standards init .              # write it
# edit project-policy.yml — declare what applies to your project and why
standards check .             # expect NOT_EVALUATED, exit 4. That is correct. See §4.
```

## 1. The two commands, and why they are two

| | Reads a policy | Produces | Use it for |
| --- | --- | --- | --- |
| `standards audit` | No | Findings | Exploring a repository, before or without adoption |
| `standards check` | Yes | A verdict | The CI gate |

A clean audit is **not** compliance. It means nothing matched the checks that are implemented, and
most rules here have no implemented check at all. Only `check` produces a verdict, and it is the only
command CI should gate on.

## 2. Exit codes

| Code | Meaning | What to do |
| --- | --- | --- |
| 0 | Compliant, possibly with approved exceptions | Proceed |
| 1 | Evaluated, and something that applies is failing | Fix the failing rule |
| 2 | Configuration or schema error, including no policy | Fix the policy or the invocation |
| 3 | `BLOCKED_BY_INVARIANT` — the evaluation was manipulated | **Report it.** Do not fix the rules it names; the inputs are not trustworthy |
| 4 | `NOT_EVALUATED` — insufficient evidence | Record human review, or accept that compliance is not established |

The 1-versus-2 split matters: 1 means the tool worked and your project has problems; 2 means the tool
could not reach a conclusion at all.

Handle 3 and 4 explicitly in CI. Treating either as a pass defeats the point of both.

## 3. Writing your policy

Four mechanisms, deliberately separate. Collapsing any two hides a real failure.

```yaml
rules:          # which rules you have considered, and at what strength
applicability:  # the rule has no subject here — the behavior CANNOT OCCUR in scope
exceptions:     # the rule applies and you knowingly do not satisfy it
attestations:   # a human reviewed it and it IS satisfied
```

A rule in none of these is **undeclared** — which means nobody looked at it, not that it was
accepted. `standards status` reports how many.

### Classifying a rule

```text
Does the rule's subject exist in this project at all?
├─ No  → applicability: not-applicable, with a reason and a revisitWhen trigger
└─ Yes → Is it satisfied?
         ├─ Yes, and a machine established it   → nothing to declare; the check passes
         ├─ Yes, and a human established it     → attestations, with evidence
         ├─ No, and you accept that             → exceptions (requirements and recommendations only)
         └─ No                                  → leave it failing. A visible failure is correct
```

### Not applicable is not a waiver

For a **prohibition** this is the only door open, so the reason carries real weight.

```text
Exception:      "The rule applies, but we are permitted not to satisfy it."
Not applicable: "The prohibited behavior cannot occur within the evaluated scope."

For a prohibition:
  Exception                              → never permitted; stops the run with exit 3
  Legitimate not-applicable              → permitted
  False not-applicable used as a waiver  → an integrity violation (Standard 42 R3)
```

Worked, with `nutrition.no-crash-dieting`:

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

Note that the third reason is *true* — some users do want that — and it is still a violation, because
the truth of the sentence is not what makes a scope claim. A reason must establish that the behaviour
**cannot occur**, not that avoiding it would be unwelcome.

`standards policy` warns when a prohibition's not-applicable reason reads as a preference. That check
is a heuristic and cannot judge honesty; what it guarantees is that the claim is written down,
carries a revisit trigger, and is contradicted when a check observes the behaviour it says cannot
occur.

## 4. Why your first result is NOT_EVALUATED

Because 34 of the 59 rules are prohibitions that no machine evaluates.

Nothing failed. But nothing failing is not evidence that anything passed, and this system will not
report `COMPLIANT` while rules that apply to you have been established by nobody. Reaching compliance
requires that a human actually reviewed the prohibitions and that the review is recorded.

This is not a limitation to be worked around. It is the design: a detector can establish that a
document has a `## Measurement Quality` section, and cannot establish that the measurement-quality
analysis is sound. Reporting the first as though it were the second would produce a confident green
on guidance that might be dangerous.

## 5. Recording a review

```yaml
attestations:
  nutrition.no-crash-dieting:
    status: approved
    reviewedBy: "name"
    reviewedAt: "2026-01-01"
    evidence: "Reviewed every rate-of-loss path in src/plans/. The generator floors the deficit at a
      sustainable rate and refuses lower targets with an explanation. Verified by the tests in
      test/plans/deficit.test.ts."
    reviewedAgainst:
      paths:
        - src/plans/deficit.ts
        - test/plans/deficit.test.ts
      digest: ""    # omit on the first pass; `standards check` prints the current digest
```

An attestation is **evidence, not a waiver**. It says the rule applies and is satisfied. It never
overrides an automated finding — an attestation contradicted by a check stops the run — and it goes
stale when the reviewed files change, returning the rule to not-evaluated.

`status: rejected` is useful: it records that a human looked and found the rule unmet, which is more
informative than an absent attestation because it says the question was asked.

**Do not record a review that did not happen.** That is the "falsify evidence for" clause of
Standard 42, and it is the failure this whole mechanism exists to make unnecessary — `NOT_EVALUATED`
is always available and is an honest answer.

## 6. What `standards status` is for

Applicability declarations, exceptions, and attestations all decay. `status` reports what has:

- expired exceptions and expired attestations;
- attestations whose reviewed files have changed since the review;
- not-applicable declarations with no revisit trigger;
- rules awaiting evidence;
- rules the policy never mentions.

Run it when project state changes — a new capability, a new data source, a new domain of guidance.
That is exactly when a scope claim stops being true.

## 7. For AI agents

Copy `templates/AGENTS.md`. The operating loop:

```text
init → explain (why does this apply?) → gather evidence → audit → check → status when state changes
```

An agent must be able to conclude compliant, non-compliant, not applicable, insufficient evidence, or
blocked by invariant — and **must never be forced to produce a positive recommendation**. Exit code 4
is a legitimate outcome and reporting it is the right behaviour.

**The stop rule.** If a task would require violating a prohibition or the invariant, stop and report.
Do not work around it. Concretely: do not write an exception against a prohibition, do not lower a
rule's strength, do not record a review that did not happen, do not declare a rule out of scope
because the behaviour is wanted rather than impossible, and do not edit a standard, test, or guard so
that an obstruction goes away.

## 8. Upgrading

Compare the version in your `standardVersion` against `VERSION` here and read the changelog. A new
requirement or prohibition is a major change and may make a compliant project non-compliant; that is
the intended behaviour, not a regression.

Rule ids are stable: a retired id is never reused, renaming a title does not change an id, and a
material semantic change gets a new id — the test being whether an existing exception would still
mean what its author intended.

## 9. What not to do

- **Do not copy the standards into your repository.** Reference the version; keep declarations local.
- **Do not waive a rule because it is inconvenient.** Leave the failure visible.
- **Do not declare a rule not-applicable to avoid satisfying it.** That is Standard 42, not a
  shortcut.
- **Do not lower a rule's strength instead of writing an exception.** Same relief, none of the
  visibility. The evaluator stops the run for this.
- **Do not treat a clean audit as compliance.** It means nothing matched the checks that exist.
- **Do not treat the score as proof.** Status is the verdict; the percentage is a summary statistic
  over the rules that were evaluated, which is not all of them.
- **Do not treat exit 4 as a pass, or exit 3 as a worse failure.** They are different instructions.
- **Do not hand-edit a generated artifact** — a rendered diagram, or anything with a source.
- **Do not record an attestation for a review that did not happen.**

## 10. Current limitations of the tooling

Stated here because a limitation that is not written down reads as a claim.

- **Detectors establish presence, never correctness.** Every one of the 21 implemented checks looks
  for an artifact or a section. None reads content for soundness.
- **Two of them are substring scans** — the escalation tier labels and the nutrition targets — and
  cannot distinguish a stated target from a passing mention. Both carry a note saying so.
- **Nothing evaluates a prohibition.** All 34 report not-evaluated without a recorded human review.
- **The allergen check does not exist.** [Standard 41](standards/41-dietary-restrictions-and-context.md)
  R2 is the one place a mechanical check would clearly be worth building, and it is deliberately not
  built: the detectors read a repository's documents, not its runtime data, and a check that appeared
  to verify allergen safety without that access would be the most dangerous false green this system
  could produce.
- **The guards protect against silent change, not against a determined editor.** Anyone with commit
  access can edit them. What the design guarantees is that doing so is a visible, reviewable change
  to a file whose stated purpose is to prevent it.
