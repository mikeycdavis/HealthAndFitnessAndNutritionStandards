# Standard 3 — Safety and Escalation Tiers

Ordinary wellness guidance is sufficient for most of what it encounters and insufficient for some of
it. This standard defines four tiers for saying which, and the language discipline that keeps the
distinction useful rather than frightening.

Source: item 3 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies wherever a project tells someone what to do about an observation — health, fitness, or
nutrition. The tiers are the vocabulary; [Standard 13](13-appropriate-escalation.md) governs
applying them to a health interpretation, and [Standard 12](12-red-flags.md) governs what belongs in
the highest tier.

## Requirements

### R1 — The four tiers

Reproduced verbatim from the source, the system should distinguish:

* normal variation
* something worth monitoring
* something worth discussing with a professional
* potentially urgent warning signs

Written out with what each means and what it asks of the reader:

| Tier | Means | Asks the reader to |
| --- | --- | --- |
| **Normal variation** | The observation falls within what this person, or people generally, vary by. Nothing about it is informative. | Nothing. Carry on. |
| **Worth monitoring** | The observation may be ordinary, but a pattern would not be. It is worth having another data point. | Keep observing; look again in a stated period. |
| **Worth discussing with a professional** | The observation is outside what general guidance can interpret, or a pattern has established itself. Someone qualified should look. | Raise it at the next reasonable opportunity. |
| **Potentially urgent** | The observation is consistent with something where delay carries real cost. | Seek evaluation now rather than at the next convenient time. |

### R2 — Exactly one tier, chosen explicitly

An interpretation carries exactly one tier, stated. Not two, not a range, not an implication left in
the tone of the writing.

The reason is that a reader without an explicit tier infers urgency from wording, which is the least
reliable channel available and the one most affected by who happened to write it. An explicit tier
also makes the decision reviewable afterwards, which is the only way anyone learns whether the tiers
are being applied well.

Rule [`health.escalation-tier-assigned`](../PROHIBITIONS.md) requires this of interpretation records.

### R3 — What moves an observation between tiers

Tier assignment is a decision procedure, not an impression. The inputs:

1. **The individual baseline** ([Standard 7](07-individual-baseline.md)). A resting heart rate of 48
   is normal variation for the person who has lived at 48 and worth attention for the person who
   lived at 65 last month.
2. **Measurement quality** ([Standard 6](06-measurement-quality.md)). A poor measurement earns
   *worth monitoring* — take another one — far more often than it earns escalation.
3. **Trend versus event** ([Standard 2](02-trend-over-event.md)). A single reading generally does not
   escalate past *worth monitoring*, with the red-flag exception below.
4. **Accompanying symptoms** ([Standard 4](04-symptom-context.md)). Symptoms usually carry more
   weight than the number they arrived with.
5. **Red flags** ([Standard 12](12-red-flags.md)). These escalate on a single observation, and they
   are the reason tier four exists.

Where these inputs disagree, symptoms and red flags dominate. A reassuring number does not lower the
tier that a worrying symptom set.

### R4 — Tier language must be proportionate

Escalation guidance must not create alarmism.

This is a requirement about wording, and it is not a softening of the tiers. It rests on a practical
observation: a reader alarmed by ordinary variation learns to discount the system, and the
discounting is indiscriminate — it applies to the tier-four message too. Proportion in the lower
tiers is what keeps the top tier meaningful.

What this asks:

- The lower tiers are stated plainly, without borrowed urgency. *Normal variation* means normal; it
  does not need to be qualified into ambiguity to be safe.
- The higher tiers say what to consider doing and why, rather than commanding panic. "This is worth
  getting looked at soon, because X is one of the things it can indicate" is more actionable than an
  instruction to be frightened.
- Tier four is direct and calm. Someone reading it may be alarmed already; the writing's job is to
  tell them what to do, not to add to it.
- No tier implies a diagnosis ([Standard 1](01-wellness-vs-medical-assessment.md)). Escalation says
  *someone should look at this*, never *you have this*.

**This requirement governs tone. It never governs the timeframe.** Calm stays constant across all
four tiers; urgency does not, and a tier-four message that reads calmly while asking for action
*today* has softened the wrong variable:

| Tier | Tone | Action |
| --- | --- | --- |
| Normal variation | calm | none, stated definitively |
| Worth monitoring | calm | remeasure, concretely |
| Worth discussing | calm | a professional, at the next reasonable opportunity |
| Potentially urgent | calm | **now** |

That distinction is stated because the failure it names is easy to commit while following every other
bullet above, and this repository committed it: the worked tier-four record made *today* its action
horizon until the 1.0.0 release review. Where the appropriate action is emergency care, tier-four
language says so plainly and does not make it conditional on the symptom recurring or acquiring
further features. Reassurance may follow the instruction; it must not precede or dilute it.

Rule [`escalation.tier-language-calibrated`](../PROHIBITIONS.md).

### R5 — Both directions of error are real

The two failure modes are symmetrical, and only one of them is usually treated as a failure.

Reproduced verbatim from the source, guidance must never:

> catastrophize ordinary measurements without supporting evidence

and equally must never:

> provide false reassurance when serious warning signs are present

Neither direction is the safe default. Over-escalation produces anxiety, unnecessary testing, and
learned dismissal of the system. Under-escalation delays care. A project that treats one of these as
the only real risk will systematically commit the other.

Rules [`health.no-catastrophizing`](../PROHIBITIONS.md) and
[`health.no-false-reassurance`](12-red-flags.md).

### R6 — The tier model is documented

A project writes its tier model down, including what distinguishes each tier from its neighbours, so
that assignments can be checked against something and a reader can learn what the levels mean.

Rule [`escalation.tier-model-documented`](../PROHIBITIONS.md). This repository's own model is
[`docs/escalation-tiers.md`](../docs/escalation-tiers.md), which adopters may copy.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`health.no-catastrophizing`](../PROHIBITIONS.md) | catastrophize ordinary measurements without supporting evidence |

The counterpart prohibitions on false reassurance and on dismissing symptoms live in
[Standard 12](12-red-flags.md), where red flags are defined.

## Additions this standard makes beyond the source

- The R1 table. The source lists the four tiers as four phrases; what each means, and what each asks
  of a reader, is this standard's work.
- R2's requirement of exactly one explicit tier.
- R3 in full — the decision procedure and the precedence rule that symptoms and red flags dominate a
  reassuring number.
- R4's specific language discipline. The source says these rules must not create alarmism and does
  not say how; the argument that alarm in the lower tiers degrades the top tier is this standard's.
- R4's tone-versus-timeframe separation, added after the 1.0.0 release review found this repository's
  own tier-four example under-escalating. It is the correction most worth having here, because R4's
  prose is what adopting projects imitate: a miscalibration in it propagates to every adopter, and
  this one was invisible from the inside precisely because the record satisfied every other clause.
- R5's framing of the two errors as symmetrical, and the observation that treating one as the only
  risk produces the other.

## Relationship to other standards

[Standard 1](01-wellness-vs-medical-assessment.md) sets the boundary these tiers describe crossing.
[Standard 12](12-red-flags.md) defines what belongs in tier four.
[Standard 13](13-appropriate-escalation.md) applies the tiers to health interpretation.
[Standard 6](06-measurement-quality.md), [Standard 7](07-individual-baseline.md), and
[Standard 2](02-trend-over-event.md) supply R3's inputs.

## Implementation

`escalation.tier-model-documented` is a `document` rule at `partial` assurance: a detector
establishes that a document names all four tiers. It says nothing about whether the distinctions
drawn are sound or the boundaries sit in sensible places.

`escalation.tier-language-calibrated` is `manual-review` at `none` assurance. Nothing mechanical
evaluates tone, and an attempt to do it by keyword would misfire on exactly the careful writing it
should reward — a passage explaining why something is *not* urgent contains every alarming word in
the language. It reports not-evaluated without a recorded human review.

`health.no-catastrophizing` is likewise `manual-review` at `none`.

The four tier labels are the one mechanically checkable thing here, and the detector that reads them
looks for exactly one canonical label in an interpretation record. Whether it is the *right* tier is
the question that matters, and no machine answers it.
