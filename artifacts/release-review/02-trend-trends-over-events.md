# Evidence pack 02 — `trend.trends-over-events`

**The rule.** *Individual observations inform decisions; trends establish patterns* (Standard 2 R1,
source-verbatim).

**What the reviewer must decide.** Whether the standards consistently operationalise the principle —
**including the places where a single event legitimately overrides trend-based reasoning.** A
framework that applied the principle without exception would be wrong in the case where it matters
most.

---

## Material to review

| Path | What it contributes |
| --- | --- |
| `standards/02-trend-over-event.md` | The principle, what an observation may and may not support, and why |
| `standards/08-trends.md` | Health-domain application: what makes a trend, and what invalidates one |
| `standards/31-trend-based-progress.md` | Fitness application |
| `standards/32-energy-balance.md` R4–R5 | Nutrition application (body weight) |
| `standards/12-red-flags.md` R1 | **The exception**, and its justification |
| `standards/24-pain-injury-signals.md` R6 | The inverse case: accumulated minor signals read as a trend |
| `standards/29-hydration-fitness.md` R4 | A same-measurement-different-timescale case |
| `docs/examples/interpretation-worth-discussing.md` | A ten-week trend as the finding |
| `docs/examples/interpretation-potentially-urgent.md` | A single observation legitimately overriding |

## The principle, and its stated limit

Standard 2 R2 gives a table of what a single observation may and may not support. The left column
includes *"Reveal a red flag that warrants attention now"*, and the standard says of it:

> Note the exception in the left column, and note that it is narrow. A red flag is actionable on a
> single observation precisely because the cost of waiting for a trend is asymmetric. That is not a
> loophole in this standard — it is the one case where a single observation genuinely establishes that
> something needs attention.

Standard 12 R1 supplies the justification independently:

> A red flag is not an observation that is probably serious. Most are probably benign. It is an
> observation where the cost of being wrong in one direction is very much larger than in the other, so
> the decision does not turn on the probability.

**What to check:** whether the exception is drawn at the right place, whether it is stated
consistently in both standards, and whether anything else in the repository quietly relies on a
single observation without invoking it.

## The three domain applications

| Domain | Prohibition | Standard |
| --- | --- | --- |
| Health | *treat a single reading as a long-term trend* | 8 |
| Fitness | *judge fitness from one workout* | 31 |
| Nutrition | *treat short-term scale changes as equivalent to fat gain/loss* | 32 |

Standard 2 notes these are "the same error in three domains" and routes each prohibition to the
standard where a reader meets it rather than holding them centrally.

## Supporting claims a reviewer should test

Standard 2 R3 argues the principle quantitatively rather than asserting it — body weight, resting
heart rate, daily intake, and single-session performance each vary by more than the effect being
tracked. Standard 8 R1 requires a trend to carry direction, period, magnitude, **and spread**, arguing
that spread is what most reporting omits and what determines whether the trend means anything.

Standard 8 R4 names three things that quietly invalidate a trend: gaps, method changes, and selection
bias in when someone chooses to measure.

Standard 8 R6 and Standard 7 R1 together make the inverse case: a shift in the baseline itself can be
the finding, even when every value in it sits inside population normal ranges.

## Where the implementer's confidence is thinnest

1. **Standard 24 R6 runs the principle in the opposite direction** — accumulated minor niggles, none
   individually justifying a stop, read together as a pattern that load has outrun tolerance. That is
   consistent with the principle, but it is the one place where trend reasoning *increases* rather
   than decreases the urgency of a response, and a reviewer should confirm it does not conflict with
   Standard 12's single-event exception.

2. **Standard 29 R4 lets the same measurement mean two things at two timescales** — a body-weight
   change across a session is a usable fluid proxy, while the same measurement across weeks is the
   noise `nutrition.no-scale-change-as-fat-change` exists to guard against. The standard flags this
   explicitly to stop the two standards contradicting each other. **Is the distinction stated clearly
   enough to be operable, or is it a contradiction with a note attached?**

3. **The four worked interpretation records are where the principle is actually exercised**, and
   `interpretation-worth-monitoring.md` is the one to scrutinise: it declines to interpret a single
   blood-pressure reading and prescribes a measurement protocol instead. Is that the principle applied
   correctly, or an evasion of a reading that warranted a response?

4. **No detector evaluates this rule.** `trend.principle-documented` checks only that the sentence
   appears somewhere in an adopting project's documentation, which is a far weaker claim and is
   deliberately a separate rule. A reviewer should not let the presence of the weaker check colour the
   judgement on this one.

## Disposition

```text
Rule:        trend.trends-over-events
Outcome:     [ establishable | not establishable | defective ]
Reviewed:    (paths)
Findings:    (citing standard and requirement)
```
