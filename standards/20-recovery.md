# Standard 20 — Recovery

Recovery is where training produces its effect. This standard governs planning for it, reading its
signals, and the prohibition on using one of those signals as a scoreboard.

Source: item 20 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans training. It covers the adaptation process; [Standard 21](21-rest.md)
covers the prescribed absence of training that supports it.

## Requirements

### R1 — Recovery is a process with several components

Recovery is not simply time passing. What it consists of:

- **Sleep** — the largest single contributor, and the one most affected by everything else
  ([Standard 28](28-sleep.md)).
- **Energy and protein availability** — inadequate intake limits adaptation directly
  ([Standard 32](32-energy-balance.md), [Standard 34](34-protein.md)).
- **Time since the stimulus**, which differs by tissue: cardiovascular and metabolic recovery run
  faster than connective-tissue remodelling.
- **Total load**, training and otherwise. Physical work, life stress, and illness draw on the same
  capacity.

A plan that provides only the third of these is providing rest, not recovery.

Rule [`fitness.recovery-planned`](../PROHIBITIONS.md).

### R2 — Recovery is planned in, not left as the slack

Recovery provisions are stated in the plan: rest days, lighter periods, planned deloads, and what
happens when recovery is inadequate. Unstated recovery is the first thing sacrificed when a schedule
tightens, because it is the only part of the plan that looks like nothing.

### R3 — Never equate soreness with workout effectiveness

Reproduced verbatim from the source:

> equate soreness with workout effectiveness

Delayed-onset soreness tracks novelty and eccentric loading, not adaptation. It is highest when
someone is least trained and fades as they improve — so using it as a quality signal rewards constant
change over the consistency that actually produces progress, and tells an improving person their
training has stopped working.

Rule [`fitness.no-soreness-as-effectiveness`](../PROHIBITIONS.md).

### R4 — What soreness does tell you

Not nothing, and the useful reading is different from the scoreboard reading. Soreness indicates
novelty or unusual eccentric load; severe or unusually persistent soreness indicates the jump was too
large; soreness that impairs movement is a reason to modify the next session
([Standard 24](24-pain-injury-signals.md)).

It is information about the stimulus, not a measure of its value.

### R5 — Inadequate recovery has recognisable signals

Read together rather than individually, and none is diagnostic alone:

- performance stalling or declining under unchanged or increased load;
- resting heart rate elevated relative to the person's own baseline
  ([Standard 7](07-individual-baseline.md));
- sleep worsening despite adequate opportunity;
- persistent, unusual fatigue; irritability; loss of motivation;
- minor niggles accumulating;
- frequent minor illness.

The response is to reduce load, not to push through — which is
[Standard 18](18-progressive-overload.md) R2's prohibition arriving from the other direction.

### R6 — Recovery need scales with load, age, and life

The recovery a plan needs is not fixed. It rises with training load and intensity, and it varies with
age, sleep, life stress, and nutrition. A plan whose recovery provision is copied from someone else's
is a plan whose recovery provision is arbitrary.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-soreness-as-effectiveness`](../PROHIBITIONS.md) | equate soreness with workout effectiveness |

## Additions this standard makes beyond the source

- R1's components, and the distinction between recovery and mere elapsed time.
- R3's specific mechanism — that soreness fades with training, so the scoreboard reading tells an
  improving person their training stopped working.
- R4 in full: what soreness legitimately indicates, as distinct from what it is misread as.
- R5's signal list, with the instruction that they are read together.
- R6's scaling argument.

## Relationship to other standards

[Standard 21](21-rest.md) covers prescribed non-training.
[Standard 18](18-progressive-overload.md) depends on this standard's subject for its mechanism.
[Standard 28](28-sleep.md) covers R1's largest component.
[Standard 22](22-training-volume.md) covers the load being recovered from.
[Standard 24](24-pain-injury-signals.md) receives R4's impaired-movement case.

## Implementation

`fitness.recovery-planned` is a `document` requirement at `partial` assurance: a detector establishes
that the plan has a non-empty `## Recovery and Rest` section. It cannot establish that the provision
is adequate for the load, which depends on the person and on everything outside the plan.

`fitness.no-soreness-as-effectiveness` is `manual-review` at `none` assurance and reports
not-evaluated without a recorded human review. R5's signals are specified here and not implemented as
any check.
