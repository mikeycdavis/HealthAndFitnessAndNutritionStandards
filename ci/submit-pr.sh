#!/usr/bin/env bash
#
# Submit a pull request for a commit that has actually been verified.
#
# THE INVARIANT THIS FILE EXISTS TO ENFORCE:
#
#   The commit pushed for a PR is exactly the commit that passed the complete local Docker CI
#   pipeline.
#
# Which is why HEAD is resolved twice — once before CI and once after — and why the push names the
# verified SHA explicitly rather than pushing whatever HEAD happens to be by then. A pipeline that
# verifies one tree and pushes another is not a weaker guarantee; it is no guarantee, and it is the
# easiest possible thing to build by accident.
#
# It never commits anything, and it never pushes when verification did not pass. Making the pipeline
# green is the developer's job; this script's job is to refuse.
#
# Usage:
#   ci/submit-pr.sh [--base <branch>] [--draft] [--title <title>] [--body <text>]
#
# Environment:
#   LOCAL_CI_COMMAND   the pipeline to run (default: ci/ci.sh). Overridden by the tests so the
#                      refusal paths can be exercised without a real Docker run.
#   GH_COMMAND         the GitHub CLI to use (default: gh). Overridden by the tests so that PR
#                      creation can be asserted without contacting GitHub. Both seams exist because
#                      a submission workflow whose refusals are untested is a workflow that will be
#                      trusted to refuse and won't.

set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

base=""
draft=0
title=""
body=""

while [ $# -gt 0 ]; do
  case "$1" in
    --base) shift; base="${1:?--base needs a branch}" ;;
    --draft) draft=1 ;;
    --title) shift; title="${1:?--title needs a value}" ;;
    --body) shift; body="${1:?--body needs a value}" ;;
    -h|--help) sed -n '2,24p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'submit-pr.sh: unknown option %s\n' "$1" >&2; exit 2 ;;
  esac
  shift
done

refuse() { printf '\n%s\n' "$1" >&2; exit 1; }

# --- 1. a repository, on a branch that may hold a PR -------------------------------------------

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || refuse "Not a Git repository. Nothing was pushed and no PR was created."

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" = "HEAD" ]; then
  refuse "HEAD is detached. Check out a branch before submitting. Nothing was pushed and no PR was created."
fi

if [ -z "$base" ]; then
  # `|| true` matters: with `set -o pipefail` a repository whose origin/HEAD is not known would
  # abort the script here rather than fall through to the default.
  base="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||' || true)"
  base="${base:-main}"
fi

if [ "$branch" = "$base" ]; then
  refuse "Refusing to open a PR from '$branch' onto itself. The default branch is never a PR source. Nothing was pushed and no PR was created."
fi

# --- 2. a clean tree, so that "the commit" and "what was tested" are the same thing --------------
#
# CI containerises the working tree, not the commit, because a developer running ci.sh wants to know
# about the change in front of them. That is the right behaviour there and the wrong guarantee here:
# it is only equivalent to verifying the commit when there is nothing uncommitted. So the cleanliness
# check is not tidiness — it is what makes the CI result transferable to the SHA being pushed.

if [ -n "$(git status --porcelain)" ]; then
  printf '\nThe working tree has uncommitted changes:\n\n' >&2
  git status --short >&2
  refuse "Refusing to submit: CI verifies the working tree, so an uncommitted change would be verified and never pushed. Commit or stash first. Nothing was pushed and no PR was created."
fi

# --- 3. the SHA, before ------------------------------------------------------------------------

sha_before="$(git rev-parse HEAD)"

printf 'Submitting a verified PR\n'
printf '  branch : %s -> %s\n' "$branch" "$base"
printf '  commit : %s\n\n' "$sha_before"

# --- 4. the pipeline ---------------------------------------------------------------------------

ci_command="${LOCAL_CI_COMMAND:-$REPO_ROOT/ci/ci.sh}"
if ! ( eval "$ci_command" ); then
  refuse "CI failed. No branch was pushed and no PR was created."
fi

# --- 5. the SHA, after -------------------------------------------------------------------------

sha_after="$(git rev-parse HEAD)"
if [ "$sha_after" != "$sha_before" ]; then
  printf '\n  verified : %s\n  current  : %s\n' "$sha_before" "$sha_after" >&2
  refuse "HEAD changed after CI verification. The current commit has not been verified. Re-run CI before submitting. Nothing was pushed and no PR was created."
fi

if [ -n "$(git status --porcelain)" ]; then
  refuse "The working tree became dirty during CI verification. The current state has not been verified. Nothing was pushed and no PR was created."
fi

# --- 6. the evidence must name this commit ------------------------------------------------------
#
# The SHA comparison proves HEAD did not move. This proves the run that passed was a run of *this*
# commit — a stale latest.json from an earlier branch would otherwise satisfy every check above.

evidence="$REPO_ROOT/artifacts/local-ci/latest.json"
[ -f "$evidence" ] || refuse "CI produced no evidence file at artifacts/local-ci/latest.json. Nothing was pushed and no PR was created."

evidence_commit="$(sed -n 's/.*"commit"[[:space:]]*:[[:space:]]*"\([0-9a-f]*\)".*/\1/p' "$evidence" | head -1)"
evidence_result="$(sed -n 's/.*"result"[[:space:]]*:[[:space:]]*"\([a-z]*\)".*/\1/p' "$evidence" | head -1)"

[ "$evidence_result" = "passed" ] || refuse "The CI evidence does not record a pass (result: ${evidence_result:-missing}). Nothing was pushed and no PR was created."
[ "$evidence_commit" = "$sha_after" ] || refuse "The CI evidence names commit ${evidence_commit:-none}, not $sha_after. That run verified a different commit. Nothing was pushed and no PR was created."

# --- 7. push exactly what was verified ----------------------------------------------------------

printf '\nPushing the verified commit %s to origin/%s\n' "$sha_after" "$branch"
git push origin "${sha_after}:refs/heads/${branch}"
git branch --set-upstream-to="origin/${branch}" "$branch" >/dev/null 2>&1 || true

# --- 8. the PR ----------------------------------------------------------------------------------

[ -n "$title" ] || title="$(git log -1 --pretty=%s)"
[ -n "$body" ] || body="$(git log -1 --pretty=%b)"

# The stages the evidence says ran, not the stages the pipeline is configured to run. If those two
# ever differ, the PR body should show what happened rather than what was intended.
stages="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([a-z-]*\)".*/\1/p' "$evidence" | paste -sd ',' - | sed 's/,/, /g')"
verified_at="$(sed -n 's/.*"completedAt"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$evidence" | head -1)"

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT
{
  printf '%s\n' "$body"
  printf '\n---\n\n## Local CI\n\n'
  printf '| | |\n|---|---|\n'
  printf '| Verified commit | `%s` |\n' "$sha_after"
  printf '| Result | **PASS** |\n'
  printf '| Environment | Docker, no network, `ci/run-checks.sh` |\n'
  printf '| Stages | %s |\n' "$stages"
  printf '| Completed | %s |\n' "$verified_at"
  printf '\nVerified locally in an ephemeral Docker container, not by a GitHub-hosted Actions run.\n'
  printf 'This says nothing about whether GitHub Actions has run or passed for this commit.\n'
} > "$body_file"

gh_command="${GH_COMMAND:-gh}"

if ! command -v "$gh_command" >/dev/null 2>&1; then
  printf '\nThe verified commit was pushed. GitHub CLI is not installed, so no PR was created.\n'
  printf 'Open one here, and paste the block below:\n\n'
  cat "$body_file"
  exit 0
fi

if ! "$gh_command" auth status >/dev/null 2>&1; then
  printf '\nThe verified commit was pushed. GitHub CLI is not authenticated (`gh auth login`), so no PR was created.\n'
  exit 0
fi

args=(pr create --base "$base" --head "$branch" --title "$title" --body-file "$body_file")
if [ "$draft" -eq 1 ]; then args+=(--draft); fi

"$gh_command" "${args[@]}"

printf '\nPASS  %s  verified and submitted.\n' "$sha_after"
