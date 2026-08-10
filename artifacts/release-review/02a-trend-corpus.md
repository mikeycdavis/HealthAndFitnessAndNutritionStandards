# Evidence pack 02a — corpus for `trend.trends-over-events`

Companion to [pack 02](02-trend-trends-over-events.md), and the last of the four. Built on the
pattern packs 03a, 01a, and 04a established: the pack frames, the corpus is reviewed.

**The rule.** *Individual observations inform decisions; trends establish patterns* (Standard 2 R1,
source-verbatim). Catalogued as a **requirement**, `manual-review`, `assurance: none`.

**What this review must decide.** Whether the repository operationalises the principle consistently —
**including where it correctly does not apply.** A framework that applied it without exception would
be wrong in the case that matters most, and the two places it bends are the two the reviewer named:

- **Tension A** — the cost-asymmetric single-event override (Part 3).
- **Tension B** — the same measurement carrying different meaning at different timescales (Part 4).

There is a third the reviewer did not name and which pack 02 flagged: **Tension C**, where trend
reasoning *increases* urgency rather than decreasing it (Part 5).

**A distinction that must not blur.** Two rules sit on Standard 2 and only one is under review:

| Rule | Kind | validationType | assurance | Under review |
| --- | --- | --- | --- | --- |
| `trend.trends-over-events` | requirement | `manual-review` | `none` | **yes** |
| `trend.principle-documented` | recommendation | `document` | `partial` | no |

`trend.principle-documented` checks only that the sentence appears somewhere in an adopting project's
documentation. Its `$assuranceNote` states the boundary: *"Whether decisions in the project actually
follow it is `trend.trends-over-events`, which no machine evaluates."* The presence of the weaker
check should not colour the judgement on the stronger one.

---

# Part 1 — The principle

## `standards/02-trend-over-event.md` R1 — the rule text

> Reproduced verbatim from the source:
>
> > Individual observations inform decisions; trends establish patterns.
>
> The two verbs are doing the work. An observation *informs*: it prompts a question, adds evidence,
> adjusts confidence. A trend *establishes*: it supports the claim that something is actually
> happening. Treating an observation as though it establishes something is the failure this standard
> names.

## R2 — what a single observation may and may not support

> | A single observation may | A single observation may not |
> | --- | --- |
> | Prompt a question | Establish a direction of travel |
> | Contribute to a trend | Confirm that an intervention worked |
> | Trigger a check, or a repeat measurement | Justify redefining a plan |
> | Reveal a red flag that warrants attention now | Diagnose, or rule out |
>
> The right-hand column is not a rule about caution; it is a rule about what the data can carry. One
> point has no direction, and a direction inferred from one point is invented.
>
> Note the exception in the left column, and note that it is narrow. A red flag is actionable on a
> single observation precisely because the cost of waiting for a trend is asymmetric. That is not a
> loophole in this standard — it is the one case where a single observation genuinely establishes
> that something needs attention, and Standard 12 defines its boundaries.

## R3 — the quantitative argument, not asserted but given

> The reason the principle holds is quantitative, and it is worth stating rather than asserting.
>
> - Body weight moves by more in a day, on water, glycogen, sodium, and gut contents, than a week of
>   actual fat change amounts to.
> - Resting heart rate moves on sleep, alcohol, caffeine, illness, heat, and stress, by more than
>   months of training adaptation.
> - A day's food intake varies by more than the deficit or surplus a plan is aiming at.
> - A single workout reflects sleep, food, stress, and where in the week it fell at least as much as
>   it reflects fitness.
>
> A system that reacts to each observation is converting that noise into instructions, and the person
> following them is chasing variation they cannot control.

*(All four reviewed under rule 03; C20–C23 and C40 cover the adjacent claims.)*

## R4 — the practical argument

> A plan that changes whenever a number moves is one nobody can follow, and its instability is itself
> demoralising: a bad day gets read as a loss of progress, and the response to the reading does more
> damage than the reading described.
>
> Stability is a feature. Where a change is warranted, name the trend that warrants it rather than
> the reading that prompted the question.

## R5 — say which one is being relied on

> Guidance states whether a statement rests on an observation or on a trend, and over what period.
> "Your resting heart rate was 62 this morning" and "your resting heart rate has averaged 62 over
> three weeks, up from 57" are different claims, and only the second supports acting on it.

## R6 — the principle is written down

> A project states this principle in its documentation or in the templates that shape how
> observations are recorded, so that the people and agents working in it share it rather than each
> inferring it. A principle nobody wrote down is applied inconsistently, and in a predictable
> direction: whoever is closest to the data decides in the moment how much one reading means.

*(This is `trend.principle-documented`'s requirement, not this rule's.)*

## Where Standard 2's prohibitions live, and why

> This standard's own prohibitions live in the standards for the domains they govern, because that is
> where a reader meets them: `health.no-single-reading-as-trend` in Standard 8,
> `fitness.no-fitness-judgment-from-one-workout` in Standard 31, and
> `nutrition.no-scale-change-as-fat-change` in Standard 32. All three are the same error in three
> domains.

---

# Part 2 — The three domain applications

## Health — `standards/08-trends.md`

**R1**, on what makes a trend, and the component the standard says most reporting omits:

> | **Direction** | Which way, stated |
> | **Period** | Over what span, and how many observations |
> | **Magnitude** | How much change |
> | **Spread** | How much the underlying measurement varies anyway |
>
> The last is what most reporting omits and what determines whether the trend means anything. A three
> beat-per-minute rise means one thing when the measurement varies by one beat day to day and nothing
> at all when it varies by eight.

**R2**, the prohibition, and its disguised form:

> > treat a single reading as a long-term trend
>
> One point has no direction. Presenting it as one manufactures a pattern out of noise, and the
> reader acts on a movement that may reverse tomorrow for reasons nobody recorded.
>
> The failure has a common disguise: comparing today's reading against a stored average and reporting
> the difference as a change. That is still one observation, however many were used to build the
> thing it was compared against.

**R3**, per-quantity periods:

> - **Body weight** — daily variation routinely exceeds a week of real change, so weeks, not days.
> - **Resting heart rate** — moves on sleep, alcohol, illness, heat; a week or more.
> - **Blood pressure** — multiple readings per occasion, multiple occasions, per the protocol the reference range assumes.
> - **Sleep duration** — highly variable and weekday-patterned; a week is the minimum unit and even that mixes weekday with weekend.
>
> Where the available data is too short to support a trend, the honest statement is that it is too
> short — not a trend qualified with hedging.

**R4**, what invalidates a trend:

> 1. **Gaps.** A trend across a missing month is two trends with a line drawn between them.
> 2. **Method changes.** A new device, a new measurement time, or a new protocol can produce an
>    apparent change that is entirely instrumental.
> 3. **Selection.** Measurements taken when someone felt like measuring are not a random sample of
>    their days, and the bias usually runs in the direction of the story.

**R5**, the limit on what a trend gives you:

> A trend establishes that something changed. It does not establish why, and personal health data
> rarely contains what would be needed to find out.

**R6**, the inverse — the trend as the finding:

> Where a baseline itself has shifted — a resting heart rate that has moved from 52 to 68 over two
> months, entirely within population normal ranges throughout — the shift is the observation, and it
> may be more informative than any single value in it.

## Fitness — `standards/31-trend-based-progress.md`

**R1**, the prohibition:

> > judge fitness from one workout
>
> A single session reflects sleep, food, stress, heat, illness, and where in the week it fell at
> least as much as it reflects fitness. Judging from one is the trend-over-event failure in its most
> demoralising form: a bad day is read as lost fitness, and the plan is rewritten around noise.

**R3**, the structural defence — and the sharpest sentence in the corpus on this rule:

> Fixing the cadence beforehand is what makes trend-based assessment the default. A plan reviewed
> "whenever something feels wrong" is reviewed precisely when the evidence is a single bad session,
> which guarantees the failure R1 names.

**R4**, and the trap of a single measure:

> Different qualities improve on different timescales, so a plateau in one is not a plateau overall.
> Strength can be climbing while endurance is flat, and a review that looks at one measure will
> conclude the wrong thing.

**R6**, proportionality of response:

> A plan is adjusted on the evidence of the review, and the size of the adjustment matches the size
> of the evidence. Wholesale rewrites in response to a few weeks of data destroy the continuity that
> makes progress possible, and they make the next review harder to interpret because too much changed
> at once.

## Nutrition — `standards/32-energy-balance.md`

**R4**, the prohibition and its mechanism:

> > treat short-term scale changes as equivalent to fat gain/loss
>
> Day-to-day body weight moves on water, glycogen, sodium, gut contents, and hormonal cycle —
> routinely by more than a week of actual fat change. Reading the scale as a fat measurement means
> reacting to the noise, and reacting to the noise is what leads someone to abandon an approach that
> was working.
>
> The mechanism is worth stating because it makes the failure predictable: starting a
> lower-carbohydrate approach drops glycogen and its associated water, producing a rapid initial loss
> that is largely not fat; a high-sodium meal or the start of resistance training produces an
> increase that is largely not fat either. Both are read as evidence about the diet, and both are
> wrong.

**R5**, and a claim that cuts *against* the naive reading of the principle:

> Weighing frequently and averaging is generally better than weighing rarely, provided what is read
> is the average — more data reduces the noise, but only if the individual readings are not each
> treated as a verdict.

Worth testing: this says *measure more often*, which a careless application of trend-over-event would
discourage. The standard's position is that observation frequency and interpretation frequency are
different variables. Whether that is stated clearly enough to be operable is a fair question.

---

# Part 3 — Tension A: the cost-asymmetric single-event override

Three places state it. **Check them for consistency with each other.**

## `standards/02-trend-over-event.md` R2 — stated as an exception, and bounded

> A red flag is actionable on a single observation precisely because the cost of waiting for a trend
> is asymmetric. That is not a loophole in this standard — it is the one case where a single
> observation genuinely establishes that something needs attention.

## `standards/12-red-flags.md` R1 — the independent justification

> A red flag is not an observation that is probably serious. It is an observation where the cost of
> being wrong in one direction is very much larger than in the other, so the decision does not turn
> on the probability at all — which is what makes the category work without anyone having to estimate
> one.
>
> That asymmetry is why red flags escalate on a single observation. Waiting for a trend is a
> reasonable policy when the cost of waiting is low, and it stops being reasonable exactly here.

*(Remediated at `79d39d1`: the sentence "Most are probably benign" was removed as an unnecessary
prevalence claim. The cost-asymmetry argument is unchanged and now stands without it — which, if
anything, makes the override cleaner, since it no longer rests on any probability estimate at all.)*

## `standards/03-safety-and-escalation-tiers.md` R3 — the override inside the tier procedure

> 3. **Trend versus event.** A single reading generally does not escalate past *worth monitoring*,
>    with the red-flag exception below.
> 5. **Red flags.** These escalate on a single observation, and they are the reason tier four exists.
>
> Where these inputs disagree, symptoms and red flags dominate. A reassuring number does not lower
> the tier that a worrying symptom set.

## The override exercised — `docs/examples/interpretation-potentially-urgent.md`

The record's own footnote, which is the corpus's most explicit statement of the tension:

> *Why this escalates on one observation: for most measurements a single reading supports very
> little, and this record's own reasoning reflects that — a normal heart rate here establishes
> nothing. Red flags are the exception, and the reason is asymmetry rather than probability: the cost
> of being wrong in one direction is very much larger than in the other.*

**This record changed materially at `d47e389`,** after the `escalation.tier-language-calibrated`
review found it under-escalating. It now directs emergency services immediately and unconditionally
rather than asking the reader to arrange assessment "today". Relevant here because **the exception
now fires harder than it did when pack 02 was written**: whatever a reviewer concludes about the
override's boundaries, they should assess it against the current record.

**What to test.** Whether the exception is drawn at the right place; whether the three statements
agree; and — the question pack 02 raised — whether anything else in the repository quietly relies on
a single observation *without* invoking the exception.

---

# Part 4 — Tension B: the same measurement at two timescales

## `standards/29-hydration-fitness.md` R4 — body weight as a within-session fluid proxy

> ### R4 — Body weight change around a session is a rough fluid proxy, with caveats
>
> Weight change across a session is dominated by fluid and is a usable rough guide to sweat losses.
> Two caveats: it is an estimate rather than a measurement, and it must not be confused with the
> body-weight tracking of [Standard 32](32-energy-balance.md), where the same fluid shifts are the
> noise that `nutrition.no-scale-change-as-fat-change` exists to guard against.
>
> The same measurement means different things at different timescales, and saying which is in use is
> [Standard 5](05-physiological-measurements.md) R1's provenance requirement.

## The other side — `standards/32-energy-balance.md` R5

> Body weight is interpreted over weeks, using a rolling average rather than individual readings, and
> compared against the person's own history.

## And Standard 32's own acknowledgement, in its Relationship section

> [Standard 29](29-hydration-fitness.md) R4 covers the case where a short-term weight change *is* the
> intended measurement.

## Standard 29's Additions section, claiming the caveat deliberately

> - R4's caveat, which prevents two standards in this series from contradicting each other about what
>   a body-weight change means.

**The question, as pack 02 put it:** *Is the distinction stated clearly enough to be operable, or is
it a contradiction with a note attached?*

The repository's position is that the two uses differ in **what is being measured**, not merely in
timescale: within a session, fluid loss is the signal and is measured directly; across weeks, fluid
is the noise obscuring a different signal. Both standards cross-reference each other explicitly and
Standard 5 R1's provenance requirement is invoked to force the disambiguation into the record. A
reviewer should test whether that is a genuine distinction or a well-documented collision.

---

# Part 5 — Tension C: where the trend increases urgency

The principle usually *slows* a response. In two places it accelerates one. Pack 02 flagged the first.

## `standards/24-pain-injury-signals.md` R6

> Recurring niggles that individually never justify stopping are one of the clearest signs that load
> has outrun tolerance ([Standard 20](20-recovery.md) R5). Each in isolation is unremarkable, which is
> why they need to be read together — an application of [Standard 2](02-trend-over-event.md) in the
> direction where the trend is the warning.

## `standards/20-recovery.md` R5 — the same structure

> Read together rather than individually, and none is diagnostic alone:
>
> - performance stalling or declining under unchanged or increased load;
> - resting heart rate elevated relative to the person's own baseline;
> - sleep worsening despite adequate opportunity;
> - persistent, unusual fatigue; irritability; loss of motivation;
> - minor niggles accumulating;
> - frequent minor illness.

## And `standards/08-trends.md` R6, in the health domain

The shifted baseline as the finding — quoted in Part 2. Same structure: individually unremarkable
values, collectively the observation.

**What to test.** Whether Tension C is consistent with Tension A or in conflict with it. The two
appear to run opposite ways — one says a single event can override a trend, the other says a trend
can be built from non-events — and a reviewer should confirm they are complements rather than a
contradiction. The repository's implicit position is that both follow from the same rule about *what
the data can carry*, and neither is an exception to it.

---

# Part 6 — Everywhere else the principle is operationalised

Assembled so the review can test consistency across the whole corpus, not only the flagged places.

| Location | How it applies the principle |
| --- | --- |
| `standards/07-individual-baseline.md` R2 | "A baseline states what is typical *and* how much it varies, over a stated period, under stated conditions. 'Resting heart rate 52' is not a baseline" |
| `standards/07` R3 | Baselines age and shift legitimately; a stale one produces false findings in both directions |
| `standards/28-sleep.md` R4 | "One bad night is a bad night. Sleep varies substantially with day of week, travel, illness, alcohol… Patterns over weeks support considerably more" |
| `standards/23-sustainable-progression.md` R4 | Progress is fastest at the start and slows — so a rate measured early does not extrapolate |
| `standards/30-adherence.md` R6 | Adherence is measured the same way as progress: over a period, not from the last week |
| `standards/39-goal-compatibility.md` R5 | Compatibility is re-examined as the plan progresses, because the trade-offs shift |
| `standards/15-limits-of-interpretation.md` R1 | "Days are not independent observations; consecutive days share almost everything" — the statistical basis for why n is smaller than it looks |
| `standards/06-measurement-quality.md` R3 | "their *trends* often carry real signal even where their absolute values do not" — the principle applied to instrument error |
| `standards/13-appropriate-escalation.md` R6 | A tier is revisited when inputs change, rather than inherited |
| `templates/interpretation-record.md` | `## Baseline` heading, which is where a record states what the observation is read against |
| `templates/fitness-plan.md` | `## Review Cadence` heading — R3's structural defence, made part of the artifact |

---

# Part 7 — The principle exercised in the worked records

## `docs/examples/interpretation-worth-discussing.md` — the trend *is* the finding

Ten weekly means, 52 → 68 bpm, each within population normal ranges throughout. The record states:

> Moderate. The trend itself is not in doubt — ten weeks, consistent method, a magnitude several
> times the within-week variation. What it reflects is genuinely open.

and

> The series matters more than the current value. A clinician looking only at 68 bpm sees a normal
> resting heart rate; the informative thing is that it used to be 52 and moved.

It also declines the causal inference the trend invites:

> Note what this evidence cannot support: the timing of the work project and the rise are associated,
> and that association does not establish a cause. Several candidates started within weeks of each
> other.

This is the cleanest positive exercise of the rule in the repository. It carries direction, period,
magnitude, and spread (Standard 8 R1's four components), notes method consistency (R4), and separates
description from explanation (R5).

## `docs/examples/interpretation-worth-monitoring.md` — declining to interpret a single reading

Pack 02 §3 asks whether this is the principle applied correctly or an evasion. The record's position:

> Not because the number is reassuring — it is not — but because this measurement cannot support a
> conclusion, and the right next step is a better measurement rather than an interpretation of a poor
> one.

**This record also changed at `d47e389`.** The `escalation.tier-language-calibrated` review found
that it implied professional contact should wait for the monitoring series to finish. It now reads:

> **If properly taken readings stay around this level, contact a health professional at that point —
> do not wait for the monitoring period to finish.** […] The purpose of the series is to establish
> whether they are real, not to postpone the conversation.

Relevant to this review because it bears directly on the question pack 02 asked. The record no longer
uses "we need a trend" as a reason to defer action — which is arguably the sharpest available test of
whether the trend principle is being applied or hidden behind.

## `docs/examples/interpretation-normal-variation.md` — a trend supporting a negative conclusion

> Fourteen-day average: 48 bpm. Range over that period: 45–52 bpm.
> […] This person's own resting heart rate has averaged 46–50 bpm across eighteen months of recorded
> data, with no trend.

The principle used to *establish* stability rather than to defer a conclusion. Worth including
because a rule about not over-reading single observations could be misapplied into never concluding
anything.

---

# Where the implementer's confidence is thinnest

1. **Tension B may be a collision rather than a distinction** (Part 4). It is the one place two
   standards say opposite things about the same measurement, and the defence is a cross-reference.
2. **Tension A and Tension C run in opposite directions** (Parts 3 and 5), and the repository asserts
   rather than argues that both follow from one rule.
3. **Standard 32 R5 tells people to measure *more* often** (Part 2), which is the opposite of the
   naive reading of this principle. The distinction between observation frequency and interpretation
   frequency is implicit in the sentence and stated nowhere else.
4. **The two worked records that bear most on this rule were both edited at `d47e389`** for a
   different review. Neither change was made with this rule in mind, and both bear on it — a reviewer
   should read the current text, not pack 02's description of it.
5. **No detector evaluates this rule**, and the adjacent `trend.principle-documented` establishes only
   that a sentence appears somewhere. The two are deliberately separate rules so the weaker cannot
   stand in for the stronger.

## Disposition

```text
Rule:        trend.trends-over-events
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (citing standard and requirement)
```
