# Release-review dispositions

Independent content-review results for the four rules that apply to this repository and that no
machine evaluates.

**A disposition is not an attestation.** None of these supplies a `reviewedBy` human identity, and
none of them makes `standards check .` report anything different. A human reviewer may use a
disposition and its evidence chain when deciding whether to record an attestation in
`project-policy.yml`; the human's acceptance is what becomes the attestation, and
`reviewedAgainst.paths` should name both the reviewed material and the packs that framed it.

---

# Certification baseline and verification order

**Read this before the dispositions below, and act on it before inspecting any verdict.**

The prediction recorded later in this file answers *what states should result*. It does not, on its
own, preserve *what procedure makes observing those states trustworthy*. Without the second, a
certifier can follow every written instruction and still perform the validation in the epistemically
weaker order — checking the verdict first, then reading the diff as confirmation of a conclusion
already reached.

```text
Certification baseline: 7f59f8b

Before inspecting or comparing the candidate repository's resulting
per-rule states or overall verdict:

1. Diff the certification candidate against 7f59f8b.
2. Explain every post-baseline change and determine whether it can
   affect standards content, applicability, evidence, attestations,
   evaluation, integrity screening, or verdict computation.
3. Verify that reviewed evidence named by the dispositions has not
   changed since review.
4. Only after the diff has been independently explained, run/inspect
   the evaluation and compare its per-rule states with the prediction
   recorded below.
5. Only after the per-rule states match may the overall verdict be
   considered as release evidence.

A benign post-baseline commit does not advance the certification
baseline. It remains part of the diff and must be explained.

A COMPLIANT verdict or matching predicted state is not evidence that
an unexplained diff is acceptable.

If an unexplained or verdict-affecting change is found outside the
intended human attestations and later explicitly authorized release
mechanics, certification stops until that change is resolved or
reviewed.
```

**The baseline does not move.** `7f59f8b` is valuable precisely because it predates the benign
changes below, and therefore forces a certifier to demonstrate that they are benign. Advancing it
would erase the first evidence that this procedure works.

## Known post-baseline changes

Each must still be explained by the certifier under step 2; listing them here is a starting point,
not a substitute for the diff.

```text
cc0c6de
BACKLOG.md only.
Dormant post-1.0 adoption/enforcement design.
Does not alter reviewed content or verdict inputs.

<the commit that added this section>
dispositions.md only.
Adds the previously precommitted certification baseline and
verification procedure.
Does not alter a substantive disposition, reviewed content,
or verdict input.

<the commit that added this entry>
artifacts/backlog/** and dispositions.md only.
Introduces a 35-item backlog representing work that already
exists: completed 1.0.0 build and review, blocked human
attestation and release mechanics, deferred post-1.0 and
content work.
Does not alter reviewed standards content or any disposition.
Does not alter policy, applicability, attestations, evidence,
the evaluator, or any other verdict input.
Backfills existing state; creates no new pre-1.0 obligation.
The certification feature remains blocked on the human steps;
post-1.0 work remains deferred.

Backlog validation passes and all recorded evidence resolves.
Reconciliation is INCOMPLETE, not clean: this repository has
no merged-PR history, so the PR-dependent reconciliation
checks cannot establish agreement with merged work. Do not
read "no inconsistencies" as "reconciled".

<the commit that recorded the attestations>
VERDICT-AFFECTING BY DESIGN. The only one of these entries
that is.
Four attestations added to project-policy.yml by Michael
Davis, 2026-08-11, all approved, each with reviewed paths
and a digest. Reasoning in attestation-2026-08-11.md.
NOT_EVALUATED/exit 4 -> COMPLIANT/exit 0.
Also in this commit, and NOT verdict-affecting: PROJECT.md,
CHANGELOG.md, and project-policy.yml's attestations comment,
each of which became false when the verdict moved; three
tests updated to assert against tool output rather than
against the old state. None of those files is read by the
evaluator.
No standards content, catalog, schema, detector, evaluator,
applicability declaration, or exception changed.

WITHDRAWN by the commit immediately after it. Do not certify
ad6bdcb. See the entry below.

<the commit that withdrew them>
VERDICT-AFFECTING. Returns the verdict to where it was.
attestations back to {}; COMPLIANT/exit 0 -> NOT_EVALUATED/
exit 4; the four rules back to awaiting evidence.
Reason: the reviewedBy identity at ad6bdcb was written on the
authority of a draft supplied by the reviewing agent, which
cannot confer human authority. The attestations asserted a
human judgement whose author could not be established.
The content was NOT the defect: the dispositions were sound,
the per-rule states matched the frozen prediction exactly,
and every gate was green.
Correction applied to the input, not the machinery. No
disposition, standard, catalog entry, detector, or evaluator
line changed in either direction.
Also here, and not verdict-affecting: PROJECT.md, CHANGELOG.md,
the attestations comment, two tests, and the backlog, all
returned to describing a repository awaiting human review.

<the commit that recorded them validly>
VERDICT-AFFECTING. The same four attestations, approved, with
digests. NOT_EVALUATED/exit 4 -> COMPLIANT/exit 0.
The four rules move to `attested`; the invariant stays
`screened`; health.evidence-quality-noted stays not-evaluated.
What differs from ad6bdcb is neither the machinery nor the
content. It is that the accountable reviewer stated the four
decisions personally, and reviewedBy names them for that
reason. The dispositions below are unchanged, and were the
evidence considered, not the decision.
Two of the four approve REMEDIATED material (79d39d1 for
health, d47e389 for escalation), not the versions first
reviewed and found DEFECTIVE. A certifier must read them that
way; approving the corpus as first delivered would be wrong.
Also here, and NOT verdict-affecting: PROJECT.md, CHANGELOG.md,
the attestations comment, and two test assertions, each of
which became false when the verdict moved. None is read by
the evaluator.
No standards content, catalog entry, schema, detector,
evaluator line, applicability declaration, exception, or rule
strength changed. The correction that made this commit
possible was applied to the input at 7b650f2 and nothing was
relaxed to obtain the verdict.

<the commit that corrected the CI comment>
NOT verdict-affecting. Comments only, plus two prose fixes.
.github/workflows/ci.yml: the comment block above the gate said
this repository is NOT_EVALUATED, and said the exit-4 allowance
could never be removed by recording reviews because the
invariant permanently prevents COMPLIANT. Both false. The
second stopped being true at ADR 0007, which introduced
`screened` for exactly that reason.
The executable line is BYTE-IDENTICAL:
  run: npm run check || [ $? -eq 4 ]
The allowance is not removed here. It is removed under ST-06,
which certification authorizes and this commit does not.
Also: PROJECT.md's "Resolved during release certification"
paragraph and one CHANGELOG.md sentence, both of which asserted
the repository still exits 4.
No standards content, catalog, schema, policy, applicability,
attestation, detector, or evaluator input changed.

HOW THIS WAS FOUND, because it is the important part. It was
not found by diffing against the baseline. It could not be: the
workflow had not changed since 7f59f8b. It was found by an
independent certifier reading the surface an operator would act
on and asking whether it was TRUE, not whether it had MOVED.
Diff-first protects against unexamined change. It cannot
establish that unchanged baseline content was ever correct.
That is a limit of this procedure, not a lapse in following it.
Fourth instance of the same failure family, and the first where
the defect was inherited from the frozen baseline itself.

<the release-mechanics commit>
NOT verdict-affecting, and the first commit in this window that
is allowed to change release state.
Independent certification PASSED against 9809afc: diff
explained, no reviewed evidence moved, attestation provenance
valid, no unexpected verdict inputs, per-rule states matching
the frozen prediction, invariant screened, COMPLIANT/exit 0.
ST-06 authorized on that basis, and only then.
VERSION, package.json, and the policy's standardVersion move
from 1.0.0-dev to 1.0.0. CI's || [ $? -eq 4 ] allowance and its
transitional comment are removed; the gate is now `npm run
check` and exit 1, 2, 3, and 4 all fail the build.
Derived surfaces: CHANGELOG.md, PROJECT.md, this ledger, the
backlog. Two stale counts corrected in passing (130 -> 160
tests), found by the same read-the-surface sweep that found the
CI comment.
The verdict does not move: COMPLIANT/exit 0 before and after.
No standard, catalog entry, schema, rule strength, applicability
declaration, exception, attestation, detector, or evaluator line
changed. standardVersion is a declaration of which standards
version this project is evaluated against; it is not a strength,
and no attestation digest covers project-policy.yml.
NO TAG. GitHub Actions cannot execute at all - the account's
Actions billing or spending limit stops every run before a
runner is acquired, so the workflow reports failure having run
zero steps. That is infrastructure NOT EXECUTED, not evidence
about this repository. Since CI is an enforcement surface here,
v1.0.0 waits for a genuinely green Actions run on this commit.
Authorization to perform release mechanics is not evidence that
they succeeded.

<the commit that fixed the test invocation>
NOT verdict-affecting. SUPERSEDES 83d799b as the release
candidate: 83d799b cannot be tagged, because its own CI run
fails.
Actions billing was fixed and the run on 83d799b executed for
the first time. Five guards green; Tests FAILED:
  Could not find '.../test/*.test.mjs'
npm test was `node --test "test/*.test.mjs"`. Glob expansion in
--test arrived in Node 21; the quotes stop the shell expanding
first. Maintainer runs Node 24, CI pins 20, engines says >=18.
The suite had NEVER run anywhere but one machine.
Fixed by naming the nine test files explicitly - version
independent - rather than raising CI's Node to match the bug.
New guard: the set named in package.json must equal the set of
test/*.test.mjs on disk, and the command must contain no glob.
Mutation-tested. 160 -> 161 tests.
Also: the two test counts in PROJECT.md and CHANGELOG.md.
No standard, catalog entry, schema, policy, applicability,
attestation, detector, or evaluator line changed. The verdict is
COMPLIANT/exit 0 before and after, and the four attestations are
untouched and non-stale.
A NEW CERTIFICATION PASS IS REQUIRED against this commit. The
prior pass certified 83d799b, and 83d799b is not the commit that
will be tagged.

WHY IT MATTERED. Every guarantee this repository makes through
its tests was remotely unverified for its entire life. Nothing
detected it because everything that could have was one of the
tests that never ran. Same family as the CI comment at 9809afc
and now the fifth instance: an actionable surface is verified
only by EXECUTING it, in the environment that will execute it.
Diff-first finds neither. Reading finds neither.
```

The last two entries are the ones this procedure was written for, and they are the only ones where
"explain the diff" was real work rather than a formality. The others could not have moved the verdict.

**And the procedure as written was still not enough.** At `ad6bdcb` it turned green for exactly the
four expected inputs: the invariant stayed `screened`, `health.evidence-quality-noted` still carried
no evidence, every mechanical gate was unchanged, and the per-rule states matched the frozen
prediction line for line. It was wrong anyway. The `reviewedBy` identity rested on a draft rather
than on the person named, so the input was the expected *kind* of input without being the expected
*thing*.

Step 4 therefore has a second half. It is not only **did it turn green for exactly this evidence**
but **is this evidence what it claims to be** — and for an attestation that means: did the named
person decide, personally, and does the record derive its authority from them rather than from
anything written on their behalf. No gate in this repository can answer that. A certifier who
confirms the verdict, confirms the states, and stops, would have certified `ad6bdcb`.

Every entry but the first and fifth names no hash, because it could not: no such commit existed
when its own text was written, and inventing one would be the same defect as the hash that was
corrected at `6c57a12`. Find them with:

```bash
git log --oneline -- artifacts/release-review/dispositions.md
```

Recording it at all matters because otherwise the procedure's own introduction becomes an unexplained
change under the procedure it introduces.

### Why this section exists

It was missing. The four dispositions, the frozen prediction, and the five post-attestation steps
were all recorded; the baseline commit, the diff-before-verdict ordering, and the non-advancement
rule existed only in conversation. That is an operational instruction absent from the surface a
certifier acts on — the third instance in this release of the same failure class, after
`project-policy.yml`'s attestation comment and the README's definition of `COMPLIANT`.

It is a further concrete instance supporting requirement 8 of the post-1.0 workstream in
[BACKLOG.md](../../BACKLOG.md), and deliberately not a new requirement: actionable-surface priority
is already recorded there.

---

## `health.no-fabricated-medical-facts` — ESTABLISHABLE

```text
health.no-fabricated-medical-facts

Independent content-review disposition:
ESTABLISHABLE

Initial review:
DEFECTIVE

Remediation reviewed:
79d39d1

Basis:
The empirical corpus was reviewed at claim granularity.
No fabricated physiological mechanism was identified.
Claims found to exceed their evidentiary support were remediated
at the content layer without weakening the governing rule or evaluator.
Focused rereview finds the blocking defects resolved.
```

**Evidence chain.** [Pack 03](03-health-no-fabricated-medical-facts.md) framed the review ·
[pack 03a](03a-claim-extract.md) supplied the 191 claims verbatim ·
[pack 03b](03b-remediation-diff.md) is the before/after for the thirty that changed.

**Review history.**

| Step | Outcome |
| --- | --- |
| Pack 03 delivered | Reviewer declined to review from categories and exemplars; required the claims themselves |
| Pack 03a delivered (`18a7e8a`) | Corpus corrected from 73 to 191 entries / 182 distinct |
| First disposition | **DEFECTIVE** — six blocking findings, eight non-blocking |
| Remediation (`79d39d1`) | Content narrowed or reframed; rule, evaluator, and policy untouched |
| Focused re-review of the thirty changed claims | **ESTABLISHABLE** |

**What the reviewer recorded about the nature of the defects.** No invented physiology was found.
Every defect was a real finding stated past its evidence — the failure
[Standard 14](../../standards/14-evidence-quality.md) R2 names as the most common one, written by an
author who had read R2 while writing it.

### Finding raised outside the reviewed corpus

`standards/30-adherence.md` R1 previously read *"the first wins by a margin that no programming
refinement approaches"* — characterised by the reviewer as rhetorical quantification masquerading as
comparative magnitude. It was outside the 182-claim corpus and was explicitly **not** used to reject
the rule. Corrected on its own merits:

> A suboptimal plan that is consistently performed can outperform an optimal plan that is abandoned,
> and over a long enough horizon it usually does.

---

## `escalation.tier-language-calibrated` — ESTABLISHABLE

```text
escalation.tier-language-calibrated

Independent content-review disposition:
ESTABLISHABLE

Initial review:
DEFECTIVE

Remediation reviewed:
d47e389

Basis:
The four-tier calibration series was reviewed as a whole.
The initial Tier 4 example improperly softened temporal urgency
while attempting to preserve a calm register.
The remediation now separates tone from action horizon:
calm is constant; urgency is not.
Tier 4 gives unconditional immediate-action guidance for the
worked presentation, does not infer safety from symptom resolution,
and places reassurance after the action.
Tier 2 now separates prompt proper remeasurement and professional
contact from completion of the longer monitoring series.
No governing rule, tier definition, detector, or evaluator was
weakened to obtain this disposition.
```

The initial disposition, for the record:

```text
Initial: DEFECTIVE

Established:
- normative four-tier model
- anti-alarmism principle
- Tier 1 calibration
- Tier 3 calibration
- Tier 2 classification itself

Remediation required:
1. Tier 4 must direct immediate evaluation rather than
   making "today" the primary action horizon.
2. Emergency/EMS language must not depend solely on
   symptoms recurring at rest or acquiring additional features.
3. Preserve reassurance only after immediate action is clear.
4. Tighten Tier 2 so repeated properly measured ~148/94
   readings prompt professional contact without requiring
   completion of a 1–2 week series.
```

**Evidence chain.** [Pack 01](01-escalation-tier-language-calibrated.md) framed the review ·
[pack 01a](01a-tier-language-corpus.md) supplied the four records complete, in tier order ·
[pack 01b](01b-remediation-diff.md) is the before/after.

**Remediation:** `d47e389`. All four items addressed. The reviewer's central formulation — *calm is
constant, urgency is not* — was added to Standard 3 R4 itself, to `docs/escalation-tiers.md`, and to
the example's own note, because R4's prose is what adopting projects imitate and a miscalibration
there propagates.

**Why this finding was worse in kind than the first.** `health.no-fabricated-medical-facts` failed on
claims stated past their evidence. This failed on a principle correctly stated and then over-applied,
in the highest-consequence document in the repository, by the author who wrote the principle. R4 said
do not create alarmism; the record removed alarm and removed urgency with it, because nothing in the
standard distinguished the two.

**No test was added, and none could be.** The tier detector checks that exactly one canonical label
appears. The label was always correct — *potentially urgent*. The defect was entirely in what the
record then told the reader to do. That is what `assurance: none` means on this rule.

The reviewer endorsed the absence of a detector explicitly, and the reasoning is worth keeping: a
check asserting that words like `now` or `emergency services` occur would be *worse* than none,
because it would manufacture partial assurance over something whose correctness depends on the whole
presentation. `manual-review` at `assurance: none` is the epistemically stronger position, not a gap
to be closed later.

## Release consequence of the first two dispositions

Two of the four rules are now **substantively establishable, pending human attestation**. Neither
disposition is an attestation, neither supplies a `reviewedBy` identity, and `standards check .` is
unchanged at exit 4.

## `nutrition.no-single-food-disease-claims` — ESTABLISHABLE

```text
nutrition.no-single-food-disease-claims

Independent content-review disposition:
ESTABLISHABLE

Reviewed:
- artifacts/release-review/04-nutrition-no-single-food-disease-claims.md
- artifacts/release-review/04a-single-food-claims-corpus.md
- relevant material previously reviewed through the rule-03 evidence chain

Basis:
No single-food causal or curative complex-disease claim was identified
in the repository.

The prohibition itself defines the prohibited boundary and explicitly
distinguishes it from legitimate discussion of diet and disease.

The nutrition domain reinforces the boundary through its pattern-based
account of dietary quality and its cross-reference to Standard 14.

The finite named-food scan is corroborating evidence rather than proof
of absence.

Standard 35 R2 does not cross the boundary: it describes fibre as a
qualified proxy for dietary-pattern characteristics, not a food as a
cause or cure of disease.

The absence of a worked violating example is a documentation
opportunity, not a release-blocking failure to operationalise the rule.
```

**No remediation.** This is the first of the four rules to establish on first review.

### The missing worked example — resolved as an opportunity, not a defect

The distinction the reviewer drew: a defect would mean an adopter cannot reliably determine the
prohibited boundary without the example. They can — Standard 14 R3 defines the prohibited structure
and distinguishes it from permitted discussion, Standard 37 R1 supplies the pattern-based model,
Standard 37 R5 reconnects the two and names toxic/curative framing as the error, and Standard 36
routes supplement claims through the same machinery. **Examples should demonstrate semantics, not
create them.**

**No example will be added before 1.0.** Adding one solely to clear a review that did not require it
would be release work invented by the review process rather than by the standard.

**A release invariant was explicitly not created.** Three other prohibitions also lack worked
violating examples — `nutrition.no-starvation-approaches`,
`nutrition.no-identical-response-assumption`, `nutrition.no-scale-change-as-fat-change`. The reviewer
declined to let this review generate a new rule that every prohibition must carry a worked negative
example. That was not part of the reviewed architecture and this review produced no evidence that it
needs to become one. Recorded here so a later reader does not reconstruct the invariant from the
finding.

If an example is written later, the reviewer's suggested shape — illustrative future documentation,
not a release condition:

```text
Acceptable:
"Dietary patterns are associated with cardiovascular risk."

Potentially acceptable with strong evidence:
"Regular consumption of X is associated with Y outcome."

Prohibited:
"X prevents heart disease."  /  "X cures diabetes."
```

### Two secondary questions, both resolved without change

- **Standard 35 R2** contains neither side of the prohibited construction. It is
  nutrient → dietary-pattern proxy, qualified in the same paragraph, and was already reviewed for
  evidence strength under rule 03 (C137, C138). Left alone.
- **Catalog placement against Standard 14 is correct.** The operative phrase is *without strong
  evidence*; a sufficiently well-supported single-food claim is deliberately not prohibited, which
  makes this an evidence rule rather than a nutrition one. Standard 37 R5 supplies enough
  discoverability from the nutrition domain, and the rule is not duplicated into a second standard.

## `trend.trends-over-events` — ESTABLISHABLE

```text
trend.trends-over-events

Independent content-review disposition:
ESTABLISHABLE

Reviewed:
- artifacts/release-review/02-trend-trends-over-events.md
- artifacts/release-review/02a-trend-corpus.md
- current worked records after d47e389

Basis:
The repository consistently distinguishes observations from patterns
and limits the conclusions each can support.

The red-flag single-event override is coherent because it establishes
an action obligation under asymmetric consequences, not an underlying
diagnosis or physiological trend.

Short-term body-mass change as a rough fluid proxy and longer-term
body-weight interpretation are not contradictory: they have different
inferential targets, explicitly cross-reference one another, and state
the relevant caveats.

Accumulated individually weak observations can legitimately increase
concern because their trend carries evidence that no individual
observation carries.

Frequent observation is also compatible with trend-based reasoning:
measurement cadence and interpretation/decision cadence are distinct.

No governing rule, exception, detector, or evaluator requires
modification to obtain this disposition.
```

**No remediation.** The reviewer's unifying reading, worth preserving because it resolves all three
tensions at once and is sharper than anything the standards themselves say:

> The principle governs what a body of evidence is sufficient to establish — not how slowly the
> system must respond.

**An unintended consequence of the tier remediation, noted by the reviewer.** The `d47e389` changes
were made for `escalation.tier-language-calibrated` and strengthened *this* rule. The old tier-two
record risked using the trend principle as permission to delay an independently justified action —
"we don't have a trend, therefore wait". It no longer does. And the tier-four record now demonstrates
the inverse: requiring a trend where the action threshold is already crossed would itself violate the
framework.

---

# Summary

| Rule | Initial review | Final disposition |
| --- | --- | --- |
| `health.no-fabricated-medical-facts` | **DEFECTIVE** | **ESTABLISHABLE** after remediation (`79d39d1`) |
| `escalation.tier-language-calibrated` | **DEFECTIVE** | **ESTABLISHABLE** after remediation (`d47e389`) |
| `nutrition.no-single-food-disease-claims` | — | **ESTABLISHABLE** |
| `trend.trends-over-events` | — | **ESTABLISHABLE** |

Two reviews found real defects, including a safety-significant one in tier-four escalation language.
**The content moved. The rules and the verdict machinery did not.** The other two survived
substantive challenge without any work being invented to manufacture a pass.

---

# What a human must now decide

The dispositions above are **not attestations**. Each was produced by an agent, none carries a human
`reviewedBy` identity, and no agent may supply one — writing a human's name into an attestation they
did not give is the "falsify evidence for" clause of the invariant being attested.

A human reviewer decides whether these four dispositions and their evidence chains are sufficient to
record four attestations in `project-policy.yml`. `INSTRUCTIONS.md` describes the shape; each needs a
real `reviewedBy`, a `reviewedAt`, non-empty `evidence`, and `reviewedAgainst.paths` naming both the
reviewed material and the pack that framed it.

## The attestation dry run

Run in a scratch copy of the repository at `0acc6cc`, with four attestations added and **nothing else
changed**. The repository's own `project-policy.yml` was not touched; the scratch copy was deleted
afterwards. Recorded here because the reviewer set the correct release test — not whether `check`
turns green, but whether it turns green *for exactly those four inputs*.

```text
Status: COMPLIANT
Score:  100%  (rules at required strength that were evaluated: 6)
Rules:  7 passed, 0 failed, 0 warning(s), 51 skipped
Cover:  3 automated, 4 manual-review, 1 not-evaluated, 1 screened

Integrity: integrity.no-standards-manipulation — screened
  9 integrity check(s) ran; none detected a violation.

Framework: 59 rules across 31 of 42 standards;
           21 have an implemented check; 3 standards are fully machine-represented.
exit: 0
```

Per-rule, everything not declared not-applicable:

```text
passed    evaluated        escalation.scope-disclosed
passed    evaluated        escalation.tier-model-documented
passed    attested         escalation.tier-language-calibrated
passed    attested         health.no-fabricated-medical-facts
skipped   not-evaluated    health.evidence-quality-noted
screened  screened         integrity.no-standards-manipulation
passed    attested         nutrition.no-single-food-disease-claims
passed    attested         trend.trends-over-events
```

**What this confirms.** Exactly the four attestations move the verdict. The invariant reports
`screened` rather than `passed` or `attested`, which is the only state it can reach. All mechanical
gates stay green. Nothing else moved.

**What it also discloses, and a human should weigh before recording anything.**
`health.evidence-quality-noted` remains `not-evaluated` in the COMPLIANT state. It is a
*recommendation*, so it does not force `NOT_EVALUATED` and does not enter the score — that is the
designed behaviour, not a bug. But it means **`COMPLIANT` here would be reached with one applicable
rule still carrying no evidence at all**, and anyone recording the attestations should know that
rather than discover it later. It is the clearest live illustration of the repository's own warning:
a verdict says what was checked passed; it does not say everything was checked.

## After attestation, if it is recorded

The five steps as written before any of it happened, kept unedited, with what actually occurred
against each:

1. `VERSION` moves from `1.0.0-dev`. — **Done**, along with `package.json` and `standardVersion`.
2. The `|| [ $? -eq 4 ]` condition comes out of the CI `check` step, along with the comment
   explaining it. — **Done.** The comment had to be *corrected* first, at `9809afc`, because it told
   an operator this step was impossible.
3. `PROJECT.md`, `CHANGELOG.md`, and `project-policy.yml`'s attestation comment all describe a
   repository with zero rules awaiting evidence — and two tests compare that prose to
   `standards status` output, so getting it wrong fails the suite rather than shipping. — **Done, and
   the tests did exactly that**: three failed the moment the verdict moved and had to be corrected
   against tool output rather than against memory.
4. Tag 1.0.0. — **Not done.** Blocked externally: GitHub Actions cannot execute at all, so no run on
   the release commit exists to be green. The tag waits for one.

None of that is an agent's decision to make. Steps 1–3 were performed after an independent
certification pass explicitly authorized ST-06; step 4 has not been authorized and is separately
blocked.

---

## Release state as of `0acc6cc`

All four rules have an independent disposition; none has an attestation. `standards check .` reports
`NOT_EVALUATED` and exits 4. That is the correct state and it is left that way. Nothing is tagged.

## Release state after the withdrawal, and after the valid attestation

The withdrawal returned the repository to the state at `0acc6cc` by a different route: four
dispositions, no attestation, `NOT_EVALUATED` at exit 4.

**All four attestations were then recorded validly**, on the accountable reviewer's own stated
decision, under their own identity, each carrying a `reviewedAgainst` digest over exactly the material
read. `standards check .` now reports `COMPLIANT` at exit 0, the invariant `screened`,
`health.evidence-quality-noted` still not-evaluated — the frozen prediction, reached a second time and
this time on evidence that is what it claims to be.

Two of the four approve **remediated** material: `79d39d1` for `health.no-fabricated-medical-facts`
and `d47e389` for `escalation.tier-language-calibrated`. A certifier who reads them as approving the
corpora as first delivered has read them wrong — both first reviews returned `DEFECTIVE`.

`ad6bdcb` remains in history and must not be certified. It is kept because it is the strongest
evidence this repository has produced about its own procedure: a candidate can satisfy every
mechanical gate, match every predicted per-rule state, and still be uncertifiable on the provenance of
its inputs. That it reached the same verdict the valid commit reaches is the point, not a coincidence
— the verdict never distinguished them.

The addition learned there stands as a permanent requirement of this procedure: the record must
derive its authority from the accountable person, not from any text written on their behalf,
including text they were offered to adopt.

**Certification passed against `9809afc`**, and the release mechanics then ran as their own commit.
`VERSION`, `package.json`, and `standardVersion` are `1.0.0`; CI's exit-4 allowance and its
transitional comment are gone; the gate is `npm run check` alone.

The comment above that gate had previously said the allowance could never be removed, which was
false and was corrected at `9809afc` before any of this. Note where that defect came from: not from
any post-baseline change, but from the baseline itself, unchanged and wrong. It is the reason this
procedure now says in its own text that diff-first cannot establish that unchanged content was
correct.

**`v1.0.0` is not tagged, and the reason is no longer external.** Actions billing was fixed and the
run on `83d799b` executed for the first time in this repository's history. It failed — not on
infrastructure, but on the **Tests** step, because `npm test` used a glob that only Node 21 and above
expands while CI pins Node 20 and `engines` declares `>=18`. The suite had never run anywhere except
the maintainer's machine.

That is the strongest available argument for treating CI as an enforcement surface rather than a
formality. Had the tag been cut while Actions was merely unable to start, an immutable 1.0.0 would
have been pinned to a commit whose test suite could not execute in the environment that was supposed
to enforce it.

`83d799b` is therefore superseded as the release candidate, and the certification that passed against
it does not carry over. The tag goes on a commit that has both a passing certification pass and a
genuinely green Actions run — the same commit, and no other.
