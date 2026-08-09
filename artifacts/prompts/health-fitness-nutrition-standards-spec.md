<!--
DERIVED SPECIFICATION. Provenance, stated in the document rather than in a commit message.

This document is derived from two sources, both committed verbatim alongside it:

  * artifacts/prompts/original-prompt.md — what the standards must cover
  * artifacts/prompts/design-brief.md    — what kind of system this repository must be

THOSE ARE THE HIGHER-FIDELITY COPIES. Where this document and a source disagree, the source wins and
this document is the defect. See ADR 0004 for why a derived document exists at all: the inventory
guard needs a numbered series to extract, and editing the sources into numbered form would destroy
the thing the guards exist to protect.

How this document was derived:

  1. Every "Cover:" bullet in original-prompt.md is promoted to a bare `N. Title` line, title-cased,
     with the order preserved within each section.

  2. Items 1-3 are HOISTED. In original-prompt.md the wellness-versus-medical sentence appears near
     the top, and the trend-over-event and safety-and-escalation sections appear AFTER the domain
     bullets. They are placed first here because every domain standard depends on them: the
     wellness/medical boundary is the scope every other standard operates inside, and the
     trend-over-event principle and the escalation tiers are cited throughout. The hoist is a
     deliberate editorial decision, recorded here rather than left to inference.

  3. The two bare `hydration` bullets — one in the fitness list, one in the nutrition list — are
     disambiguated as `Hydration (Fitness)` and `Hydration (Nutrition)`. They are different topics
     with identical source text, and a numbered series cannot carry two items with the same name.

  4. Item 42, Standards Integrity, is sourced from the design brief's "Standards integrity invariant"
     section rather than from original-prompt.md.

  5. The three must-never lists, the trend-over-event blockquote, and the integrity invariant
     paragraph are reproduced BYTE-VERBATIM and UNNUMBERED. Unnumbered is not incidental: must-never
     lines are prohibitions, which are rules rather than standards. Numbering them would put 34
     spurious entries into the extracted series and corrupt the inventory comparison. They appear
     here so that standards quoting them can be checked by scripts/fidelity.mjs.

The canonical enumeration of this series — how many standards exist and what they are called — is
artifacts/standards-source-inventory.json, which is human-reviewed and never regenerated from a run.
Extraction from this document is tested AGAINST that file.
-->

# Health, Fitness, Exercise, and Nutrition Standards — Specification

This specification governs personal health analysis, fitness planning, exercise interpretation,
nutrition guidance, wellness tracking, and recommendations involving physiological measurements.

## Foundations

1. Wellness Guidance vs Medical Assessment
2. Trend-over-Event Principle
3. Safety and Escalation Tiers

## Health standards

4. Symptom Context
5. Physiological Measurements
6. Measurement Quality
7. Individual Baseline
8. Trends
9. Medications Where Relevant
10. Known Contextual Factors
11. Uncertainty
12. Red Flags
13. Appropriate Escalation
14. Evidence Quality
15. Limits of Interpretation

## Fitness standards

16. Goals
17. Baseline Fitness
18. Progressive Overload
19. Exercise Intensity
20. Recovery
21. Rest
22. Training Volume
23. Sustainable Progression
24. Pain/Injury Signals
25. Cardiovascular Conditioning
26. Strength
27. Mobility Where Relevant
28. Sleep
29. Hydration (Fitness)
30. Adherence
31. Trend-Based Progress

## Nutrition standards

32. Energy Balance
33. Sustainable Calorie Changes
34. Protein
35. Fiber
36. Micronutrient Adequacy
37. Dietary Quality
38. Hydration (Nutrition)
39. Goal Compatibility
40. Sustainability
41. Dietary Restrictions/Context Where Known

## Standards system

42. Standards Integrity

## Must-never health rules

Never:

* diagnose a condition solely from one consumer measurement
* treat a single reading as a long-term trend
* ignore measurement quality
* fabricate medical facts
* fabricate health measurements
* provide false reassurance when serious warning signs are present
* catastrophize ordinary measurements without supporting evidence
* claim certainty where multiple explanations are possible
* tell someone to ignore serious symptoms
* treat wearable measurements as perfectly accurate
* infer causation solely from correlation in personal health data
* silently ignore medications or contextual factors known to materially affect interpretation
* substitute generalized population averages for known individual baseline without acknowledging the difference

## Must-never fitness rules

Never:

* recommend training through sharp/significant injury pain
* increase training load indefinitely without recovery
* treat maximum effort as inherently superior
* judge fitness from one workout
* treat heart rate alone as a complete measure of exercise quality
* prescribe intensity without considering baseline/context
* encourage unsafe progression solely to hit a target
* equate soreness with workout effectiveness
* equate exhaustion with workout quality
* punish missed workouts with excessive compensatory exercise
* recommend extreme exercise volumes merely for faster results

## Must-never nutrition rules

Never:

* recommend crash dieting
* recommend starvation-level approaches
* moralize food as evidence of personal virtue/failure
* claim a single food causes or cures complex disease without strong evidence
* recommend extreme restriction without appropriate justification
* treat short-term scale changes as equivalent to fat gain/loss
* ignore nutritional adequacy in pursuit of calorie reduction
* fabricate calorie/macronutrient values when they are unknown
* promise exact weight-loss rates
* assume every individual responds identically to a diet

## Trend-over-event principle

Where appropriate encode:

> Individual observations inform decisions; trends establish patterns.

A single workout, heart-rate reading, meal, body-weight measurement, or bad day should generally not redefine the entire plan.

## Safety and escalation

Create standards identifying situations where ordinary fitness/wellness guidance is insufficient and appropriate professional or emergency evaluation should be considered.

These rules must not create alarmism.

The system should distinguish:

* normal variation
* something worth monitoring
* something worth discussing with a professional
* potentially urgent warning signs

## Standards integrity invariant

> A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or manipulate a standard, test, applicability determination, evidence requirement, or verification mechanism solely because it prevents the desired implementation or conclusion.

## Deliverables

Implement:

* health standards
* fitness standards
* nutrition standards
* must-never rules
* applicability
* evidence requirements
* verification where appropriate
* tests
* documentation
* examples

Clearly identify which standards are mechanically verifiable versus judgment-based.

Run all validation and report results.
