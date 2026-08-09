# Standard 29 — Hydration (Fitness)

Hydration around training affects performance, recovery, and — at both extremes — safety. This
standard covers hydration in the training context; [Standard 38](38-hydration-nutrition.md) covers
it as a dietary matter.

Source: item 29 of [`artifacts/prompts/health-fitness-nutrition-standards-spec.md`](../artifacts/prompts/health-fitness-nutrition-standards-spec.md).

*The source lists `hydration` once in the fitness list and once in the nutrition list. The two are
disambiguated as items 29 and 38 in the derived specification; see
[ADR 0004](../artifacts/adr/0004-derived-numbered-spec.md).*

## Scope

Applies where a project gives guidance about fluid intake around training.

## Requirements

### R1 — Hydration needs vary enormously and are not a fixed prescription

Sweat rate varies severalfold between individuals and with heat, humidity, intensity, duration,
clothing, and acclimatisation. A single prescribed volume cannot be right across that range, and
prescribing one is [`nutrition.no-identical-response-assumption`](../PROHIBITIONS.md)'s error in the
training domain.

Useful guidance is proportionate to conditions and duration, and gives the person a way to judge for
themselves.

### R2 — Both directions are hazards

Dehydration impairs performance and thermoregulation. Overdrinking, particularly of plain water
during prolonged exercise, can produce exercise-associated hyponatraemia, which is uncommon but
serious and has been made more likely by well-meant advice to drink as much as possible.

Guidance that treats hydration as a quantity to maximise is not the safe direction. Drinking to
thirst is a reasonable default for most people and most sessions.

### R3 — Duration and conditions change what matters

Short sessions in temperate conditions rarely require any in-session strategy beyond normal daily
intake. Long or hot sessions do, and sodium becomes relevant as duration extends and sweat losses
accumulate — which is where an electrolyte strategy earns its place rather than being a default
add-on.

### R4 — Body weight change around a session is a rough fluid proxy, with caveats

Weight change across a session is dominated by fluid and is a usable rough guide to sweat losses.
Two caveats: it is an estimate rather than a measurement, and it must not be confused with the
body-weight tracking of [Standard 32](32-energy-balance.md), where the same fluid shifts are the
noise that
[`nutrition.no-scale-change-as-fat-change`](../PROHIBITIONS.md) exists to guard against.

The same measurement means different things at different timescales, and saying which is in use is
[Standard 5](05-physiological-measurements.md) R1's provenance requirement.

### R5 — Hydration status is not well measured by consumer devices

Devices and apps that report hydration status generally estimate it from intake logging or from
proxies with poor validation. Presenting such an estimate as a measurement is
[`health.no-wearable-as-ground-truth`](../PROHIBITIONS.md).

### R6 — Some presentations are medical

Signs of heat illness, confusion, collapse, or marked disorientation during or after exercise are
emergencies, not hydration coaching. This is the top tier of
[Standard 3](03-safety-and-escalation-tiers.md), and — per
[Standard 12](12-red-flags.md) R2 — such a presentation is recognised and escalated, not named.

## Additions this standard makes beyond the source

The source lists "hydration" as a bare word. Everything here is this standard's, and the choices
worth flagging:

- R2's inclusion of overdrinking. A standard that covered only dehydration would push guidance in a
  direction with a real, documented harm.
- R4's caveat, which prevents two standards in this series from contradicting each other about what a
  body-weight change means.
- R6's escalation case.

## Relationship to other standards

[Standard 38](38-hydration-nutrition.md) covers hydration as a dietary matter.
[Standard 32](32-energy-balance.md) receives R4's caveat.
[Standard 6](06-measurement-quality.md) governs R5.
[Standard 3](03-safety-and-escalation-tiers.md) and [Standard 12](12-red-flags.md) supply R6.
[Standard 41](41-dietary-restrictions-and-context.md) shares R1's individual-variation argument.

## Implementation

No rule in the catalog is bound solely to this standard. Its content is carried by the wearable
prohibition, the individual-response prohibition, and the escalation rules.

No detector evaluates hydration guidance.
