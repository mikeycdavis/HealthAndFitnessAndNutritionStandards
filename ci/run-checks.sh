#!/usr/bin/env bash
#
# THE PIPELINE. This is the one authoritative definition of what "CI passes" means for this
# repository. Everything else — the Docker wrapper, the GitHub workflow, a self-hosted runner later —
# invokes this file. Nothing else enumerates the stages.
#
# That single-definition property is the point. Before this file existed the stage list lived only in
# .github/workflows/ci.yml, which meant a developer could not run the pipeline and the pipeline could
# not be run anywhere GitHub was not. Duplicating it into a second script would have produced two
# definitions that agree until the day they matter.
#
# THERE IS NO INSTALL STEP, AND THAT IS DELIBERATE. This repository has zero third-party
# dependencies; the absence of `npm ci` here is what makes that policy structural rather than
# aspirational. If an install step ever appears in this file, the dependency policy changed, and that
# change should be argued for in a commit message rather than discovered later. The containerised
# runner goes further and gives the container no network at all, so the policy is enforced by the
# environment rather than by this comment.
#
# ORDER MATTERS. The guards run before the tests because each answers a question the tests assume:
# whether the standards series still has the shape a human reviewed, whether the catalog still
# contains the rules a human reviewed, and whether quoted source text is still the source's. A test
# suite passing against a catalog that quietly lost a prohibition is a green build that means
# nothing.
#
# `check` is the gate. `audit` runs without --strict on purpose: failing a build on warnings is how
# an audit step gets disabled, and the real error gate is the assertion inside the test suite that
# this repository produces no error-severity findings.
#
# THE EXIT-4 ALLOWANCE IS GONE. It was `|| [ $? -eq 4 ]` on the final step, and it was honest while
# it lasted: four rules here could only be established by a human, none had been, and reporting
# NOT_EVALUATED was the truthful result rather than a relaxation. It was removed as part of the 1.0.0
# release mechanics, after four human attestations were recorded validly and an independent
# certification pass against 9809afc established that the verdict rests on evidence that is what it
# claims to be.
#
# Do not put it back to make a build green. If the final stage starts failing, the repository has
# stopped being able to demonstrate compliance, and that is the thing to fix. Restoring the allowance
# would convert a real signal into a permanent excuse — and it would do so on the surface an operator
# reads first, which is how the last defect in the workflow file survived from the certification
# baseline undetected.
#
# Usage:
#   ci/run-checks.sh          run every stage in order, failing on the first that fails
#   ci/run-checks.sh --list   print the stage names, one per line, and exit

set -Eeuo pipefail

# name|command|what the stage answers
STAGES=(
  "inventory|npm run inventory|Standards series (has the series changed shape?)"
  "rules|npm run rules|Rule catalog (has a rule been dropped, downgraded, or reclassified?)"
  "fidelity|npm run fidelity|Source fidelity (is quoted source text still the source's?)"
  "policy|npm run policy|Project policy (is this repository's own policy well-formed?)"
  "diagrams|npm run diagrams|Diagram freshness (does each embedded diagram match its Mermaid source?)"
  "tests|npm test|Tests"
  "audit|npm run audit|Audit this repository (evidence, not a verdict)"
  "check|npm run check|Check this repository (the gate)"
)

if [ "${1:-}" = "--list" ]; then
  for stage in "${STAGES[@]}"; do printf '%s\n' "${stage%%|*}"; done
  exit 0
fi

if [ "${1:-}" != "" ]; then
  printf 'run-checks.sh: unknown argument %s\n' "$1" >&2
  exit 2
fi

started=$(date -u +%s)
printf '\n=== %s ===\n' "$(node --version 2>/dev/null || echo 'node: not found')"
printf 'pipeline: %d stages\n' "${#STAGES[@]}"

for stage in "${STAGES[@]}"; do
  name="${stage%%|*}"
  rest="${stage#*|}"
  command="${rest%%|*}"
  description="${rest#*|}"

  printf '\n--- %s: %s\n    $ %s\n' "$name" "$description" "$command"
  stage_started=$(date -u +%s)

  # The status is captured from the command itself, not from a negated test. `if ! cmd; then $?`
  # reads the exit code of the negation, which is always 0 — so the pipeline reported the stage as
  # failed and then exited 0, and the wrapper called it a pass. That defect was in this file for
  # exactly as long as it took to run the first deliberately-failing build, which is the argument
  # for running one.
  set +e
  eval "$command"
  status=$?
  set -e

  if [ "$status" -ne 0 ]; then
    # The marker is how the wrapper reports which stages ran without re-deriving the list. A failed
    # stage is reported before the exit so the evidence records where the pipeline stopped.
    printf '::ci-stage:: name=%s status=failed seconds=%s\n' "$name" "$(( $(date -u +%s) - stage_started ))"
    printf '\nFAILED at stage %s (exit %s). Later stages did not run.\n' "$name" "$status" >&2
    exit "$status"
  fi

  printf '::ci-stage:: name=%s status=passed seconds=%s\n' "$name" "$(( $(date -u +%s) - stage_started ))"
done

printf '\nAll %d stages passed in %ss.\n' "${#STAGES[@]}" "$(( $(date -u +%s) - started ))"

# The completion marker, printed only here — after every stage passed. Exit 0 on its own does not
# distinguish "the pipeline ran and passed" from "something exited 0 without running the pipeline":
# a substituted entrypoint, an image built from another checkout, a truncated log. The wrapper checks
# this count against the passed-stage markers it actually saw and fails the run when they disagree,
# so the number comes from the stage list rather than from a second copy of it.
printf '::ci-complete:: stages=%d\n' "${#STAGES[@]}"
