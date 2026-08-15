# The CI environment, and nothing else.
#
# WHY AN IMAGE AT ALL for a repository with zero dependencies: because "it passes on my machine" and
# "it passes where it is enforced" were demonstrably different things here. The test invocation in
# package.json had never once run in CI — `node --test "test/*.test.mjs"` needs Node 21 for glob
# expansion and the workflow pins Node 20 — and it went unnoticed for the whole of the 1.0.0 build
# because every local run used Node 24. This image pins the version the enforcement surface uses, so
# a developer's Node is no longer part of the answer.
#
# NODE_VERSION is an argument rather than a literal so that the CI matrix recorded as ST-11 can be
# added by varying it, without redesigning anything.
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bookworm-slim

# git is a genuine test dependency, not a convenience: release resolution asks Git what `v1.0.0`
# designates (scripts/release-identity.mjs), materialisation checks its blob ids against
# `git hash-object` (test/release-materialisation.test.mjs), and the FE-13 falsifiers clone this
# repository to build a pack whose labels agree and whose bytes do not. Without it those tests would
# take their fail-closed branch and assert far less than they appear to.
#
# Nothing else is installed. A CI image that accumulates tools accumulates the ability to depend on
# them.
RUN apt-get update \
 && apt-get install --yes --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY --chmod=0755 ci/entrypoint.sh /usr/local/bin/ci-entrypoint

# The `node` image ships an unprivileged `node` user. CI is untrusted code execution — it runs
# whatever the branch says — so it does not run as root, and the container is given no network, no
# Docker socket, and one read-only bind mount of the repository.
USER node
WORKDIR /work

ENTRYPOINT ["ci-entrypoint"]
# Invoked through bash rather than relying on the executable bit: the repository is checked out on
# Windows as often as not, and a bind-mounted tree's modes are whatever the Docker host decides.
CMD ["bash", "ci/run-checks.sh"]
