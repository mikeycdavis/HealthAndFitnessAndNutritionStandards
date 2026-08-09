# Standard 21 — Rest

Rest is the prescribed absence of training. This standard treats it as a component of the plan rather
than as the space between its components.

Source: item 21 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

## Scope

Applies to any project that plans training. It is distinguished from
[Standard 20](20-recovery.md) deliberately: recovery is the physiological process, rest is one of the
inputs to it, and a plan can provide rest days that do not produce recovery.

## Requirements

### R1 — Rest is prescribed, not residual

A rest day appears in the plan as a rest day. The alternative — training days scheduled and whatever
is left over being rest — means rest is defined by the absence of a decision, and it disappears
whenever the schedule is under pressure.

### R2 — Rest operates at several scales

| Scale | Form |
| --- | --- |
| Within a session | Inter-set and inter-interval rest, which determines what the session trains |
| Between sessions | Time and spacing between stimuli to the same tissues or qualities |
| Within a week | Full rest days, and easy days that are genuinely easy |
| Within a block | A planned deload or lighter week |
| Within a year | Extended off-periods, particularly after a competitive season or a long build |

A plan that addresses only one scale is incomplete. The most commonly missing are the block deload
and the genuinely easy day.

### R3 — An easy day is easy

The most common way a rest provision fails is not a skipped rest day; it is an easy day performed at
moderate intensity. This removes the recovery without providing a meaningful stimulus, which is the
worst of both — and it is why intensity distribution matters
([Standard 25](25-cardiovascular-conditioning.md)).

Where a plan prescribes easy work, it should say what easy means in terms the person can apply on
the day.

### R4 — Unplanned rest is absorbed, not repaid

A missed session for illness, work, or life is rest that happened without being scheduled. The plan
resumes; it does not compensate.

This is the same principle [Standard 30](30-adherence.md) states for adherence generally, and it
carries the prohibition on punitive compensation
([`fitness.no-punitive-compensation`](../PROHIBITIONS.md)).

### R5 — Rest is not the same as inactivity

Light movement, walking, mobility work, and easy recreational activity are generally compatible with
rest from training and often support recovery. Prescribing complete inactivity where it is not needed
is both unnecessary and, for most people, harder to adhere to than a light alternative.

The exception is where rest is prescribed for a specific reason — an injury, an illness, a genuine
overreach — in which case what is being rested and why should be stated.

### R6 — Rest is defended, especially when progress is good

Rest is most likely to be dropped when someone feels well and training is going well, which is
precisely when the accumulated load is highest. A plan that treats its rest provision as conditional
on feeling tired has inverted the logic: rest is scheduled against load, not against sensation.

## Additions this standard makes beyond the source

The source names "rest" as a topic alongside "recovery" without distinguishing them. Treating rest as
an input and recovery as the process is this standard's reading, and it is what makes R3 statable —
a plan can supply rest days and produce no recovery.

R2's scales, R3's easy-day failure, R5's distinction from inactivity, and R6's observation about when
rest gets dropped are all this standard's.

## Relationship to other standards

[Standard 20](20-recovery.md) covers the process this supports.
[Standard 18](18-progressive-overload.md) R5 requires planned reductions.
[Standard 30](30-adherence.md) covers R4 and carries its prohibition.
[Standard 25](25-cardiovascular-conditioning.md) covers R3's intensity distribution.
[Standard 28](28-sleep.md) covers the other major recovery input.

## Implementation

No rule is catalogued solely against this standard. `fitness.recovery-planned` is catalogued against
[Standard 20](20-recovery.md) and checks for a `## Recovery and Rest` section, which covers both
standards' documentation requirement; `fitness.no-punitive-compensation` is catalogued against
[Standard 30](30-adherence.md) and carries R4.

This is the second standard in the series with no rule of its own — [Standard 10](10-known-contextual-factors.md)
is the other — and for the same reason: the source pairs it with a neighbour in a way that would make
two separate rules drift apart while meaning one thing. Recorded here so a reader checking coverage
does not mistake it for an omission.
