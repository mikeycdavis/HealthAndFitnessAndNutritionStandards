#!/usr/bin/env bash
#
# Run the complete CI pipeline in an ephemeral Docker container. Exit 0 only if every stage passed.
#
# This script is a wrapper and deliberately contains no pipeline logic. The stages live in
# ci/run-checks.sh, which is what actually runs — here and on GitHub — so there is one definition of
# what "CI passes" means rather than two that agree until the day they matter.
#
# Nothing here depends on the developer's machine beyond Docker, git, and a shell. In particular it
# does not depend on the developer's Node: the container pins the version the enforcement surface
# pins, which is the whole reason a local run is worth trusting.
#
# Usage:
#   ci/ci.sh [--keep-on-failure] [--verbose] [--node <version>]
#
#   --keep-on-failure   leave the failed container in place for `docker exec` inspection
#   --verbose           echo the docker commands as they are issued
#   --node <version>    build against a different Node major (default 20, matching the workflow)

set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

keep_on_failure=0
verbose=0
node_version="${CI_NODE_VERSION:-20}"

while [ $# -gt 0 ]; do
  case "$1" in
    --keep-on-failure) keep_on_failure=1 ;;
    --verbose) verbose=1 ;;
    --node) shift; node_version="${1:?--node needs a version}" ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'ci.sh: unknown option %s\n' "$1" >&2; exit 2 ;;
  esac
  shift
done

command -v docker >/dev/null 2>&1 || { printf 'ci.sh: Docker is required and was not found.\n' >&2; exit 2; }
docker info >/dev/null 2>&1 || { printf 'ci.sh: Docker is installed but not running.\n' >&2; exit 2; }

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
commit="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
dirty=false
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then dirty=true; fi

# Unique per run, so two runs — or two repositories using this pattern — cannot collide, and so the
# teardown below can only ever remove resources this run created. `docker compose down -p <project>`
# is scoped to the project; it is not `docker system prune`, and it must never become it.
project="hfn-ci-${commit:0:12}-$$-${RANDOM}"
image="hfn-local-ci:node${node_version}"
container="${project}-ci"

export CI_NODE_VERSION="$node_version"
export CI_IMAGE="$image"

compose() {
  [ "$verbose" -eq 1 ] && printf '+ docker compose -f compose.ci.yml -p %s %s\n' "$project" "$*" >&2
  docker compose -f compose.ci.yml -p "$project" "$@"
}

removed=0
cleanup() {
  if [ "$removed" -eq 1 ]; then return 0; fi
  removed=1
  # --volumes removes only volumes declared by THIS project. Unrelated developer containers,
  # networks, volumes, and databases are outside its reach by construction.
  compose down --remove-orphans --volumes --timeout 5 >/dev/null 2>&1 || true
  docker rm --force "$container" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

evidence_dir="$REPO_ROOT/artifacts/local-ci"
mkdir -p "$evidence_dir"
log="$evidence_dir/last-run.log"
started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

printf 'Local CI\n'
printf '  repository : %s\n' "$REPO_ROOT"
printf '  branch     : %s\n' "$branch"
printf '  commit     : %s%s\n' "$commit" "$(if [ "$dirty" = true ]; then echo '  (working tree is dirty; the container tests the tree, not the commit)'; fi)"
printf '  image      : %s\n' "$image"
printf '  project    : %s\n\n' "$project"

compose build --quiet

set +e
if [ "$keep_on_failure" -eq 1 ]; then
  compose run --name "$container" --no-TTY ci 2>&1 | tee "$log"
else
  compose run --rm --name "$container" --no-TTY ci 2>&1 | tee "$log"
fi
status="${PIPESTATUS[0]}"
set -e

completed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
result=$([ "$status" -eq 0 ] && echo passed || echo failed)

# The stages are read back out of the runner's own output rather than re-listed here. A wrapper that
# maintains its own copy of the stage list is a wrapper that will one day report a stage that did not
# run.
stages_json="$(
  grep -o '::ci-stage:: name=[a-z-]* status=[a-z]*' "$log" 2>/dev/null \
  | sed -E 's/::ci-stage:: name=([a-z-]*) status=([a-z]*)/    { "name": "\1", "status": "\2" }/' \
  | paste -sd ',' - | sed 's/,/,\n/g'
)"

cat > "$evidence_dir/latest.json" <<JSON
{
  "schemaVersion": "1.0",
  "repository": "$(basename "$REPO_ROOT")",
  "branch": "$branch",
  "commit": "$commit",
  "workingTreeDirty": $dirty,
  "result": "$result",
  "environment": {
    "runner": "docker",
    "image": "$image",
    "network": "none",
    "pipeline": "ci/run-checks.sh"
  },
  "startedAt": "$started_at",
  "completedAt": "$completed_at",
  "checks": [
$stages_json
  ]
}
JSON

printf '\n'
if [ "$status" -eq 0 ]; then
  printf 'PASS  %s  %s  %s\n' "$branch" "$commit" "$completed_at"
  printf 'Stages: %s\n' "$(grep -o '::ci-stage:: name=[a-z-]*' "$log" | sed 's/.*name=//' | paste -sd ', ' -)"
  printf 'Evidence: artifacts/local-ci/latest.json\n'
else
  printf 'FAIL  %s  %s  (exit %s)\n' "$branch" "$commit" "$status"
  printf 'Log: artifacts/local-ci/last-run.log\n'
  if [ "$keep_on_failure" -eq 1 ]; then
    trap - EXIT INT TERM
    removed=1
    printf 'Container kept for inspection: docker exec -it %s bash   (then: docker rm -f %s)\n' "$container" "$container"
  fi
fi

exit "$status"
