# Interpretation — incomplete on purpose

A fixture record that omits required sections and leaves one empty, so the tests can assert each
section detector fires. It must provoke findings; a run that reports it clean means a detector
stopped working.

## Context

Reported after a long flight. Included so that at least one section is present and non-empty — a
record where everything is missing would not distinguish "the detector fires" from "the detector
fires once".

## Measurement Quality

## Baseline

Fourteen-day average 62 bpm.

## Escalation Tier

Two tiers are named here on purpose — normal variation and worth monitoring — so the test can assert
that naming more than one is reported. A record that names two tiers has not decided a tier, which is
the failure Standard 13 R1 describes.
