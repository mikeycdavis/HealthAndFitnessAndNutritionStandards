# Architecture — Health, Fitness, and Nutrition Standards

This is the design record required by [`artifacts/prompts/design-brief.md`](../../artifacts/prompts/design-brief.md)
("Before implementation, produce an architecture and milestone plan"). It exists so the design
survives outside the conversation that produced it. It describes what this repository is, which
concepts it adopts and why, how a verdict is reached, and in what order the system was built.

Where this document and a source prompt disagree, the source prompt wins. Where this document and
the code disagree, that is a defect in one of them — the tests are the arbiter.

## 1. What this repository is

A **standards pack**: a repository that publishes numbered normative standards for personal health,
fitness, exercise, and nutrition guidance, together with the tooling that audits and evaluates
*adopting projects* against them. An adopting project is any repository that produces
health/fitness/nutrition guidance — an application, an agent, an analysis pipeline, a research
workflow.

It is not a document collection. The design brief's eight questions are the specification, and each
is answered by a specific mechanism:

| The brief asks the system to determine | Mechanism |
| --- | --- |
| 1. what should be done | catalog rules with `kind: "recommendation"` |
| 2. what must be done | catalog rules with `kind: "requirement"` |
| 3. what should normally be done | recommendations, plus per-project `strength` in `project-policy.yml` |
| 4. what must never be done | catalog rules with `kind: "prohibition"`, indexed in `PROHIBITIONS.md` |
| 5. when a standard applies | `applicability` in `project-policy.yml`; `standards explain` renders the reasoning |
| 6. what evidence demonstrates compliance | finding `evidence[]`, attestation `evidence` + `reviewedAgainst`, and the `assurance` field |
| 7. how compliance can be verified | `standards audit` / `standards check`, the guard scripts, and the test suite |
| 8. when a decision must be revisited | `revisitWhen` on every not-applicable declaration; attestation digests and `expires`; `standards status` |

### Independence

This repository is standalone, as the brief requires. It must not depend on any other standards
repository. Concepts proven elsewhere (policy-as-code, the separation of catalog from policy from
evaluator, the distinction between what a check *is* and what it can *establish*) were adopted as
ideas. Two low-level utilities — a strict YAML subset parser and a JSON Schema subset evaluator —
were vendored once as source and are independently maintained here. No shipped code, document, or
test refers to another standards repository as an authority, and nothing resolves against one at
runtime.

### Dependency policy

Zero third-party dependencies. Node ≥ 18, ESM, `node:` builtins only; tests use `node:test`. The
policy is structural rather than aspirational: CI has no install step, so a dependency cannot be
added without the change being visible in the workflow file.

## 2. Concept analysis

The brief lists fifteen candidate concepts and instructs: *"Do not blindly implement these concepts
merely because they are listed. Determine which are appropriate and document the reasoning."* This is
that determination.

| Concept | Disposition | Reasoning |
| --- | --- | --- |
| requirement | **Adopted** as a rule kind | The domain has genuine musts ("interpretation records state measurement quality"). Exemptible, because a project can be knowingly and temporarily unable to meet one. |
| prohibition | **Adopted, first-class** | 34 of 59 rules are must-nevers. Making prohibition a *kind* rather than a boolean flag on a requirement matches the domain's actual shape. Never exemptible. Indexed in `PROHIBITIONS.md`, sectioned in the standards, typed in the catalog — three surfaces, so it cannot be buried. |
| recommendation | **Adopted** as a rule kind | The brief's "what should normally be done". Failures report as warnings, not errors — collapsing them into requirements would make the error signal meaningless. |
| decision rule | **Adopted narrowly — not as a catalog kind** | The domain has real decision procedures: assigning an escalation tier (Standard 3), distinguishing a trend from an event (Standard 2). But a decision procedure is not evaluable against a project — you cannot ask "does this repo comply with a procedure". What is checkable is a *requirement that references it* ("records assign a tier per the documented procedure"). So procedures live in standards prose with worked examples in `docs/examples/`, and the catalog carries the requirement. A `decision-rule` kind would have been a rule type nothing could ever evaluate. |
| applicability | **Adopted** | A nutrition tracker has no subject for fitness prohibitions. Declared per rule with a mandatory `reason`, a `reviewedAt`, and a `revisitWhen` trigger. Deliberately *not* an exception: not-applicable means the rule has no subject here; an exception means the rule applies and the project knowingly does not satisfy it. Collapsing the two hides real failures, so they are separate maps that a policy fixture proves cannot both claim the same rule. See §4.1 — for prohibitions, the quality of the not-applicable reasoning is what keeps the mechanism from becoming a waiver. |
| evidence | **Adopted** | Central to the brief. Three places: findings carry `evidence[]` (what was observed); attestations require non-empty `evidence` plus `reviewedAgainst.paths` with a content digest, so the attestation goes stale when the reviewed files change; and `assurance` states what the mechanism can honestly claim. |
| verification | **Adopted** | `standards audit` (evidence) and `standards check` (verdict), the guard scripts, and the test suite. Kept separate from evidence *gathering* — see §4. |
| exceptions | **Adopted, restricted** | Time-bounded, reasoned, approved waivers. Valid only against requirements and recommendations. An exception naming a prohibition or the integrity invariant is not recorded and not rejected quietly — it produces `BLOCKED_BY_INVARIANT`. |
| severity | **Adopted**, orthogonal to kind | `error`/`warning`/`info` is reporting weight; kind is what the rule *is*. A recommendation failing is a warning; a prohibition is always an error. Two fields because a project may reasonably tune reporting without redefining the rule. |
| invariants | **Adopted** — one catalog kind, plus tested system properties | The standards-integrity invariant is a catalog rule (`kind: "invariant"`, Standard 42) because it binds adopters and this repository alike. The evaluation machinery's own invariants — a skip never counts as a pass, no `manual-review` rule claims `full` assurance — are enforced as *tests*, not catalog entries, because they constrain this repository's code rather than any adopter's behavior. |
| revisit conditions | **Adopted** | `revisitWhen` is mandatory on every not-applicable declaration. An applicability claim is a statement about a project at a moment; without a trigger it silently outlives its truth. Attestations additionally go stale by digest and may carry `expires`. `standards status` reports everything now due. |
| not-applicable | **Adopted** | Permitted against prohibitions (a nutrition-only tool genuinely has no fitness-prohibition subject). Never permitted against the integrity invariant — that is tested, because "this repository is exempt from integrity" is exactly the manipulation the invariant forbids. |
| not-evaluated | **Adopted** — this is the brief's "insufficient evidence" | The default state of every judgment rule with no attestation. It is always reachable, which is how the system satisfies "It must never be forced to produce a positive recommendation." |
| compliant | **Adopted** | With `COMPLIANT_WITH_EXCEPTIONS` as a distinct verdict, because a waiver is not the same as satisfaction. |
| non-compliant | **Adopted** | Plus a fifth verdict the brief requires and the concept list does not name: `BLOCKED_BY_INVARIANT`. |

Two concepts the list does not mention but the design needs:

- **`validationType` vs `assurance`.** `validationType` says what kind of check the rule calls for
  (`structural`, `document`, `manual-review`). `assurance` says what the current implementation can
  actually establish (`full`, `partial`, `none`). They are separate fields because conflating them
  is how false-green compliance happens: a rule can be catalogued as checkable while the checker
  that exists establishes something much weaker. In this release, *no rule claims `full`* — a
  section existing proves nothing about whether its content is true. This pair is also how the
  original prompt's "clearly identify which standards are mechanically verifiable versus
  judgment-based" is answered mechanically rather than in prose.
- **Framework coverage.** How much of the framework is machine-represented at all, reported *beside*
  the verdict and never folded into the score. Without it, `COMPLIANT` reads as "we checked
  everything" when it means "everything we checked passed."

## 3. The rule model

Rules live in `rules/<category>.json`. Every rule carries a fixed field set, enforced at load time —
a malformed entry throws rather than loading partially, because a partial load silently shrinks the
denominator of every subsequent count.

| Field | Values / rule |
| --- | --- |
| `id` | `category.kebab-case-name`, matching `^[a-z][a-z0-9]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$`, globally unique |
| `title` | The invariant the rule protects, stated positively |
| `standard` | Number; must resolve to a real `standards/NN-*.md` |
| `category` | `health`, `fitness`, `nutrition`, `escalation`, `trend`, `integrity` |
| `kind` | `requirement` \| `recommendation` \| `prohibition` \| `invariant` |
| `severity` | `error` \| `warning` \| `info`; prohibitions and invariants are always `error` |
| `validationType` | `structural` \| `document` \| `manual-review` |
| `assurance` | `full` \| `partial` \| `none`; a `manual-review` rule may never claim `full` |
| `introducedIn` | Semver of the release that added it |
| `description` | For prohibitions, the source "Never …" line verbatim |
| `rationale` | Why the rule exists |
| `remediation` | What to do about a failure |
| `aliases` | Array, may be empty; no alias may collide with any id or alias |
| `deprecatedIn`, `supersededBy`, `removedIn` | Present even when `null` |
| `attestable` | Optional; defaults to `validationType === "manual-review"`; **always false for invariants** |
| `$assuranceNote` | Optional; on detector-bound rules, states what the detector does and does not observe |

Categories `escalation.*` and `trend.*` exist because the wellness/medical boundary and the
trend-over-event principle are cross-domain subjects. Filing them under `health.*` would falsely
scope them to one domain and would break a property worth having: `health.*` contains exactly the
thirteen health prohibitions, `fitness.*` exactly eleven, `nutrition.*` exactly ten. A rule's
`category` follows its source section even when its `standard` points at a foundation standard.

### Identity

Rule identity was fixed before any rule was written, and the canonical form is rejected-by-
construction elsewhere: the same regex appears in the catalog loader, in the policy schema's
`propertyNames`, and in Standard 42. A retired id is never reused for a different meaning; renaming
a title does not change an id; a material semantic change requires a new id, and the test for
"material" is whether an existing exception against the rule would still mean what its author
intended.

## 4. Evaluation model

### Per-rule states

`passed`, `failed`, `warning`, `attested`, `excepted`, `skipped (not-applicable)`,
`skipped (not-evaluated)`.

Decision order per rule:

1. Declared not-applicable → `skipped (not-applicable)`.
2. An attestation exists → judged: a rule that is not attestable, an attestation contradicted by an
   automated finding, a `rejected` status, an expired attestation, or a stale digest each fail or
   fall back — only a clean attestation yields `attested`.
3. `manual-review`, or the rule is not bound to any detector → `skipped (not-evaluated)`.
4. No findings bound to the rule → `passed`.
5. Findings present → `failed` (requirement, prohibition, invariant) or `warning` (recommendation);
   a live exception softens the first two kinds only.

**A skip never counts as a pass.** This is the property everything else protects. A false red has a
complainant; a false green has none, by construction.

### Per-rule states

`passed` · `failed` · `warning` · `skipped` (not-applicable or not-evaluated) · **`screened`**

`screened` is available **only** to a `kind: "invariant"` rule that has a binding in
`INVARIANT_SCREENS` and whose every bound check executed on this run. It means:

> All implemented integrity checks applicable to this evaluation completed and detected no integrity
> violation. This does not establish that no undetectable manipulation occurred, and it is not human
> attestation of the invariant.

It is not `passed`, enters neither the score numerator nor its denominator, and does not trigger
`NOT_EVALUATED`. The asymmetry it preserves:

```text
absence of detected manipulation  → weak evidence  → screened
presence of detected manipulation → decisive       → BLOCKED_BY_INVARIANT (exit 3)
```

Eligibility is deliberately narrow and mechanical, because the predictable future proposal is
"`health.no-false-reassurance` has some regex checks, so let us call it screened". A regex over prose
is not a screening implementation, and a rule about an adopter's guidance is not a meta-invariant
about the evaluation. Tests assert no non-invariant can acquire a screen, and that removing any bound
check withdraws the state entirely.

### Project verdicts

`COMPLIANT`, `COMPLIANT_WITH_EXCEPTIONS`, `NON_COMPLIANT`, `NOT_EVALUATED`, `BLOCKED_BY_INVARIANT`.

Precedence, which matters as much as the list:

1. Integrity violations → `BLOCKED_BY_INVARIANT`. Nothing else is evaluated.
2. No policy → `NOT_EVALUATED`.
3. Any non-excepted failure → `NON_COMPLIANT`. Ordered before the next case because a real failure
   is actionable now, and a project with both should be told about the failure first.
4. **Any applicable required-strength rule that nothing established → `NOT_EVALUATED`.** "Nothing
   failed" is not evidence that anything passed. Because 34 of the 59 rules are prohibitions no
   machine evaluates, this is the expected result for a project that has recorded no human review —
   and it is the correct one. Reaching `COMPLIANT` requires that a human actually looked.

   A `screened` invariant is **not** in this set. Before [ADR 0007](../../artifacts/adr/0007-screened-as-a-distinct-invariant-state.md)
   it was, and since the integrity invariant is required, human-evaluated, and never attestable, that
   made `COMPLIANT` unreachable for every project forever — which would have turned `NOT_EVALUATED`
   into boilerplate and destroyed the distinction it exists to carry.
5. Any live exception → `COMPLIANT_WITH_EXCEPTIONS`.
6. Otherwise → `COMPLIANT`.

`BLOCKED_BY_INVARIANT` is not a compliance failure. It is the system declining to produce a verdict
because the inputs to the verdict have been manipulated. It is reached when:

- an exception names a prohibition or the integrity invariant;
- a policy entry attempts to change the kind or strength of a prohibition or the invariant;
- an attestation contradicts an automated finding;
- an attestation's `reviewedAgainst` digest is presented as current but does not match;
- the invariant is declared not-applicable, or attested.

When it fires, nothing else is evaluated and the exit code is 3. For an AI operator this is the
mechanical form of "refuse or stop work that would violate an invariant" — there is no score to
partially satisfy and no verdict to negotiate.

### 4.1 Applicability is not a waiver

Prohibitions are never exemptible but may be declared not-applicable. That combination opens exactly
one escape hatch, and closing it is a semantic obligation rather than an additional mechanism: a
project could otherwise waive a prohibition in practice by mislabelling it as out of scope.

The two claims are different, and the difference is what the reason must establish:

```text
Exception:      "The rule applies, but we are permitted not to satisfy it."
Not applicable: "The prohibited behavior cannot occur within the evaluated scope."

For a prohibition:
  Exception                        → never permitted
  Legitimate not-applicable        → permitted
  False not-applicable, used as a
  waiver                           → an integrity violation
```

A not-applicable reason for a prohibition must assert that the prohibited behaviour **cannot occur**
in the evaluated scope. A reason asserting that the behaviour is desired, tolerated, commercially
necessary, or requested by users is not a scope claim — it is a waiver wearing a scope claim's
clothing, and it is the manipulation Standard 42 forbids.

Worked example, `nutrition.no-crash-dieting`:

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

The mechanical support for this is deliberately modest, and its limits are stated rather than
implied. The evaluator cannot judge whether a reason is honest — that is a `manual-review` question
like the prohibitions themselves. What it does enforce is that the reason exists, is non-empty,
carries a `revisitWhen` trigger, and is rendered in full by `standards explain` and `standards
status`, so a false scope claim has to be written down, reviewed, and re-examined when the trigger
fires rather than being an unstated assumption. Standard 42 supplies the normative rule; the adoption
guide supplies the worked examples above.

### Score and coverage

The score is the share of evaluated, required-kind rules that passed. It is a summary statistic and
never the verdict. It is rendered beside — never merged with — framework coverage, which reports how
much of the framework is machine-represented at all.

## 5. CLI

`scripts/standards.mjs`, five subcommands chosen for the operator loop of an agent working inside an
adopting repository.

| Command | Job |
| --- | --- |
| `standards init [--dir] [--dry-run] [--force-overwrite=<path>] [--mode]` | Bootstrap an adopting repo: policy, manifest, agent instructions, artifact directories |
| `standards audit [--dir] [--json] [--strict]` | Gather evidence; emit findings; no policy required; never a verdict |
| `standards check [--dir] [--json]` | The verdict: catalog + policy + findings + attestations |
| `standards explain <id> [--dir] [--json]` | Why: the rule's kind, text, rationale, parent standard, whether and why it applies here, what evidence would satisfy it, current state |
| `standards status [--dir] [--json]` | What has gone stale: expired exceptions, stale attestations, applicability declarations due for revisit, missing evidence |

`standards plan` was considered and rejected: every finding and catalog entry already carries
`remediation`, and `status --json` enumerates actionable gaps, so a separate planner would restate
existing data in a second place that could drift from the first.

**Dry-run derives from apply.** `init` is split into a pure `plan()` that returns an action list and
an `apply()` that is the only writer. `--dry-run` is literally `plan()` without `apply()`, not a
parallel rendering path, so a dry run cannot describe something different from what apply does. A
test asserts the two action lists are identical.

Every subcommand accepts `--json`, and JSON output is deterministic — stable ordering, no
nondeterministic fields other than the recorded `auditedAt` timestamp — so an agent can diff two
runs and attribute the difference to the project rather than to the tool.

### Exit codes

Three separate contracts, deliberately not merged.

- `check`: `0` compliant (including with exceptions) · `1` evaluated and non-compliant · `2`
  configuration or schema error, including a missing policy · `3` blocked by invariant · `4`
  insufficient evidence to reach a verdict · `5` release identity not established.

  Code `5` is FE-13's, and it precedes all the others in time: it is returned before the catalog is
  loaded, because a run that cannot show which standards bytes it is using has no authority to
  report anything about them. It is separate from `2` for the same reason `4` is separate from `0`.
  "You invoked this wrongly" and "the pack you are running cannot prove it is the release you asked
  for" have different remedies, and the second is the more important refusal in the system; giving
  it the exit code operators associate with typos would hide it. It is separate from `1` because
  nothing was found wrong with the project — nothing was evaluated at all.

  What this mechanism cannot do is give an earlier release a property it never shipped with:
  `1.0.0` remains a valid certified release and does not provide release self-verification, because
  the code that performs it did not exist when that tree was tagged
  ([ADR 0008](../../artifacts/adr/0008-authenticity-guarantees-are-not-retroactive.md)).

  Code `4` exists because `NOT_EVALUATED` is a first-class outcome here rather than an edge case,
  and folding it into either neighbour would be a lie in one direction or the other. Mapping it to
  `0` would let a project that has evaluated nothing pass a gate — the false green in its purest
  form. Mapping it to `1` would report a project as non-compliant when nothing has been found wrong
  with it. The honest statement is "we cannot establish this", and it deserves its own code so CI
  can act on it distinctly. In this domain it is also the *expected* first result: 34 of 59 rules
  are prohibitions no machine evaluates, so a project reaches compliance only once a human has
  recorded review of them.
- `audit`: `0` survey completed · `1` `--strict` and something non-`info` was found · `2` invocation
  error.
- `init`: `0` completed · `1` conflicts, nothing written · `2` could not run.
- Guards (`inventory`, `rules`, `fidelity`, `policy`, `diagrams`): `0` clean · `1` violation · `2`
  could not evaluate.

The 1-versus-2 split is the load-bearing one: `1` means the tool worked and the repository has
problems; `2` means the tool could not reach a conclusion at all.

## 6. Protecting the integrity invariant

The brief asks how the invariant can itself be protected and tested. Five mechanisms, none of which
rely on anyone's good intentions:

1. **`artifacts/rule-inventory.json`** — a committed, human-reviewed enumeration of every rule id
   with its kind and severity, plus expected counts (13 / 11 / 10 prohibitions and 1 invariant).
   `scripts/rules.mjs` re-derives the catalog and compares against it. Silently deleting a
   prohibition, downgrading one to a recommendation, or reclassifying it fails CI. Doing it *openly*
   requires editing a reviewed file, which is a visible diff — which is the point. The file is never
   regenerated from a run.
2. **`artifacts/standards-source-inventory.json`** — the same guard for the standards series, so a
   standard cannot be quietly dropped.
3. **`scripts/fidelity.mjs`** — any block a standard claims is reproduced verbatim from the source is
   checked against the source. A prohibition cannot be softened by rewording its quoted text.
4. **Non-attestable, non-waivable, non-exemptible** — the invariant rejects attestation and
   not-applicable declarations by construction, and any attempt produces `BLOCKED_BY_INVARIANT`
   rather than a quiet failure.
5. **Mutation tests** — every guard is tested by reintroducing the defect it exists to catch and
   asserting the guard fails. A guard that has never been observed failing is a guard nobody knows
   works.

The residual limit is stated honestly rather than papered over: someone with commit access can edit
the guards themselves. What the design guarantees is that doing so is a visible, reviewable change
to a file whose stated purpose is to prevent exactly that, rather than an invisible edit to a rule
buried in prose.

## 7. Repository layout

```
standards/         42 numbered standards, NN-kebab-title.md, no frontmatter
rules/             the rule catalog, one JSON file per category
schemas/           project-policy.schema.json
scripts/           the CLI and the guard scripts
templates/         what an adopting project copies
docs/              architecture, escalation tiers, examples, this design record
test/              node:test suites and fixture mini-repositories
artifacts/prompts/ the two source documents, verbatim
artifacts/adr/     architecture decision records
artifacts/*.json   the two human-reviewed inventories
PROHIBITIONS.md    the first-class prohibition index
project-policy.yml this repository's own policy — dogfooded
```

## 8. Milestones

Each milestone ends with a gate; a red gate stops the build rather than deferring the fix.

| # | Milestone | Gate |
| --- | --- | --- |
| M0 | Sources committed verbatim; this document; ADRs 0001–0006 | Sources present and unmodified before any derived artifact |
| M1 | Derived numbered spec; standards inventory + fidelity guards; `package.json`; `VERSION` | `npm run inventory` exits 0 |
| M2 | Vendored parsers; kind-model catalog loader; compliance engine; rule-inventory guard; CI | `npm run rules` fails loudly against an empty catalog |
| M3 | The 59-rule catalog; `PROHIBITIONS.md` | `npm run rules` exits 0; index agrees with the catalog |
| M4 | Policy schema and this repo's own policy, authored together; the 42 standards in batches of four | `inventory` + `fidelity` per batch; `policy` and `check` exit 0 |
| M5 | The CLI: detectors, `check`, `explain`, `status`, `init` | Audit clean here; every invariant path exits 3 |
| M6 | Templates, worked examples, fixture repositories | Compliant fixture checks clean; invariant fixtures exit 3 |
| M7 | Test suite, including a mutation test per guard | `npm test` reports no failures |
| M8 | README, adoption instructions, changelog, generated diagrams | `npm run diagrams` exits 0; tests still green |
| M9 | Full validation run, reported verbatim | All gate commands run and reported |

### Build-order constraints

These are sequencing requirements, not preferences. Each comes from a failure observed while
building a comparable system:

- The source spec is committed and the inventory guard is built **before the first standard is
  written**. Writing standards first is how a series silently skips a number.
- The fidelity guard is built **before** the standards, not after. Adding it afterwards means
  auditing every document that already exists.
- Standards are written in **batches of four with review between them** — each batch settles
  vocabulary that the next batch would otherwise harden into more documents.
- **Rule identity is decided before any rule exists.** Deciding it late means two spellings and a
  reconciliation mechanism to carry forever.
- The **policy schema and the first real policy are written together**. Writing the schema alone is
  how not-applicable and exception get collapsed into one mechanism.
- The **catalog precedes the evaluator**, with the separation enforced mechanically, or the
  evaluator grows a private copy of rule metadata.
- **`audit` and `check` are separate from the start.** Splitting them later breaks every consumer.
- **Dogfood from the first working command**, not at the end.

## 9. Known limitations

Stated here because a limitation that is not written down reads as a claim.

- Detectors establish that an artifact or section **exists**, never that its content is correct.
  Every detector-bound rule is `partial` assurance and carries a `$assuranceNote` saying so.
- The 34 prohibitions and the integrity invariant are `manual-review` with `none` assurance. Nothing
  mechanical evaluates them; they are satisfied only by recorded human attestation, and otherwise
  report not-evaluated. This is honest rather than convenient.
- No rule claims `full` assurance in this release.
- Guards protect against silent change, not against a determined editor with commit access (§6).
