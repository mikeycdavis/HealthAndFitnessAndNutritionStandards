# Worked examples

Fictional illustrations of what these standards look like in practice. Nobody in them is real, no
measurement in them was taken from a person, and none of it is guidance to anyone about their own
health — they exist to show the format and the reasoning.

They are also test fixtures. The suite audits several of them, so an example that stopped satisfying
the standards would fail the build rather than sitting here quietly contradicting the documents.

## The four escalation tiers

One interpretation record per tier. Read together they show what proportion sounds like — and in
particular that the tier-four record is calmer than people expect, because
[Standard 3](../../standards/03-safety-and-escalation-tiers.md) R4 requires it to be.

| | |
| --- | --- |
| [Normal variation](interpretation-normal-variation.md) | A resting heart rate that looks alarming against population ranges and is unremarkable for this person |
| [Worth monitoring](interpretation-worth-monitoring.md) | A blood pressure reading whose measurement quality is poor enough that the honest output is "measure again" |
| [Worth discussing](interpretation-worth-discussing.md) | A resting heart rate trend that has moved substantially while staying inside every population range throughout |
| [Potentially urgent](interpretation-potentially-urgent.md) | A symptom set where the cost of waiting is asymmetric, escalated on a single observation |

## Compliant and violating pairs

Each pair shows the same situation handled two ways, keyed to the prohibitions the violating version
breaks. The violating versions are plausible rather than cartoonish, which is the point: none of
them looks careless while it is being written.

| | Breaks |
| --- | --- |
| [Health interpretation](pair-health-interpretation.md) | false reassurance, unwarranted certainty, single reading as trend, wearable as ground truth |
| [Fitness guidance](pair-fitness-guidance.md) | training through pain, exhaustion as quality, punitive compensation |
| [Nutrition guidance](pair-nutrition-guidance.md) | crash dieting, food moralising, exact rate promises, fabricated values |

## Filled plans

| | |
| --- | --- |
| [Fitness plan](fitness-plan.md) | A complete plan against [`templates/fitness-plan.md`](../../templates/fitness-plan.md) |
| [Nutrition plan](nutrition-plan.md) | A complete plan against [`templates/nutrition-plan.md`](../../templates/nutrition-plan.md) |

## What these examples do not establish

That the guidance in them is clinically correct. They demonstrate the *form* the standards require —
the sections, the tier reasoning, the language discipline — and a plausible application of it. A
project adopting these standards needs its own clinical review; these examples are not a substitute
for one, and no detector reading them could tell the difference.
