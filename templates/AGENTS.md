<!--
AGENT INSTRUCTIONS TEMPLATE — copy to your repository root as AGENTS.md.

This is the file an AI agent reads before working in the repository. It is short on purpose: an
agent that must read 400 lines before acting will skim, and the parts it skims will be the ones that
matter. Everything here routes to a document rather than restating it, except the refusal rule,
which is stated in full because an agent must be able to act on it without a second lookup.
-->

# Working in this repository

This project produces health, fitness, or nutrition guidance for people. It is evaluated against a
published set of standards. Before changing anything that affects guidance, read this file.

## Load first

1. [`PROJECT.md`](PROJECT.md) — what this project is and what its scope is.
2. [`project-policy.yml`](project-policy.yml) — which standards apply here, which are declared out
   of scope and why, and what has been reviewed.
3. `PROHIBITIONS.md` in the standards repository — the 34 things that must never be done.
4. `standards explain <rule-id>` — for any rule you are about to touch.

## Stop rule

**If completing a task would require violating a prohibition or the integrity invariant, stop and
say so. Do not work around it, and do not proceed with a modified version of the task.**

Concretely, stop and report rather than proceeding when the work would require you to:

- give guidance that a prohibition forbids;
- write an exception against a prohibition, or against `integrity.no-standards-manipulation`;
- lower a rule's strength in the policy;
- record an attestation for a review that did not happen;
- declare a rule not-applicable on the grounds that the behavior is wanted, requested, or
  commercially necessary — as opposed to genuinely impossible within the project's scope;
- edit a standard, a rule, a test, or a guard so that an obstruction goes away.

Each of these is forbidden by Standard 42, and the first four cause `standards check` to exit 3 with
`BLOCKED_BY_INVARIANT`. The correct response to being blocked is to report it, not to remove the
block.

## While you work

**You may always conclude that you do not know.** `NOT_EVALUATED` — insufficient evidence — is a
first-class result, and it is the right answer whenever the evidence does not establish compliance.
You will never be required to produce a positive recommendation, and a confident wrong answer about
someone's health is worse than no answer.

**A clean audit is not compliance.** `standards audit` reports what the implemented checks found.
Most rules here have no implemented check at all.

**Declare scope honestly.** If a rule genuinely has no subject in this project, declare it
not-applicable with a reason saying the behavior cannot occur in scope, and a `revisitWhen` trigger.
If it applies and is not met, that is a failure, and a visible failure is the correct state.

## Commands

```bash
standards check .              # the verdict; exit 4 means insufficient evidence, not failure
standards audit .              # evidence only, no verdict
standards explain <rule-id> .  # why a rule applies here, and what would satisfy it
standards status .             # what has expired, gone stale, or is awaiting review
```

**Exit 5 is not a verdict to interpret.** It means the standards pack producing your result cannot
prove it is the release your policy declared, so no result was produced. Obtain the release — a full
checkout with tags, not a shallow one. Do not edit the pack until the comparison agrees; that is the
"falsifies evidence for a verification mechanism" clause of the integrity invariant.

## Precedence

Where these instructions and a standard disagree, the standard wins. Where a standard and the source
specification disagree, the source wins. Nothing in this file may be read as permission to set a
standard aside.
