# Standard 1 — Wellness Guidance vs Medical Assessment

Everything else in this series operates inside a boundary, and this standard draws it. General
wellness guidance and medical assessment answer different questions, rest on different evidence, and
carry different obligations — and the difference is invisible to a reader unless someone states it.

Source: item 1 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that produces health, fitness, or nutrition guidance for a person: an
application, an agent, an analysis, a report. It governs what such a project may present itself as,
and it is the standard the other 41 assume.

## Requirements

### R1 — The distinction is real, and it is about authority rather than topic

Wellness guidance and medical assessment are not separated by subject matter. Both discuss heart
rate, sleep, weight, and pain. They are separated by what the speaker is entitled to conclude.

| | General wellness guidance | Medical assessment |
| --- | --- | --- |
| Answers | What does this measurement generally reflect? What would a reasonable next step be? | What is wrong with this person? What should be done about it? |
| Rests on | Population-level patterns, the individual's own history, general physiology | Clinical examination, history-taking, testing, differential reasoning, professional accountability |
| Can conclude | This is consistent with X; this is worth watching; this is worth asking someone about | This person has X; do Y |
| Is accountable to | The reader's judgement | A professional body, a duty of care, a record |

A system that produces the left column is doing something legitimate and useful. The failure this
standard addresses is producing the left column while a reader believes they are receiving the
right.

### R2 — Scope is disclosed where the guidance is delivered

A project states plainly what kind of guidance it produces, in language a reader will actually parse,
positioned where they encounter the guidance rather than only in a document they will not open.

The obligation is satisfied by clarity, not by volume. A dense legal disclaimer is worse than a
sentence, because a reader skips it and is left with the impression the interface gave them.

What the statement should establish:

- that the guidance is general information rather than an assessment of this person;
- that it does not diagnose, and does not replace evaluation by someone who can;
- what it is genuinely useful for, so the statement reads as orientation rather than as a hedge.

Rule [`escalation.scope-disclosed`](../PROHIBITIONS.md) carries this requirement.

### R3 — Naming a condition from consumer data is the boundary being crossed

Reproduced verbatim from the source:

> diagnose a condition solely from one consumer measurement

This is the prohibition that most often marks the moment guidance stops being wellness guidance. A
consumer device measures one quantity under uncontrolled conditions; a diagnosis is a claim about a
person that changes what they fear, how they act, and whether they seek care. The gap between those
two things cannot be closed by confident phrasing.

The prohibition is on the *conclusion*, not the topic. Describing what a measurement is consistent
with, and what would distinguish the possibilities, stays inside the boundary. Naming the condition
crosses it.

Rule [`health.no-diagnosis-from-single-measurement`](../PROHIBITIONS.md).

### R4 — Staying inside the boundary does not mean being unhelpful

The most common overcorrection is guidance so hedged that it says nothing, on the theory that saying
nothing is safe. It is not: a reader who receives nothing useful goes elsewhere, often somewhere with
no standards at all, and a system that will not commit to anything also cannot warn about anything.

Useful, in-scope guidance includes describing what a measurement generally reflects, comparing it
against the person's own history, naming several plausible explanations, saying what would
distinguish them, and saying plainly when something warrants professional evaluation. That last one
is a substantive act, and [Standard 3](03-safety-and-escalation-tiers.md) exists to make it
possible without alarmism.

### R5 — The boundary is stated to the reader, not just held internally

A project may reason carefully about the distinction internally and still fail this standard, because
the requirement is that the *reader* can tell. The test is not whether the team knows what the system
is; it is whether someone encountering the output for the first time would.

## Additions this standard makes beyond the source

- R1's table. The source states that the system must distinguish wellness guidance from medical
  assessment; it does not say what the distinction consists of. Locating it in *what the speaker may
  conclude* rather than in subject matter is this standard's interpretation.
- R2 in full — that scope must be disclosed where guidance is delivered, and that clarity beats
  volume.
- R4 in full. The source does not warn against overcorrection. It is included because the failure is
  common, and because a system that hedges everything cannot perform the escalation the source
  explicitly asks for.
- R5's framing of the test as the reader's ability to tell.

## Relationship to other standards

[Standard 3](03-safety-and-escalation-tiers.md) is how this boundary is crossed responsibly: the
tiers describe when general guidance stops being sufficient and evaluation should be considered.
[Standard 13](13-appropriate-escalation.md) applies that to health interpretation specifically.
[Standard 14](14-evidence-quality.md) governs the claims made inside the boundary, and
[Standard 15](15-limits-of-interpretation.md) governs what consumer data can support at all.

## Implementation

Two rules attach to this standard, and they sit at opposite ends of what tooling can do.

`escalation.scope-disclosed` is a `document` rule at `partial` assurance. A detector establishes that
a scope statement is present in the documentation or guidance templates. It cannot establish that the
guidance elsewhere stays inside the scope that statement claims, and it cannot see what a running
system says to a reader.

`health.no-diagnosis-from-single-measurement` is `manual-review` at `none` assurance. Nothing
mechanical establishes that a project never draws a diagnostic conclusion from one reading; without a
recorded human review it reports not-evaluated, never passed.

That split is the honest position for this standard: the presence of a disclosure is checkable, and
whether the work respects the boundary is not.
