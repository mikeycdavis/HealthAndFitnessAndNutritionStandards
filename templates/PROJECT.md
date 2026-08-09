<!--
PROJECT MANIFEST TEMPLATE — copy to your repository root as PROJECT.md.

This is the orientation document a person or an agent reads first. Keep it short and true; a
manifest that has drifted from the project is worse than none, because it is believed.

The Scope section is not optional decoration. escalation.scope-disclosed looks for a plain statement
that this produces general wellness guidance rather than medical assessment, and a reader who
believes they have been assessed acts differently from one who knows they have been given general
information.
-->

# <Project name>

## Purpose

<What this project does, in two or three sentences.>

## Scope

<Required. State plainly what kind of guidance this produces.

For example: "This application provides general wellness and fitness information. It does not
diagnose conditions, does not provide medical assessment, and is not a substitute for evaluation by
a qualified clinician."

Say what it IS useful for as well as what it is not. A statement that only disclaims teaches a
reader to skip it.>

## Standards

This project is evaluated against the health, fitness, and nutrition standards, version
`<X.Y.Z>`, declared in [`project-policy.yml`](project-policy.yml).

```bash
standards check .
```

Expect `NOT_EVALUATED` until a human has reviewed the prohibitions and that review is recorded as an
attestation. Nothing failing is not evidence that anything passed.

## Domains

<Which of health, fitness, and nutrition guidance this project produces. Where it produces only some,
the rules for the others are declared not-applicable in the policy, each with a reason stating that
the behavior cannot occur here.>

## Stack

<Languages, frameworks, and how to run it.>

## Commands

<The commands someone needs: build, test, run, and the standards commands above.>

## Where things live

| | |
| --- | --- |
| `project-policy.yml` | What applies here, what is waived, what has been reviewed |
| `artifacts/interpretations/` | Health interpretation records |
| `artifacts/fitness-plan.md` | The training plan |
| `artifacts/nutrition-plan.md` | The nutrition plan |
| `docs/escalation-tiers.md` | The four-tier escalation model this project uses |
| `artifacts/adr/` | Architecture decision records |

## Current state

<What works, what does not, and what is in progress. Honest — this is the section that decays
fastest and the one most likely to mislead.>
