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

# A pass with no stages is not a pass. ci.sh already refuses to record one — it checks the runner's
# completion marker against the stages it saw — but this is the file that decides whether a commit
# reaches a PR, and "result: passed, checks: []" is exactly the shape a pipeline that never ran
# produces. Reading the evidence for a claim rather than for a verdict costs one line.
evidence_stages="$(grep -c '"name"[[:space:]]*:' "$evidence" 2>/dev/null || true)"
if [ "${evidence_stages:-0}" -eq 0 ]; then
  refuse "The CI evidence records a pass with no stages, so nothing was actually checked. Nothing was pushed and no PR was created."
fi
if grep -q '"status"[[:space:]]*:[[:space:]]*"failed"' "$evidence"; then
  refuse "The CI evidence records a pass containing a failed stage. Nothing was pushed and no PR was created."
fi

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

# The path form handed to `gh`, which is a native Windows binary under Git Bash (ST-15).
#
# `mktemp` here is an MSYS program and answers with an MSYS path: /tmp/tmp.XXXXXX. MSYS normally
# rewrites an argument like that into a Windows path on its way to a native binary, which is why this
# worked for a long time. That rewriting is off whenever MSYS_NO_PATHCONV=1 is set — and this
# repository requires it set, because the same rewriting mangles the Docker bind mount in ci/ci.sh.
# So an operator who ran the container gate has it exported, submit-pr.sh inherits it, and gh.exe
# resolves /tmp against the filesystem root, where nothing is:
#
#   open /tmp/tmp.HuZvjSAzt5: The system cannot find the file specified.
#
# It fails AFTER the push, and what that leaves depends on which call site hit it: on `pr create`, a
# pushed branch with no pull request; on `pr edit`, a pull request that keeps its previous body, so
# its evidence block still names an earlier commit. Both exit 0. Converting here does
# not depend on that variable in either direction: the path is made native explicitly, so the CLI
# gets a form it can open whether MSYS is rewriting arguments or not. Elsewhere there is no cygpath
# and no conversion to make, and the absolute path is already the native one.
native_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf %s "$1"; fi
}

body_file="$(mktemp)"
trap 'rm -f "$body_file"' EXIT
if ! printf '%s\n' "$body" | node "$(dirname "$0")/pr-evidence.mjs" "$sha_after" "$stages" "$verified_at" > "$body_file"; then
  refuse "The verified commit was pushed, but the evidence block could not be composed. No PR body was written."
fi

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

# A branch that already has a PR is the normal case for every push after the first, and `gh pr
# create` fails on it. This used to stop here, print the block, and say "No body was rewritten" —
# which left the request asserting the FIRST commit it had ever been verified against, under a
# heading reading "Verified commit". Not a false green; a true one pinned to the wrong object, on
# the surface a reviewer reads first. It was caught in review of PR #2 and corrected by hand three
# times before this existed (ST-13).
#
# Only the machine-written region is replaced. `ci/pr-evidence.mjs` locates it by markers, keeps the
# superseded verifications, and REFUSES when the region cannot be identified — a body edited by a
# human, or written before the markers existed, is reported rather than guessed at. A refusal here is
# not a failed submission: the verified commit is already pushed and the request already points at
# it, which is the part carrying the invariant.
existing="$("$gh_command" pr view "$branch" --json url --jq .url 2>/dev/null || true)"
if [ -n "$existing" ]; then
  printf '\nA pull request already exists for %s, and now carries the verified commit:\n  %s\n' "$branch" "$existing"

  updated_body="$(mktemp)"
  refusal="$(mktemp)"
  trap 'rm -f "$body_file" "$updated_body" "$refusal"' EXIT

  # NOT KNOWING WHAT IS THERE IS THE STRONGEST REASON NOT TO WRITE. This read used to end in
  # `|| true`, which flattened a failed request into an empty string — and an empty body is a real
  # state a PR can be in, so pr-evidence.mjs correctly read it as "there is no block here" and
  # composed a fresh one. A transient GitHub read failure therefore became a `pr edit` that replaced
  # somebody's entire description with a CI table. That is the inverse of this feature's rule, and
  # worse than the staleness it was opened for: stale provenance misleads a reader, this destroys a
  # maintainer's work. So the failure is kept as a failure and nothing is composed or written.
  if ! current_body="$("$gh_command" pr view "$branch" --json body --jq .body 2>/dev/null)"; then
    printf '\nThe current body could not be read from GitHub, so nothing was rewritten: a body that\n'
    printf 'cannot be read cannot be safely replaced. The evidence for this commit, to paste yourself:\n\n'
    node "$(dirname "$0")/pr-evidence.mjs" --block-only "$sha_after" "$stages" "$verified_at"
    printf '\nPASS  %s  verified and pushed.\n' "$sha_after"
    exit 0
  fi

  if printf '%s' "$current_body" | node "$(dirname "$0")/pr-evidence.mjs" "$sha_after" "$stages" "$verified_at" > "$updated_body" 2>"$refusal"; then
    if "$gh_command" pr edit "$branch" --body-file "$(native_path "$updated_body")" >/dev/null 2>&1; then
      printf '\nThe evidence block was updated to this commit. The description above it was not touched.\n'
    else
      printf '\nThe evidence block could not be written to GitHub. The body still names an earlier commit.\n'
      printf 'Paste this in place of the stale block:\n\n'
      node "$(dirname "$0")/pr-evidence.mjs" --block-only "$sha_after" "$stages" "$verified_at"
    fi
  else
    printf '\nThe evidence block in that body was not rewritten. Reason: %s' "$(cat "$refusal")"
    printf '\nPaste this in place of the stale block:\n\n'
    node "$(dirname "$0")/pr-evidence.mjs" --block-only "$sha_after" "$stages" "$verified_at"
  fi

  printf '\nPASS  %s  verified and pushed.\n' "$sha_after"
  exit 0
fi

args=(pr create --base "$base" --head "$branch" --title "$title" --body-file "$(native_path "$body_file")")
if [ "$draft" -eq 1 ]; then args+=(--draft); fi

"$gh_command" "${args[@]}"

printf '\nPASS  %s  verified and submitted.\n' "$sha_after"
