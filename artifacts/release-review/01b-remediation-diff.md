# Evidence pack 01b — remediation diff for `escalation.tier-language-calibrated`

The independent review returned **DEFECTIVE** on one blocking calibration error, with a smaller tier-2
correction. This is the before/after. Tiers 1 and 3 were found calibrated and are untouched.

**Not touched:** the rule, the four tier definitions, `health.escalation-tier-assigned`'s detector,
the evaluator, and every "Reproduced verbatim from the source" block — including Standard 3 R1's
four tier labels and R5's two prohibitions.

---

## 1. Tier 4 — the action horizon

### `docs/examples/interpretation-potentially-urgent.md` · Escalation Tier

**Was**

> New chest discomfort brought on by exertion and relieved by rest, with disproportionate
> breathlessness, warrants prompt medical assessment. Please arrange it today rather than waiting to
> see whether it recurs.
>
> Contact your GP for an urgent appointment, or an urgent care service if you cannot be seen today.
>
> If the discomfort returns at rest, lasts more than a few minutes, or comes with sweating, nausea,
> faintness, or pain spreading to the arm, jaw, neck, or back — call emergency services rather than
> arranging an appointment.
>
> Worth mentioning when you are seen: […]
>
> Until you have been seen, do not train.

**Now**

> New chest discomfort brought on by exertion, with disproportionate breathlessness, warrants
> immediate medical evaluation.
>
> **Call emergency services now.** Do not drive yourself, and do not wait to see whether it happens
> again. This holds even though the discomfort has settled: it easing with rest does not establish
> that it was harmless, and nothing available here can tell the difference.
>
> If you have already been medically assessed for this specific symptom and given a plan for it,
> follow that plan instead.
>
> Worth mentioning when you are seen: that it came on during exertion and eased with rest, how long
> it lasted, that breathlessness accompanied it, that it was the first such episode, and your age and
> training history.
>
> Do not train until you have been assessed.
>
> Many causes of chest discomfort turn out not to be dangerous. The reason to seek evaluation
> immediately is that the symptoms alone cannot safely separate those from the ones that are, and
> that separation is not something this guidance — or you — can perform from a description.

Against the four required remediations:

| # | Required | Done |
| --- | --- | --- |
| 1 | Immediate evaluation, not "today" | "warrants immediate medical evaluation" · "**Call emergency services now.**" · "today" removed entirely |
| 2 | EMS not conditional on recurrence or added features | The conditional clause is gone. EMS is the primary instruction; the symptom list it used to gate on is deleted rather than relocated |
| 3 | Reassurance only after the action is clear | Moved from the closing footnote to after the instruction, and reworded to state *why* immediacy follows from the uncertainty rather than softening it |
| 4 | *(tier 2 — see §3)* | |

Two further changes the review implies:

- **"and relieved by rest" removed from the opening sentence.** It was doing exculpatory work in the
  clause that assigned urgency. It remains in the Observation and in what to tell the clinician,
  which is where a fact about the presentation belongs.
- **A carve-out added** for someone already assessed and given a plan, so the instruction does not
  override existing clinical advice.

### `docs/examples/interpretation-potentially-urgent.md` · Uncertainty

**Was**

> **this symptom set is one that warrants prompt assessment, and that is true regardless of which
> explanation turns out to be right.**

**Now**

> **this symptom set is one that warrants immediate assessment, and that is true regardless of which
> explanation turns out to be right.** The fact that the discomfort eased with rest does not narrow
> it either — distinguishing a stable pattern from an acute one is exactly the clinical judgement
> this guidance may not make (Standard 12 R2).

The added sentence is the reviewer's point about the recognise-but-do-not-diagnose boundary: the
record had been using symptom resolution as an informal stability judgement, which is the kind of
inference Standard 12 R2 forbids.

### `docs/examples/interpretation-potentially-urgent.md` · closing footnote

**Was** — carried the reassurance:

> Most presentations like this turn out to be something manageable. The decision does not turn on
> that, because the cost of being wrong in one direction is very much larger than in the other.

**Now** — the reassurance has moved up, and the footnote records why:

> the reason is asymmetry rather than probability: the cost of being wrong in one direction is very
> much larger than in the other. That the likely explanation is often a manageable one is stated
> above, deliberately after the action rather than before it. Reassurance placed ahead of an
> instruction competes with it.

---

## 2. The principle, moved into the standard adopters imitate

Pack 01 §4 flagged that Standard 3 R4's prose is the calibration exemplar and that any
miscalibration in it propagates. The review's central insight — **calm is constant, urgency is not**
— is therefore now in R4 itself, not only in the example.

### `standards/03-safety-and-escalation-tiers.md` R4 — added after the four existing bullets

> **This requirement governs tone. It never governs the timeframe.** Calm stays constant across all
> four tiers; urgency does not, and a tier-four message that reads calmly while asking for action
> *today* has softened the wrong variable:
>
> | Tier | Tone | Action |
> | --- | --- | --- |
> | Normal variation | calm | none, stated definitively |
> | Worth monitoring | calm | remeasure, concretely |
> | Worth discussing | calm | a professional, at the next reasonable opportunity |
> | Potentially urgent | calm | **now** |
>
> That distinction is stated because the failure it names is easy to commit while following every
> other bullet above, and this repository committed it: the worked tier-four record made *today* its
> action horizon until the 1.0.0 release review. Where the appropriate action is emergency care,
> tier-four language says so plainly and does not make it conditional on the symptom recurring or
> acquiring further features. Reassurance may follow the instruction; it must not precede or dilute
> it.

The "Additions" section records it as the correction most worth having, and why: the defect was
invisible from inside because the record satisfied every other clause of R4.

### `docs/escalation-tiers.md` — the exemplar adopters copy

Added under *Potentially urgent warning signs*:

> **Calm register, immediate action.** Where the appropriate response is emergency care, say so
> plainly, and do not make it conditional on the symptom recurring or acquiring further features.
> "Get this looked at today" is not this tier. Anti-alarmism is about tone, and softening the
> timeframe is not a way of applying it.

### `docs/examples/interpretation-potentially-urgent.md` — the note at the top

The example's own note now teaches the defect rather than only the register:

> **Calm is not the same as unhurried, and this record was wrong about that until the 1.0.0 release
> review.** It previously made *today* the action horizon for a presentation that warrants emergency
> evaluation — anti-alarmism correctly removed the emotional alarm and incorrectly took some of the
> temporal urgency with it. Anti-alarmism governs **tone**. It never governs the timeframe.

followed by the same tone/action table.

---

## 3. Tier 2 — professional contact decoupled from the monitoring period

### `docs/examples/interpretation-worth-monitoring.md` · Escalation Tier

The tier assignment itself was found defensible and is unchanged. What changed is that the record no
longer implies professional contact should wait for the series to complete.

**Was**

> What to do, over the next one to two weeks: […]
>
> Then look at the average, not at any single reading.
>
> If that average remains elevated, that is a pattern rather than a reading, and it moves to *worth
> discussing with a professional*. Bring the full record.

**Now**

> Take a proper reading in the next day or so, then begin a short series over one to two weeks: […]
>
> Then look at the average, not at any single reading.
>
> **If properly taken readings stay around this level, contact a health professional at that point —
> do not wait for the monitoring period to finish.** Readings in this range are something to discuss
> with a clinician. The purpose of the series is to establish whether they are real, not to postpone
> the conversation, and once two or three good readings agree the question has been answered well
> enough to raise.
>
> If the series settles well below this reading, that is the answer. Record what the average was and
> keep it as a baseline.

Two notes on how this was done:

- **"Take a proper reading in the next day or so"** is new. The old text made the first good
  measurement part of a two-week programme; it is now a separate, immediate step, which is what makes
  early contact possible at all.
- **No numeric threshold was introduced.** The reviewer cited ≥140/≥90, and that is where the
  reasoning came from, but thresholds differ between guideline bodies and a figure stated here would
  be read as authoritative — the same abstention Standards 34, 35, and 36 make. The record says
  "around this level", referring to the 148/94 already in it.

---

## Gate after remediation

```text
inventory  0      rules  0      fidelity  0
policy     0      diagrams  0
tests      159 pass, 0 fail
audit      0      check  4  (NOT_EVALUATED)
```

Nothing was attested. `escalation.tier-language-calibrated` remains unattested pending re-review.

---

## What this finding says about the framework

The first defective review (`health.no-fabricated-medical-facts`) found claims stated past their
evidence. This one is different in kind and worse in consequence: a **principle correctly stated and
then over-applied**, in the single highest-consequence document in the repository, by an author who
had written the principle.

R4 says do not create alarmism. The record removed alarm. It also removed urgency, because the two
were not distinguished anywhere in the standard — and the reviewer's formulation, *calm is constant,
urgency is not*, is the distinction that was missing. That gap has now been closed in the standard,
in the exemplar, and in the example, so an adopter imitating this repository inherits the correction
rather than the defect.

Worth recording plainly: **no test could have caught this, and none has been added that pretends
otherwise.** The detector for tier assignment checks that exactly one canonical label appears. The
label here was always correct — *potentially urgent* — and the defect was entirely in what the record
then told the reader to do. That is what `assurance: none` means on this rule, and it is why the
repository reports `NOT_EVALUATED` rather than a green.
