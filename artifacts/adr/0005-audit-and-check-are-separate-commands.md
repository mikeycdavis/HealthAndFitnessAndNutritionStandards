# 0005 — `audit` and `check` are separate commands

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project-owner

## Context

Two different questions get asked of a standards tool, and they are easy to mistake for one:

- *What is in this repository?* — gather evidence. Which artifacts exist, which sections are present,
  what the detectors observed. Needs no policy, produces no judgement, and is useful on a repository
  that has never adopted the standards at all.
- *Does this repository comply?* — reach a verdict. Requires a policy (which rules apply here, at what
  strength, with which waivers and attestations), and produces a status that CI can gate on.

A comparable system shipped these as one command and had to split them at its 1.0.0 release, because
every consumer had to guess which of the two it had received. The symptom was subtle: a clean run
read as "compliant" when it meant "nothing matched the patterns that happen to be implemented."

The design brief asks for `audit` and `check` as separate potential workflows, and asks that the CLI
be designed around actual workflows rather than copied. Here the two workflows are genuinely distinct
and belong to different moments: evidence gathering happens while an agent is exploring an unfamiliar
repository; the verdict happens in CI, at the point of a merge decision.

## Decision

Two subcommands, with different inputs, different outputs, and different exit-code contracts.

**`standards audit [--dir] [--json] [--strict]`** runs the detectors and emits findings. No policy is
loaded; a repository with no `project-policy.yml` audits fine. Output carries no status, no score, and
ends with the sentence "This is evidence, not a verdict." Exit `0` when the survey completed, `1` only
under `--strict` when something non-`info` was found, `2` on an invocation error.

**`standards check [--dir] [--json]`** loads the catalog, the policy, the findings, and the
attestations, and produces the verdict. Exit `0` compliant (including with exceptions), `1` evaluated
and non-compliant, `2` configuration or schema error including a missing policy, `3` blocked by
invariant (ADR 0003).

The 1-versus-2 split is the load-bearing one: `1` means the tool worked and the repository has
problems; `2` means the tool could not reach a conclusion at all. Merging them means a CI failure
cannot distinguish "your project is non-compliant" from "your policy file is malformed", which are
opposite instructions to the person reading the log.

CI gates on `check`, and runs `audit` without `--strict`. Failing a build on warnings is how the audit
step gets disabled; the real error gate is an assertion inside the test suite that this repository
produces no error-severity findings.

Both commands accept `--json` with deterministic output, so an agent can diff two runs and attribute
any difference to the project rather than to the tool.

## Alternatives considered

**One command with a `--verdict` flag.** Rejected: the flag would change the exit-code contract, which
is the part consumers encode in CI configuration. A flag that changes what an exit code means is a
second command wearing the first one's name.

**`check` implies `audit` and hides it.** Partly adopted, partly rejected — `check` does run the
detectors internally, because a verdict without evidence would be an assertion. What is rejected is
hiding `audit` as a user-facing command: the exploratory workflow is real, and it must work before a
project has any policy at all.

**A separate `standards plan` command for remediation.** Rejected. Every catalog entry and every
finding already carries `remediation`, and `status --json` enumerates what is actionable. A planner
would restate that data in a second place that could drift from the first.

## Consequences

- Adopters must understand that a clean `audit` is not compliance. The adoption guide says so
  directly, and the audit output says so on every run.
- `check` is the only CI gate. `audit` informs; it does not decide.
- Exit code 3 is unique to `check`, since only `check` reads the policy where manipulation is
  detectable.
