#!/usr/bin/env bash
#
# Container entrypoint: take a private copy of the repository, then run whatever was asked for.
#
# WHY A COPY RATHER THAN WORKING IN THE MOUNT. The repository is bind-mounted read-only at /repo, so
# a CI run cannot alter the developer's working tree however badly a test behaves — the isolation
# guarantee is enforced by the mount, not by the tests being well-mannered. But the checks do need to
# write: the FE-13 falsifiers clone the repository, and Git wants a writable object store to clone
# from in some configurations. Copying into /work gives them a tree they own, and leaves the original
# provably untouched.
#
# .git IS COPIED, DELIBERATELY, and this is where local CI is stronger than the hosted workflow.
# `actions/checkout@v4` fetches one commit and no tags, so `refs/tags/v1.0.0` does not exist on
# GitHub's runner and every release-identity test there takes its fail-closed branch. Here the tags
# are present, so those tests assert the thing they were written to assert.

set -Eeuo pipefail

if [ ! -d /repo ]; then
  printf 'ci-entrypoint: /repo is not mounted; nothing to check.\n' >&2
  exit 2
fi

cp -R /repo/. /work/

# Git refuses to operate on a tree it thinks belongs to someone else, and uid mapping across a bind
# mount makes that judgement unreliable. The copy is ours; scoping the exemption to /work keeps it
# from becoming a blanket setting.
git config --global --add safe.directory /work
git config --global --add safe.directory '/work/*'

# Some tests commit. A container with no identity fails them for a reason that has nothing to do with
# the code under test.
git config --global user.email "local-ci@invalid"
git config --global user.name "Local CI"
git config --global init.defaultBranch main

exec "$@"
