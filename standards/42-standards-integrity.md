# Standard 42 — Standards Integrity

Every other standard in this series assumes the evaluation is honest. This one makes that assumption
a rule, and describes the mechanisms that make breaking it visible.

Source: item 42 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to everyone who maintains, adopts, or evaluates against these standards — human or AI, and
including the maintainers of this repository. It is the only standard in the series that is not about
health, fitness, or nutrition guidance. It is about the standards themselves.

## Requirements

### R1 — The invariant

Reproduced verbatim from the source:

> A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion.

The operative word is **solely**. Standards are revised, rules are reclassified, and evidence
requirements change — legitimately, when someone has learned something. What this forbids is the
change whose reason is that the standard was in the way.

The test is a question about motive, and it can be asked honestly: *would I be making this change if
it did not unblock what I am trying to do?* If the answer is no, the change is what this rule
forbids, no matter how defensible each individual step looks.

Rule [`integrity.no-standards-manipulation`](../PROHIBITIONS.md).

### R2 — The failure mode this exists to stop

It is worth naming precisely, because it does not look like misconduct while it is happening.

An agent — human or AI — is trying to reach a conclusion. A standard obstructs it. The cheapest path
is to adjust the standard, and every step of that path is individually defensible:

1. The rule "did not really apply here" → an applicability declaration.
2. The severity "was too high for this" → a strength change.
3. The finding "is a false positive" → an exception.
4. A human "did review this" → an attestation.
5. The check "was too strict" → an edit to the check.

None of these is a lie exactly, and each can be argued. Together they are the mechanism by which a
standards system stops meaning anything, and nothing in a document prevents them, because the
document is what is being edited.

### R3 — Not applicable is a claim about scope, never a waiver

This deserves its own requirement because it is the escape hatch left open by design.

Prohibitions are never exemptible ([ADR 0002](../artifacts/adr/0002-prohibitions-are-a-first-class-rule-kind.md))
but *may* be declared not-applicable, because a nutrition-only tool genuinely has no subject for a
fitness prohibition. What separates the legitimate declaration from the illegitimate one is what its
reason establishes:

```text
Exception:      "The rule applies, but we are permitted not to satisfy it."
Not applicable: "The prohibited behavior cannot occur within the evaluated scope."

For a prohibition:
  Exception                                  → never permitted
  Legitimate not-applicable                  → permitted
  False not-applicable, used as a waiver     → a violation of this standard
```

A reason asserting that the behaviour is desired, tolerated, commercially necessary, or requested by
users is not a scope claim. It is a waiver wearing a scope claim's clothing, and it falls under R1's
"reclassify" and "reinterpret".

Worked, using `nutrition.no-crash-dieting`:

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

The third case is the one this requirement exists for. Note that the stated reason is *true* — some
users do want that — and it is still a violation, because the truth of the sentence is not what makes
a scope claim.

### R4 — Manipulation stops the evaluation rather than failing a rule

An attempt to manipulate the evaluation produces `BLOCKED_BY_INVARIANT` and exit code 3, and nothing
else is evaluated.

This is deliberate and the distinction is not cosmetic. `NON_COMPLIANT` invites the reader to fix the
failing rule. The correct response to a forged attestation or a waived prohibition is not to fix the
rule it covers — it is to stop, because the inputs to the whole evaluation are no longer trustworthy.
Reporting a partial result alongside evidence of tampering invites someone to salvage the parts that
look fine, which is the wrong instruction.

For an AI operator this is the mechanical form of refusing to proceed. There is no score to partially
satisfy and no verdict to negotiate.

### R5 — The system must be able to say it does not know

A standards system that can only report compliant or non-compliant will manufacture one of them.
`NOT_EVALUATED` — insufficient evidence — is a first-class outcome here, reachable at any time, with
an exit code of its own.

It is also the *expected* first result: 34 of the 59 rules are prohibitions that no machine
evaluates, so a project reaches compliance only once a human has recorded review of them. This
repository's own evaluation reports `NOT_EVALUATED` for exactly that reason, and that is the
mechanism working rather than a defect in it.

Nothing in this series may be arranged so that a positive conclusion is forced.

### R6 — How this invariant is protected

An invariant that relies on good intentions protects nothing. Five mechanisms, none of which require
trusting the person making the change:

1. **Two reviewed inventories.** [`artifacts/standards-source-inventory.json`](../artifacts/standards-source-inventory.json)
   pins the standards series; [`artifacts/rule-inventory.json`](../artifacts/rule-inventory.json)
   pins every rule id with its kind and severity, plus the counts (13 health, 11 fitness, and 10
   nutrition prohibitions, and one invariant). `scripts/inventory.mjs` and `scripts/rules.mjs` derive
   both from the actual content and compare. Neither file is ever regenerated from a run.
2. **Fidelity checking.** `scripts/fidelity.mjs` verifies that every block claimed as source text is
   source text, and that every prohibition's catalog description carries the source's own line. A
   prohibition cannot be softened by rewording it.
3. **Structural refusals.** The catalog loader rejects a prohibition that is not an error, an
   invariant that is attestable, and a manual-review rule claiming full assurance. The evaluator
   refuses an exception against a prohibition, a lowered strength, an attestation contradicted by a
   finding, and any attempt to declare this rule not-applicable or attested.
4. **Contradicted scope claims.** A not-applicable declaration for a rule that a check then observes
   being violated is reported as an integrity violation. It is the one form of false not-applicable a
   machine can catch, and it is worth catching because not-applicable is the only door left open on a
   prohibition.
5. **Mutation tests.** Every guard is tested by reintroducing the defect it exists to catch. A guard
   nobody has watched fail is a guard nobody knows works.

### R7 — What these mechanisms do not claim

They do not make manipulation impossible. Anyone with commit access can edit the guards.

What they do is make it **loud**. Removing a prohibition now requires editing a file whose stated
purpose is to prevent that, in the same commit, as a visible line in a diff — rather than an
invisible change to one rule among fifty-eight. The mechanisms convert a silent act into a
conspicuous one, and that is the whole of what they claim.

Stating this limit is itself required by the standard. A protection that overstates itself is a
weakened standard.

## Prohibitions

This standard carries the series' only invariant.

| Rule | The rule |
| --- | --- |
| [`integrity.no-standards-manipulation`](../PROHIBITIONS.md) | A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion. |

Never exemptible, never attestable, never not-applicable — each enforced in code, because each is a
way of making the invariant stop applying to whoever it currently inconveniences.

## Additions this standard makes beyond the source

- R2's five-step account of how the failure actually unfolds. The source states the invariant; it
  does not describe the path.
- R3 in full. The source does not discuss applicability at all, and the tension between
  "prohibitions are never exemptible" and "prohibitions may be not-applicable" is one this system
  creates and therefore has to resolve.
- R4 — that manipulation produces a distinct outcome and exit code rather than a rule failure.
- R5 in full, drawn from the design brief's requirement that a system never be forced to a positive
  conclusion, and extended with the observation that this is the expected first result rather than an
  edge case.
- R6 and R7 — the protection mechanisms, and the explicit statement of what they do not claim.

## Relationship to other standards

This standard is assumed by all 41 others: each of them can be evaluated honestly only if this one
holds. [Standard 14](14-evidence-quality.md) is its nearest relative in subject matter — evidence
quality for health claims, where this governs evidence for compliance claims.
[Standard 11](11-uncertainty.md) shares R5's disposition toward admitting what is not known.

## Implementation

`integrity.no-standards-manipulation` is `manual-review` at `none` assurance, and it is the one rule
in the catalog that is not attestable. That combination means it can never be reported as passed —
only as not-evaluated, or as the reason a run was blocked.

That is not an oversight. Nothing establishes that no manipulation occurred; what is established is
the detection of specific attempts, each of which blocks the run. Allowing the rule to be attested
would let someone certify their own integrity, which is worth exactly nothing, and would create the
one loophole through which every other protection could be walked.

The five mechanisms of R6 are implemented in `scripts/inventory.mjs`, `scripts/rules.mjs`,
`scripts/fidelity.mjs`, `scripts/catalog.mjs`, and `screenIntegrity()` in `scripts/compliance.mjs`,
and are exercised by the mutation tests in `test/`.
