# Standard 18 — Progressive Overload

Training adapts a body by asking slightly more of it than it is used to, and then allowing it to
recover. This standard governs the first half and forbids running it without the second.

Source: item 18 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans training progression.

## Requirements

### R1 — Overload is a stimulus; adaptation happens in recovery

The mechanism, because the prohibition follows from it rather than being asserted: training applies a
stress, the body responds during recovery by adapting, and capacity increases. The session is the
stimulus; the adaptation is not in it.

This is why progressive overload is not a synonym for "do more each time". Doing more each time
without recovery does not produce more adaptation — it removes the mechanism that produces any.

### R2 — Never increase training load indefinitely without recovery

Reproduced verbatim from the source:

> increase training load indefinitely without recovery

A monotonically rising load is not a faster version of progressive overload. It is progressive
overload with the adaptation removed, and it ends in injury, illness, or abandonment rather than in
fitness.

Rule [`fitness.no-load-increase-without-recovery`](../PROHIBITIONS.md).

### R3 — Progression is documented: what, how much, on what trigger, and what if not

An undocumented progression becomes "add a little each time", which has no stopping rule and no
response to a bad week. A documented one states four things:

1. **What increases** — load, volume, density, or complexity. Preferably one at a time.
2. **By how much** — a stated increment, in absolute or relative terms.
3. **On what trigger** — the condition that earns the increase, such as completing the prescribed
   work at a target effort.
4. **What happens when the trigger is not met** — repeat, reduce, or reassess.

The fourth is the one that matters most and is omitted most often. It is what allows the plan to hold
when things do not go well, which is when a plan is actually needed.

Rule [`fitness.progression-recorded`](../PROHIBITIONS.md).

### R4 — One variable at a time, and not every session

Increasing load and volume and frequency simultaneously makes the change large and makes it
impossible to know which one caused a problem. Progression also does not need to be
session-to-session: for most people and most qualities, weekly or block-level progression fits the
adaptation timescale better and is far more sustainable.

### R5 — Planned reductions are part of progression

Deloads, lighter weeks, and planned backing-off are not interruptions of progressive overload — they
are the part where the adaptation is realised. A plan with no scheduled reduction has one anyway; it
just arrives unscheduled, as illness or injury.

[Standard 20](20-recovery.md) and [Standard 21](21-rest.md) develop this.

### R6 — Progression has ceilings, and they are reconsidered rather than assumed

Every progression eventually stops working, and continuing to push past that point is where the
harm concentrates. Slowing progress is information: it can mean the ceiling for this approach has
been reached, that recovery is inadequate, or that something outside training has changed. Treating
it automatically as a reason to add load is the failure R2 names.

## Prohibitions

| Rule | Never |
| --- | --- |
| [`fitness.no-load-increase-without-recovery`](../PROHIBITIONS.md) | increase training load indefinitely without recovery |

## Additions this standard makes beyond the source

- R1's statement of the mechanism, which turns the prohibition into a consequence rather than a rule
  to be taken on trust.
- R3's four components, particularly the fourth — what happens when the trigger is not met.
- R4's one-variable-at-a-time and its note that session-to-session progression is usually the wrong
  granularity.
- R5's reframing of planned reduction as part of progression rather than a pause in it.
- R6 in full, including the reading of stalled progress as information rather than as a call for
  more load.

## Relationship to other standards

[Standard 20](20-recovery.md) and [Standard 21](21-rest.md) cover the half this standard depends on.
[Standard 22](22-training-volume.md) covers how much work is being progressed.
[Standard 23](23-sustainable-progression.md) covers the rate.
[Standard 17](17-baseline-fitness.md) supplies the starting point.
[Standard 24](24-pain-injury-signals.md) covers what happens when progression outruns tolerance.

## Implementation

`fitness.progression-recorded` is a `document` requirement at `partial` assurance: a detector
establishes that the plan has a non-empty `## Progression` section. Whether the progression described
there is safe is `fitness.no-load-increase-without-recovery`, which is `manual-review` at `none`
assurance and reports not-evaluated without a recorded human review.

A detector cannot read a progression scheme and tell whether recovery is adequate for it — that
depends on the person, their history, and everything outside the plan.
