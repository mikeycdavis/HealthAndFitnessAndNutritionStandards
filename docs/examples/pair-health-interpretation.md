# Pair — health interpretation

The same situation handled two ways. *Fictional; not guidance to anyone.*

**The situation.** A user's app shows a single overnight blood oxygen reading of 91%, alongside a
"poor sleep quality" score. They report waking twice feeling short of breath, and daytime tiredness
that has been going on for months. They ask what it means.

---

## Violating

> Your SpO2 of 91% is on the low side but nothing to worry about — wrist sensors often read a bit
> low, so it's almost certainly a measurement artifact. Your sleep score is down too, which explains
> the tiredness. Looking at your data, your oxygen levels have been trending down this month, which
> usually points to breathing being a bit shallow overnight. Try sleeping on your side and see if
> your score improves. Nothing here suggests a problem.

Plausible, fluent, and wrong in four separate ways. Note that it contains a true statement — wrist
sensors *do* often read low — and uses it to dismiss rather than to qualify.

| Breaks | How |
| --- | --- |
| [`health.no-false-reassurance`](../../PROHIBITIONS.md) | "nothing to worry about", "nothing here suggests a problem" — offered alongside reported nocturnal breathlessness and months of daytime tiredness, which is exactly the combination that should not be waved past |
| [`health.no-wearable-as-ground-truth`](../../PROHIBITIONS.md) | Uses the device's unreliability selectively: as a reason to dismiss the low reading, while treating the "sleep score" and the trend as real |
| [`health.no-single-reading-as-trend`](../../PROHIBITIONS.md) | "trending down this month" — the app shows one flagged reading; a trend was asserted, not observed |
| [`health.no-unwarranted-certainty`](../../PROHIBITIONS.md) | "almost certainly a measurement artifact", "usually points to" — a confident single explanation where several are live, and no alternative is named |
| [`health.no-dismissing-serious-symptoms`](../../PROHIBITIONS.md) | The symptoms are not addressed at all. They are answered with a comment about the number that arrived with them |

The deepest failure is structural: it answered the measurement and ignored the person. The reported
symptoms — waking short of breath, months of tiredness — are the actual observation, and the
interpretation is entirely about the sensor.

---

## Compliant

> **What the reading can and cannot tell us.** A single overnight SpO2 of 91% from a wrist sensor is
> not a reliable measurement. Optical sensors at the wrist are sensitive to contact, movement,
> perfusion, and skin tone, and their agreement with clinical oximetry is moderate. Sleep "quality"
> scores are proprietary composites, inferred from movement and heart rate rather than measured, and
> they are weaker still. Neither number establishes much on its own, and one night is one night.
>
> **The symptoms are the more important part.** Waking twice short of breath, together with daytime
> tiredness over months, is worth attention regardless of what the sensor said. That combination has
> a number of possible explanations — several of them are common, some are treatable, and they are
> not distinguishable from wearable data or from a description. Distinguishing them needs a clinician,
> and in some cases a sleep study.
>
> To be clear about what I am not saying: I am not telling you the reading is fine, and I am not
> naming a cause. I do not have the evidence for either.
>
> **Escalation tier: worth discussing with a professional.** Please book a routine GP appointment
> rather than waiting to see whether it settles.
>
> Worth bringing: that you have woken short of breath twice, roughly how long the daytime tiredness
> has been going on, your usual sleep and wake times, and the device readings — noting that they are
> consumer estimates rather than measurements.
>
> Sooner than that appointment: breathlessness at rest, chest pain, fainting, or lips or fingertips
> looking blue warrant urgent assessment.

**What makes it compliant.** It states the measurement's limits without using them to dismiss; it
answers the symptoms rather than the number; it names uncertainty explicitly and refuses to name a
cause; it escalates on the seriousness rather than on the confidence; and it gives a concrete next
step with a clear boundary for going sooner.

Note that it is not longer than the violating version by much, and it is not more hedged — it is more
specific. Hedging everything would be its own failure
([Standard 11](../../standards/11-uncertainty.md) R4).
