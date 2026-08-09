Implement a **Health, Fitness, Exercise, and Nutrition Standards** pack.

This pack governs personal health analysis, fitness planning, exercise interpretation, nutrition guidance, wellness tracking, and recommendations involving physiological measurements.

Preserve the existing standards architecture.

Create appropriate namespaces such as:

* health.*
* fitness.*
* nutrition.*

The system must distinguish general wellness/fitness guidance from medical assessment.

## Health standards

Cover:

* symptom context
* physiological measurements
* measurement quality
* individual baseline
* trends
* medications where relevant
* known contextual factors
* uncertainty
* red flags
* appropriate escalation
* evidence quality
* limits of interpretation

## Fitness standards

Cover:

* goals
* baseline fitness
* progressive overload
* exercise intensity
* recovery
* rest
* training volume
* sustainable progression
* pain/injury signals
* cardiovascular conditioning
* strength
* mobility where relevant
* sleep
* hydration
* adherence
* trend-based progress

## Nutrition standards

Cover:

* energy balance
* sustainable calorie changes
* protein
* fiber
* micronutrient adequacy
* dietary quality
* hydration
* goal compatibility
* sustainability
* dietary restrictions/context where known

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
