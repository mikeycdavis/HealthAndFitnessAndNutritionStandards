# Evidence pack 01 — `escalation.tier-language-calibrated`

**The rule.** Tier language is proportionate and does not create alarmism. The source requirement:
*These rules must not create alarmism* (Standard 3 R4).

**What the reviewer must decide.** Whether the actual escalation language is proportionate to its
tier, distinguishes monitoring from professional discussion from potential urgency appropriately,
avoids alarmism, and — equally — does not understate meaningful warning signs.

Both directions are failures. Standard 3 R5 states them as symmetrical and warns that a project
treating one as the only real risk will systematically commit the other.

---

## Material to review, in full

| Path | What it contributes |
| --- | --- |
| `standards/03-safety-and-escalation-tiers.md` | The tier definitions, the assignment procedure, and R4's language discipline (~1,200 words) |
| `docs/escalation-tiers.md` | This repository's own tier model, and the exemplar adopters copy (~900 words) |
| `standards/12-red-flags.md` | What belongs in tier four, and R5's language rule for it |
| `standards/13-appropriate-escalation.md` | Applying tiers to an interpretation; R2's destination-and-timeframe table; R4 on stating de-escalation plainly |
| `docs/examples/interpretation-normal-variation.md` | Tier 1 language in practice |
| `docs/examples/interpretation-worth-monitoring.md` | Tier 2 |
| `docs/examples/interpretation-worth-discussing.md` | Tier 3 |
| `docs/examples/interpretation-potentially-urgent.md` | Tier 4 — the load-bearing one |
| `templates/interpretation-record.md` | The tier vocabulary an adopter is handed |

The four worked records are the most useful evidence: they are where the language is exhibited rather
than described, and they were written to be read together as a calibration series.

## The four tiers as defined

Source-verbatim, the system should distinguish: *normal variation* · *something worth monitoring* ·
*something worth discussing with a professional* · *potentially urgent warning signs*.

Standard 3 R1 expands each with what it means and what it asks of the reader. `docs/escalation-tiers.md`
repeats that expansion with worked reasoning.

## The specific language commitments

Standard 3 R4 asks four things. Each is a checkable claim about the prose:

1. Lower tiers stated plainly, without borrowed urgency. *"Normal variation means normal; it does not
   need to be qualified into ambiguity to be safe."*
2. Higher tiers say what to consider doing and why, rather than commanding panic.
3. Tier four is direct and calm — *"Someone reading it may be alarmed already; the writing's job is to
   tell them what to do, not to add to it."*
4. No tier implies a diagnosis. *"Escalation says someone should look at this, never you have this."*

Standard 12 R5 adds, for tier four: name the observation, say plainly it warrants prompt evaluation,
say what kind, say what to bring — *"Then stop. Piling on consequences does not increase the chance
someone acts; past a point it reduces it."*

Standard 13 R4 adds the de-escalation obligation: *normal variation* is a real conclusion and is
stated as one, because a system that will not say anything is fine produces uniform anxiety.

## The argument the language rests on

Worth reviewing as an argument, since the whole calibration depends on it. Standard 3 R4:

> A reader alarmed by ordinary variation learns to discount the system, and the discounting is
> indiscriminate — it applies to the tier-four message too. Proportion in the lower tiers is what
> keeps the top tier meaningful.

If that argument is wrong, the calibration is miscalibrated in a specific direction — toward
under-warning.

## Where the implementer's confidence is thinnest

1. **The tier-four example is deliberately calm, and a reviewer may reasonably find it too calm.**
   `docs/examples/interpretation-potentially-urgent.md` handles new exertional chest discomfort with
   breathlessness. It says "please arrange it today", gives an emergency-services escalation for
   specific worsening signs, and instructs "do not train" until seen. It contains a note explaining
   that readers usually expect tier four to be more emphatic than it is. **The judgement to test: is
   "arrange it today, and call emergency services if X" proportionate for that presentation, or does
   the anti-alarmism principle understate it?** This is the single most consequential language
   decision in the repository.

2. **The four tiers may not be equally well separated.** Tier 2 (*worth monitoring*) and tier 3
   (*worth discussing*) are distinguished mainly by whether a pattern has established itself. A
   reviewer should test whether that boundary is operable by someone applying it, or whether it
   collapses in practice.

3. **`docs/examples/interpretation-worth-monitoring.md` assigns tier 2 to a blood pressure of
   148/94** on the grounds that the measurement quality is too poor to support a conclusion, and
   prescribes a one-to-two-week measurement protocol. A reviewer may find that a reading at that level
   warrants tier 3 regardless of measurement quality. The example does carry an immediate-escalation
   clause for symptoms.

4. **Standard 3 R4's own prose is what adopters imitate.** It is the calibration exemplar, and any
   miscalibration in it propagates.

## Disposition

```text
Rule:        escalation.tier-language-calibrated
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (per-tier, citing the example or requirement)
```

If **defective**, fix the language. Softening the rule or reclassifying it would be the manipulation
Standard 42 forbids.
