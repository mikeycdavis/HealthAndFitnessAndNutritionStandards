# Local CI, and verified pull requests

GitHub remains the source-control, pull-request, and review system. It is not required to prove that
a branch builds and passes its checks. The complete pipeline runs in Docker on the developer's
machine, before the branch is pushed and before the PR exists.

**The invariant this exists to enforce:**

> The commit pushed for a PR is exactly the commit that passed the complete local Docker CI pipeline.

Not "a recent commit". Not "the branch". The commit. `ci/submit-pr.*` resolves `HEAD` before CI and
again after, refuses if it moved, and pushes the verified SHA by name rather than pushing whatever
`HEAD` has become.

---

## 1. Prerequisites

| | |
| --- | --- |
| **Docker** | Required. It is the isolation boundary — everything the pipeline needs is inside it. |
| **git** | Required. It is how the workflow knows what a commit is. |
| **GitHub CLI (`gh`)** | Optional. Without it the verified commit is still pushed and you open the PR yourself; the script prints the body to paste. |
| **Node** | *Not* required to run CI. The container pins Node 20, matching the GitHub workflow. Your local Node is used only when you run `npm test` directly, and it is deliberately not what the gate consults. |

That last row is the point of containerising a repository with no dependencies. The test invocation
in `package.json` had never once run in CI — `node --test "test/*.test.mjs"` needs Node 21 for glob
expansion, the workflow pins 20, and every local run used Node 24, so the failure was invisible on
both sides for the whole of the 1.0.0 build. A local run that does not pin the version proves
something about your machine.

## 2. Running CI

```bash
.\ci\ci.ps1
```

```bash
./ci/ci.sh
```

Exit code 0 means every stage passed. Anything else means it did not, and the transcript is at
`artifacts/local-ci/last-run.log`.

| Option | Effect |
| --- | --- |
| `-KeepOnFailure` / `--keep-on-failure` | Leave the failed container in place for inspection |
| `-NodeVersion 22` / `--node 22` | Build against a different Node major |
| `-Verbose` / `--verbose` | Echo the docker commands as they are issued |

Run it as often as you like; it submits nothing.

## 3. Submitting a verified PR

```bash
.\ci\submit-pr.ps1
```

```bash
./ci/submit-pr.sh
```

```text
verify clean tree -> record SHA -> run full Docker CI -> verify same SHA -> push -> open PR
```

| Option | Effect |
| --- | --- |
| `-Draft` / `--draft` | Create the PR as a draft |
| `-Base develop` / `--base develop` | Base branch (defaults to the remote's default branch) |
| `-Title` / `--title` | PR title (defaults to the verified commit's subject) |
| `-Body` / `--body` | PR body — the evidence block is **appended** to it, never in place of it |

It refuses, pushing nothing and creating nothing, when:

- the working tree is dirty — CI verifies the tree, so an uncommitted change would be verified and
  then never pushed, which is the failure this whole arrangement exists to prevent;
- the branch is the default branch, or `HEAD` is detached;
- CI fails: `CI failed. No branch was pushed and no PR was created.`
- `HEAD` moved during verification: `HEAD changed after CI verification. The current commit has not
  been verified. Re-run CI before submitting.`
- the evidence file does not record a pass, or names a different commit — which catches a stale
  `latest.json` left over from another branch;
- the evidence records a pass over no stages, or over a stage that did not pass. A pass with an empty
  stage list is the shape a pipeline that never ran produces, and it is not a pass.

It never commits anything on your behalf to make a pipeline green.

## 4. What CI actually checks

Every stage is an existing repository command. Nothing was invented for containerisation, and nothing
that the GitHub workflow used to run was dropped. The list lives in
[`ci/run-checks.sh`](../ci/run-checks.sh) and nowhere else.

| # | Stage | Command | What it answers |
| --- | --- | --- | --- |
| 1 | `inventory` | `npm run inventory` | Has the 42-standard series changed shape? |
| 2 | `rules` | `npm run rules` | Has a rule been dropped, downgraded, or reclassified? |
| 3 | `fidelity` | `npm run fidelity` | Is quoted source text still the source's, byte for byte? |
| 4 | `policy` | `npm run policy` | Is this repository's own policy well-formed against the schema? |
| 5 | `diagrams` | `npm run diagrams` | Does each embedded diagram match its Mermaid source? |
| 6 | `tests` | `npm test` | The full `node:test` suite, including every guard's mutation test |
| 7 | `audit` | `npm run audit` | Evidence gathering — findings, not a verdict |
| 8 | `check` | `npm run check` | **The gate.** Exit 0 only; 1, 2, 3, and 4 all fail the build |

The guards run before the tests because each answers a question the tests assume. A suite passing
against a catalog that quietly lost a prohibition is a green build that means nothing.

**Categories this repository has nothing to run.** Not skipped — absent, and inventing a stage to
fill the row would be worse than the empty row:

| Category | Why there is no stage |
| --- | --- |
| Dependency restore/install | Zero third-party dependencies, by policy. There is no lockfile and no install step, and the container has no network, so the policy is now enforced by the environment rather than by a comment. |
| Formatting / linting / static analysis | No formatter or linter is configured. Adding one here would be a new repository decision, not a containerisation task. |
| Database provisioning / migrations | Nothing in this repository reads or writes a database. See §5. |
| Integration, API, frontend, E2E tests | There is no service, no HTTP surface, and no browser code. The CLI is exercised as a subprocess by the existing suite, which is the integration boundary that exists. |
| Generated-code validation | `npm run diagrams` is exactly this, and it is stage 5. |
| Security / dependency scanning | `npm audit` over zero dependencies reports nothing. The supply-chain surface is the Node base image, which is pinned by major and rebuilt each run. |

**Architecture and standards validation** is stages 1–5 and 8; it is the substance of this repository
rather than an add-on to it.

## 5. Isolation

**Databases.** This repository uses none, so CI provisions none. If one is ever introduced it belongs
in `compose.ci.yml` as a service on the project's own network with a disposable volume, seeded by the
same migration mechanism production uses, and torn down with the project. The shape is left obvious
rather than pre-built — a Postgres container that exists so the CI file resembles other CI files is a
dependency bought for appearance.

**The container gets exactly one thing from the host:** the repository, bind-mounted read-only at
`/repo`. No Docker socket, no SSH agent, no credential helper, no home directory, no host network. It
runs as the unprivileged `node` user. CI is untrusted code execution — it runs whatever the branch
says — and it is treated that way.

**`network_mode: none`.** Nothing in the pipeline needs a network, so it does not get one. A container
that cannot reach a registry cannot quietly acquire a dependency, and one running untrusted branch
code has nowhere to send anything.

**The build is isolated too, and for a while it was not.** `network_mode` governs the container. It
says nothing about the build that produces the image, and the build is branch-controlled as much as
the tests are. While the build context was the whole repository and the build had a network, a
Dockerfile could copy the checkout — `.git`, ignored files and all — into a layer, and a `RUN` could
send it somewhere. "No network" described execution and was written here as though it described CI.
That gap was found in review, not by us, and it is worth stating plainly rather than quietly closing.

Both halves are now shut, because either alone leaves it open:

| | |
| --- | --- |
| `context: ci` | The build sees the `ci/` directory, not the repository. A `COPY . /anywhere` gets one shell script. |
| `ci/.dockerignore` | Deny-by-default (`*`, then `!entrypoint.sh`) narrows even that. An exclusion list is only ever updated by someone who thought of it. |
| `network: none` on the build | A `RUN` has nowhere to send what it copied. |
| No `RUN` in `ci/Dockerfile` | Which is what makes the line above free. git and ca-certificates come from `node:20-bookworm` instead of an `apt-get` onto `-slim`. It costs about 800MB and removes the reason a build-time network existed. |

`test/local-ci.test.mjs` asserts all four, and then builds a probe image against the same context and
reads back what Docker actually handed it — the static assertions describe the configuration, and
only the probe establishes the result. The probe needs a daemon, so it runs on the host and is
reported as skipped inside the CI container.

**What this still does not give you.** Running `ci/ci.sh` on a branch executes *that branch's*
`compose.ci.yml`, `ci/Dockerfile`, and `run-checks.sh`. Nothing committed in a repository can
constrain a build configuration written by whoever you are running. The properties above hold for the
configuration as committed here; they are not a sandbox for hostile code. This is a tool for
verifying your own branch before you push it, and the honest mitigation for a branch you have not
read is to read `ci/` and `compose.ci.yml` in the diff — which the assertions above make quick,
because a change to any of them fails a named test.

**The working tree is never written to.** The entrypoint copies `/repo` to `/work` and runs there, so
the read-only mount is the guarantee rather than the tests being well-mannered. Your checkout is
provably untouched by a run — including a failing one.

**Nothing shared is destroyed.** Every run gets a unique Compose project name
(`hfn-ci-<sha>-<pid>-<random>`), and teardown is `docker compose -p <that project> down`, which is
scoped to resources this run created. It is not `docker system prune` and must never become one.

**Every name a run writes is run-scoped, not just the project.** The project name covers containers
and networks and does nothing for an image tag, and for a while every run at a given Node major built
`hfn-local-ci:node20`. Two overlapping runs both write that name, so the second build can move it
between the first run's build and its `compose run` — and the first run then executes an image built
from another checkout while reporting on its own. The tag now carries the run id, and so does the log
the stage markers are parsed out of, because two runs' markers in one stream is a run that can read a
pass it did not earn. `artifacts/local-ci/last-run.log` is written from the run's own log at the end
and remains the path to look at.

`test/local-ci.test.mjs` runs two of them at once to check this, with a barrier in the stubbed build
so neither returns until both have started. Overlap that is hoped for is overlap that stops
happening.

**`.git` is copied in, deliberately**, and this is where local CI is *stronger* than the hosted
workflow. `actions/checkout@v4` fetches one commit and no tags, so `refs/tags/v1.0.0` does not exist
on GitHub's runner and every release-identity test there takes its fail-closed branch. Locally the
tags are present and those tests assert what they were written to assert.

## 6. Failures, cleanup, and debugging

Cleanup runs from a trap, so containers and networks are removed whether the pipeline passed, failed,
or you interrupted it. The evidence file and log are written in both cases — a failed run records
`"result": "failed"` and the stage it stopped at.

To keep a failed container and look inside it:

```bash
./ci/ci.sh --keep-on-failure
```

```bash
docker exec -it <the container name it printed> bash
docker rm -f <the container name it printed>
```

Inside, `/work` is the copy that was tested and `/repo` is your read-only checkout. To reproduce one
stage by hand: `cd /work && npm run fidelity`.

If a stage passes locally and fails on GitHub, the difference is almost always the checkout depth
(§5) rather than the code.

## 7. Local CI and GitHub Actions

```text
              ci/run-checks.sh            <- the authoritative pipeline
                 /          \
      ci/ci.ps1 | ci/ci.sh   .github/workflows/ci.yml
      (Docker, local)        (GitHub-hosted, ubuntu-latest)
```

There is one definition of what "CI passes" means. The workflow invokes `ci/run-checks.sh`; it does
not restate the stages, and a test asserts that it does not — two definitions of a pipeline agree
until the day they matter.

The workflow was **not** deleted. It is a second opinion, and it is deliberately able to run on its
own. It is also not required: local Docker verification is the gate, and `ci/submit-pr.*` refuses to
push a commit that has not passed it. That matters here because GitHub-hosted Actions have been
unable to execute on this account for billing reasons, which is what a workflow that cannot run looks
like from inside a repository — no evidence either way, rather than a failure.

**A PR body produced by `submit-pr` says local Docker verification and says so explicitly.** It never
claims a GitHub Actions run happened. If you read a PR here and want to know whether Actions passed,
look at the checks tab; the body deliberately tells you nothing about it.

**A self-hosted runner later** needs no redesign: it would run `ci/ci.sh` (the same Docker pipeline)
or `ci/run-checks.sh` (the same stages) and get the same answer. Nothing here assumes it is being
invoked by a human.

## 8. Verification evidence

Each run writes `artifacts/local-ci/latest.json` — ignored by git, because a claim about a
verification committed without the verification is worse than no claim:

```json
{
  "schemaVersion": "1.0",
  "repository": "HealthAndFitnessAndNutritionStandards",
  "branch": "feature/local-docker-ci",
  "commit": "<full SHA>",
  "workingTreeDirty": false,
  "result": "passed",
  "environment": { "runner": "docker", "image": "hfn-local-ci:node20-hfn-ci-...", "network": "none", "pipeline": "ci/run-checks.sh" },
  "startedAt": "...",
  "completedAt": "...",
  "checks": [{ "name": "inventory", "status": "passed" }, "..."]
}
```

The stage list in it is read back out of the runner's own output, not re-listed by the wrapper. A
wrapper that maintains its own copy of the stage list is a wrapper that will one day report a stage
that did not run.

**A zero exit code is not what makes it a pass.** `docker compose run` reports the container's
status faithfully, and a container that never ran the pipeline exits 0 having proved nothing — a
substituted entrypoint, a swapped image, a log that stopped early. So `ci/run-checks.sh` prints
`::ci-complete:: stages=N` only after every stage has passed, and the wrapper refuses to record a
pass unless that declaration matches the passed-stage markers it actually saw. The number comes from
the runner's own stage list, so this is still one definition of the pipeline rather than two.
