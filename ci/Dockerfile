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

# THE FULL IMAGE RATHER THAN -slim, AND THERE IS NO `RUN` INSTRUCTION IN THIS FILE. That is the
# point, and it cost about 800MB.
#
# git is a genuine test dependency, not a convenience: release resolution asks Git what `v1.0.0`
# designates (scripts/release-identity.mjs), materialisation checks its blob ids against
# `git hash-object` (test/release-materialisation.test.mjs), and the FE-13 falsifiers clone this
# repository to build a pack whose labels agree and whose bytes do not. Without it those tests would
# take their fail-closed branch and assert far less than they appear to.
#
# This file used to install it with `apt-get` onto `-slim`, which meant the build needed a network
# even though the run did not — so `network_mode: none` described execution while the build beside it
# ran unconstrained. A review caught that the claim was broader than the mechanism. `-bookworm` ships
# git 2.39 and ca-certificates already, so the install disappears, and with no `RUN` left there is
# nothing for a build-time network to be needed by: compose.ci.yml sets `network: none` on the build
# as well as the run, and the build would now fail if some future edit reintroduced a fetch.
#
# Nothing else is installed. A CI image that accumulates tools accumulates the ability to depend on
# them.
FROM node:${NODE_VERSION}-bookworm

# The build context is `ci/` — not the repository — so this is the only file it can see, and the
# checkout cannot be baked into a layer. The repository arrives at runtime, read-only, in a container
# that has no network. See ci/.dockerignore, which narrows even that.
COPY --chmod=0755 entrypoint.sh /usr/local/bin/ci-entrypoint

# The `node` image ships an unprivileged `node` user. CI is untrusted code execution — it runs
# whatever the branch says — so it does not run as root, and the container is given no network, no
# Docker socket, and one read-only bind mount of the repository.
USER node
WORKDIR /work

ENTRYPOINT ["ci-entrypoint"]
# Invoked through bash rather than relying on the executable bit: the repository is checked out on
# Windows as often as not, and a bind-mounted tree's modes are whatever the Docker host decides.
CMD ["bash", "ci/run-checks.sh"]
