# Evidence pack 03b — remediation diff for `health.no-fabricated-medical-facts`

The independent review returned **DEFECTIVE**. This is what changed, so the re-review can cover
thirty claims rather than 182.

**Claim numbering is unchanged.** Every number below refers to the same sentence position it did
before; only the text moved. [Pack 03a](03a-claim-extract.md) carries the current wording in full
context.

**What was not touched:** the rule, its `description`, its `severity`, its `kind`, its `assurance`,
the evaluator, the policy, and every "Reproduced verbatim from the source" block. The fidelity guard
still reports 72 verbatim claims and 34 prohibitions, all matching the committed source.

---

## Blocking findings

### C60 — age-predicted maximum heart rate · `standards/17-baseline-fitness.md` R3

**Was**

> Age-predicted maximum heart rate deserves specific mention because it is ubiquitous and has an
> individual error of roughly ±10–12 beats per minute, which is wider than the zones drawn from it.

**Now**

> Age-predicted maximum heart rate deserves specific mention because it is ubiquitous. The equations
> for it carry substantial individual prediction error — large enough that training zones derived
> from them should not be treated as precise individual thresholds. How large depends on the
> equation and the population it was fitted to, which is itself part of the point.

The "Additions" section changed with it: it previously claimed credit for stating "the size of its
individual error", and now states why no size is given.

**What to check:** that the operational conclusion survived. The reason for naming the error at all
was to stop zones being read as precise; that reason is now carried without a number.

---

### C73–C78 — the pain table · `standards/24-pain-injury-signals.md` R1

The review's finding was that "No single row is decisive" did not repair a table whose right-hand
column was headed **Injury pain**, because the heading made a list of warning features read as a
differential diagnostic instrument.

**Structural changes**

| | Was | Now |
| --- | --- | --- |
| Requirement heading | Training discomfort and injury pain are different signals | Ordinary exertional sensation and a signal to stop are different things |
| Left column | Training discomfort | Ordinary exertional sensation |
| Right column | **Injury pain** | Feature that should prompt stopping, modifying, or assessment |
| Preamble | Not degrees of the same thing. The distinctions that carry the decision | The decision a plan has to support is behavioural: continue, modify, stop, or seek assessment |

Row contents are materially unchanged, except C75 ("May start suddenly, persist after stopping, or
appear at rest" → "Sudden onset, persistence after stopping, or pain at rest") and C78, where
"Sometimes swelling, bruising…" lost the "Sometimes", which was doing nothing once the column stopped
claiming to identify injuries.

**The qualifier, was**

> No single row is decisive. Sharp pain at a joint that alters how someone moves is the clear case,
> and the clear case is the one this standard is most concerned with.

**The qualifier, now**

> **This is not a diagnostic instrument, and the right-hand column is not a name for a condition.**
> It is a list of features that make continuing to load a movement a worse bet than stopping to find
> out. Pain and tissue damage do not correspond one-to-one in either direction: significant damage
> can present with little pain, and considerable pain can occur without it. No single row is
> decisive, and the table cannot distinguish a serious injury from a minor one — which is why R5
> routes several presentations out of the plan entirely rather than grading them here.
>
> The clear case, and the one this standard is most concerned with, is sharp localised pain that
> alters how someone moves.

The "Additions" section now records why the framing is behavioural, citing
[Standard 12](../../standards/12-red-flags.md) R2's recognise-but-do-not-name boundary.

**What to check:** whether the table still reads as a classifier despite the heading change. The
review's objection was to what the format implies, and a format change is the only thing that can
answer it.

---

### C79 — the damage claim · `standards/24-pain-injury-signals.md` R2

**Was**

> Sharp pain signals that something is being damaged, and training through it converts a recoverable
> problem into a lasting one.

**Now**

> Sharp, localised, sudden, or movement-altering pain is not ordinary training discomfort, and
> continuing to load it can worsen some injuries and delay the point at which the problem is
> recognised. The rule does not depend on knowing what the pain is or whether damage is occurring —
> that is the point of it.

The prohibition's own verbatim text — *recommend training through sharp/significant injury pain* —
is untouched, as is the rule's catalogued `description`.

---

### C83 — the intensity distribution · `standards/25-cardiovascular-conditioning.md` R2

**Was** (R2 in its entirety)

> For most people and most goals, the majority of cardiovascular volume belongs at genuinely easy
> intensity, with a smaller proportion hard. This is not a compromise for beginners — it is broadly
> how well-conditioned endurance athletes train, and the reason is recovery: easy volume can be
> accumulated, hard volume cannot.

**Now**

Heading: "Most volume sits at low intensity" → "**In endurance-oriented training,** most volume sits
at low intensity".

> For endurance goals, the majority of cardiovascular volume belongs at genuinely easy intensity,
> with a smaller proportion hard. This is not a compromise for beginners: it is broadly how
> competitive endurance athletes are observed to train, and the reason is recovery — easy volume can
> be accumulated, hard volume cannot.
>
> Outside endurance-oriented programming, treat it as a **practical default rather than an
> established finding**. The evidence for the distribution comes from trained endurance populations,
> and extending it to general health, weight-management, or mixed-goal training is an extrapolation.
> It is a reasonable one — the recovery argument does not depend on the population — but a plan
> should say it is starting from a default rather than implying the distribution has been
> established for whoever it is written for.

Note "are observed to train" replacing "train": the athlete claim is descriptive of practice, which
is what the evidence supports, rather than a claim that the practice is optimal.

---

### C150 / C182 — the shame claim · `standards/37-dietary-quality.md` R2 and `rules/nutrition.json`

**Was**, standard:

> Shame does not improve adherence: it predicts concealment and abandonment, and it is a documented
> component of disordered eating patterns.

**Was**, rationale — the strengthened copy:

> Shame does not improve adherence — it predicts concealment and abandonment, and it is a documented
> component of disordered eating.

**Now**, one sentence, byte-identical in both files:

> Moralising food can contribute to shame and to rigid eating patterns, and weight-related stigma and
> internalised stigma are associated with disordered-eating outcomes.

The standard adds, and the rationale states in compressed form:

> That sentence is the claim, stated at association strength deliberately. This standard does not
> assert a demonstrated causal chain running from a food label through shame to a disorder — the
> evidence does not carry one, and the prohibition does not need it. Moralising has no benefit to set
> against the risk, so an association is sufficient grounds to avoid it (Standard 14 R1).

**New guard.** `test/claim-strength.test.mjs` pins the shared sentence and fails if either copy
diverges, with a mutation test that reintroduces the exact drift that shipped. The guard traces to a
real defect, which is this repository's stated bar for adding one.

That test does **not** generalise: it is a hand-maintained list of claims known to live in two
places. A generic check would have to decide what counts as "the same claim", which is the judgement
this repository does not claim a machine can make.

---

### C170 — flexible versus rigid restraint · `standards/40-sustainability.md` R5

**Was**

> Rigid restriction predicts preoccupation with the restricted food and a pattern in which breaking
> the rule leads to abandoning it entirely. Flexible approaches generally outperform rigid ones over
> long horizons for this reason, independent of their nutritional content.

**Now**

> Rigid restriction is associated with preoccupation with the restricted food and with a pattern in
> which breaking the rule leads to abandoning it entirely.
>
> Observational work associates flexible restraint with better long-run outcomes than rigid
> restraint. That literature is more contested than the summary suggests, the direction of the
> relationship is not settled, and more recent work has challenged the simplest versions of the
> claim. It is a reason to prefer flexibility where two approaches are otherwise comparable — not an
> established superiority holding independent of nutritional content.

Both changes the review asked for: "predicts" → association, and the causal "for this reason" gone.

---

## Non-blocking wording, fixed in the same pass

| # | File · requirement | Change |
| --- | --- | --- |
| **C26** | `09` R1 | "effects are large" → "often large"; "they shift what a normal value *is*" → "can shift the expected value or alter what it means" |
| **C32** | `09` R1 | "Antidepressants and antihistamines affect" → "Some antidepressants and some antihistamines affect", plus a sentence noting the classes are broad and effects vary by agent — which is now used as an argument for recording the actual drug |
| **C41** | `12` R1 | "Most are probably benign." deleted. The cost-asymmetry argument now stands alone, and gains a clause noting it works *without* anyone estimating a probability |
| **C64** | `20` R1, `28` opening, `28` cross-reference | "the largest single contributor" → "a major contributor", in all three places |
| **C66** | `20` R1 | "cardiovascular and metabolic recovery run faster than connective-tissue remodelling" → "is generally quicker … though the rates vary by person and by loading pattern rather than following a fixed order" |
| **C72** | `22` R4 | The tissue ordering is now labelled "the working assumption behind progressing gradually", explicitly "a reason for caution rather than an established ordering", with a note that the conservative practice does not depend on the ordering being exact |
| **C86** | `25` R5 | Heading "Adaptation is slower in connective tissue than in the cardiovascular system" → "Perceived capacity can outrun tissue tolerance"; "improves faster" → "can improve faster"; "This is why" → "This is the usual account of why" |
| **C92** | `26` R4 | "adapt more slowly than muscle" → "are generally slower to adapt than muscle"; "will outrun" → "risks outrunning"; carries the C72 caveat by reference |
| **C94** | `26` R5 | "is what preserves lean mass" → "supports the retention of lean mass"; "loses a larger proportion" → "is more likely to lose a larger proportion" |
| **C122** | `33` R1 | "are what preserve lean mass" → "support the retention of lean mass"; "loses more of the wrong thing" → "is more likely to lose the wrong thing" |
| **C133** | `34` R3 | Heading "is what preserves lean mass" → "supports the retention of lean mass"; "the main determinant" → "among the main determinants" |
| **C123** | `33` R2 | "self-defeating on its own terms" → "frequently self-defeating on its own terms" |
| **C124** | `33` R2, `nutrition.json` | "outperforms the fast rate measured at any horizon long enough to matter" replaced with an explicit statement that this is a claim about which approach is the better bet, "not a demonstrated ordering of outcomes at every horizon" |
| **C166** | `40` R1 | The overshoot claim is now explicitly withheld: "Whether regain routinely carries someone past their starting point is a stronger claim, and it is not asserted here" |
| **C9 / C100** | `06` R3 table, `28` R3 | "agreement with polysomnography is moderate at best" → "varies by device and by stage, and is insufficient to treat a stage estimate as ground truth" |
| **C181** | `nutrition.json` | Tracks C123/C124 |

**Not changed, and deliberately:** C155 (coffee and tea), C11/C116, C13, C99, C108/C109, C121. The
review found each defensible at the strength written.

One instance of the C124 construction survives elsewhere. `standards/30-adherence.md` R1 says the
comparison is "between a suboptimal plan performed and an optimal one abandoned. Over any horizon
long enough to matter, the first wins by a margin that no programming refinement approaches." That is
an argument about adherence rather than an empirical comparison of dietary rates, and its second
clause — "by a margin that no programming refinement approaches" — is the rhetorical part. It was
left alone because it was outside the reviewed corpus, not because it is clearly sound. Flagged here
rather than silently kept.

---

## Gate after remediation

```text
inventory  0      rules  0      fidelity  0  (72 verbatim claims, 34 prohibitions, 0 unverified)
policy     0      diagrams  0
tests      159 pass, 0 fail   (157 + 2 new in test/claim-strength.test.mjs)
audit      0      check  4  (NOT_EVALUATED — four rules still await human review)
```

`check` still exits 4, which is correct: this remediation did not attest anything. The rule remains
unattested and the repository remains `NOT_EVALUATED`.

---

## What this episode demonstrated

The repository failed its own release criterion, and nobody changed the criterion to let it through.
The rule was not weakened, the evaluator was not touched, and `NOT_EVALUATED` held — which is what
[Standard 42](../../standards/42-standards-integrity.md) exists to make happen and what
[ADR 0007](../adr/0007-screened-as-a-distinct-invariant-state.md) declined to make easier.

The findings themselves are also worth recording accurately: **no invented physiology was found.**
Every defect was a real finding stated past its evidence — which is exactly the failure
[Standard 14](../../standards/14-evidence-quality.md) R2 names as the common one, written by an
author who had read R2 while writing them. That is the argument for external review, not for a
better checklist.
