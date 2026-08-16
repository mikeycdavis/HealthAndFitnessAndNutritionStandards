/**
 * Local Docker CI, and the verified-submission invariant.
 *
 * THE INVARIANT UNDER TEST:
 *
 *   The commit pushed for a PR is exactly the commit that passed the complete local Docker CI
 *   pipeline.
 *
 * The interesting half of a gate is not what it lets through, it is what it refuses. A submission
 * workflow whose refusals were only ever reasoned about is a workflow that will be trusted to refuse
 * and won't — and this repository has already shipped two defects that were invisible to reasoning
 * and visible only to execution. So the refusals are executed here: the real ci/submit-pr.sh, in a
 * throwaway repository with a throwaway remote, driven through each path that must not end in a
 * push.
 *
 * `LOCAL_CI_COMMAND` and `GH_COMMAND` are the two seams that make this possible without a Docker run
 * or a GitHub round trip. They exist for testability and nothing else, and their defaults are the
 * real thing.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BEGIN, END, evidenceBlock } from "../ci/pr-evidence.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFile(path.join(REPO, rel), "utf8");

/** Git Bash on Windows understands drive-letter paths with forward slashes; backslashes it eats. */
const forBash = (p) => p.replace(/\\/g, "/");

// ---------------------------------------------------------------------------------------------
// One definition of the pipeline
// ---------------------------------------------------------------------------------------------

test("every stage in the pipeline is an npm script that exists", async () => {
  const pipeline = await read("ci/run-checks.sh");
  const pkg = JSON.parse(await read("package.json"));

  const stages = [...pipeline.matchAll(/^ {2}"([a-z-]+)\|([^|]+)\|/gm)].map(([, name, command]) => ({ name, command }));
  assert.equal(stages.length, 8, "the eight stages the GitHub workflow used to enumerate");

  for (const { name, command } of stages) {
    const script = command === "npm test" ? "test" : command.replace(/^npm run /, "");
    assert.ok(pkg.scripts[script], `stage ${name} runs '${command}', which package.json does not define`);
  }

  assert.deepEqual(
    stages.map((s) => s.name),
    ["inventory", "rules", "fidelity", "policy", "diagrams", "tests", "audit", "maintain"],
    "guards, then tests, then evidence, then the gate",
  );
});

test("the wrappers invoke the pipeline and do not restate it", async () => {
  for (const rel of ["ci/ci.sh", "ci/ci.ps1", "ci/submit-pr.sh", "ci/submit-pr.ps1", "compose.ci.yml"]) {
    const text = await read(rel);
    const executable = text.split("\n").filter((l) => !/^\s*(#|<#|\.|[A-Z]{2,}|\s*$)/.test(l)).join("\n");
    for (const stage of ["npm run inventory", "npm run rules", "npm run fidelity", "npm run diagrams"]) {
      assert.ok(!executable.includes(stage), `${rel} names '${stage}' itself; the pipeline belongs in ci/run-checks.sh`);
    }
  }
});

test("--list reports exactly the stages the pipeline defines", () => {
  const r = spawnSync("bash", [forBash(path.join(REPO, "ci", "run-checks.sh")), "--list"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(
    r.stdout.trim().split(/\r?\n/),
    ["inventory", "rules", "fidelity", "policy", "diagrams", "tests", "audit", "maintain"],
  );
});

/**
 * A failing stage must fail the pipeline, with its own exit code.
 *
 * This is a regression test for a defect that shipped in the first draft of run-checks.sh and was
 * caught by the first deliberately-failing build: the stage was written as `if ! eval "$command";
 * then status=$?`, and `$?` there is the exit code of the negation, which is always 0. So the runner
 * printed "FAILED at stage fidelity", marked the stage failed, and exited 0 — and the wrapper
 * recorded a pass. A false green with a failure message printed above it is worse than either.
 *
 * Exercised against a scratch package.json rather than by breaking this repository, so it runs in
 * milliseconds and asserts the exit code as well as the fact of failing.
 */
test("a stage that fails stops the pipeline and propagates its exit code", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-pipeline-"));
  try {
    await mkdir(path.join(dir, "ci"), { recursive: true });
    await cp(path.join(REPO, "ci", "run-checks.sh"), path.join(dir, "ci", "run-checks.sh"));

    // Every stage is a no-op except the third, which exits 3 — a code this repository uses, and one
    // that a `|| true` or a swallowed status would flatten to something else.
    const scripts = Object.fromEntries(
      ["inventory", "rules", "fidelity", "policy", "diagrams", "test", "audit", "maintain"]
        .map((s) => [s, s === "fidelity" ? "exit 3" : "exit 0"]),
    );
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "scratch", scripts }, null, 2));

    const r = spawnSync("bash", [forBash(path.join(dir, "ci", "run-checks.sh"))], { cwd: dir, encoding: "utf8" });

    assert.equal(r.status, 3, "the stage's own exit code must reach the caller");
    assert.match(r.stdout, /::ci-stage:: name=fidelity status=failed/);
    assert.match(r.stderr, /FAILED at stage fidelity \(exit 3\)\. Later stages did not run\./);
    assert.ok(!/name=policy/.test(r.stdout), "no stage after the failure may run");
    assert.match(r.stdout, /name=inventory status=passed/, "stages before the failure did run");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// Isolation, asserted from the composition rather than from the README
// ---------------------------------------------------------------------------------------------

test("the CI container gets a read-only repository, no network, and nothing else", async () => {
  const compose = await read("compose.ci.yml");

  assert.match(compose, /network_mode:\s*none/, "a container that cannot reach a registry cannot acquire a dependency");
  assert.match(compose, /read_only:\s*true/, "the repository mount must not be writable by CI");
  assert.match(compose, /target:\s*\/repo/);

  // The things CI must never be handed. Each of these has been a real supply-chain incident
  // somewhere; none of them is needed to run `npm test` on a repository with no dependencies.
  for (const forbidden of ["/var/run/docker.sock", ".ssh", ".gitconfig", ".npmrc", "privileged"]) {
    assert.ok(!compose.includes(forbidden), `compose.ci.yml exposes ${forbidden} to CI`);
  }
});

test("the CI image runs as an unprivileged user and installs nothing", async () => {
  const dockerfile = await read("ci/Dockerfile");
  assert.match(dockerfile, /^USER node$/m, "CI is untrusted code execution and does not run as root");

  const instructions = dockerfile
    .split("\n")
    .filter((l) => !/^\s*(#|$)/.test(l))
    .join("\n");
  for (const tool of ["curl", "wget", "ssh", "sudo"]) {
    assert.ok(!instructions.includes(tool), `the CI image installs ${tool}, which nothing in the pipeline needs`);
  }
  assert.match(instructions, /^FROM node:\$\{NODE_VERSION\}-bookworm$/m, "git and ca-certificates come from the base image");
});

// ---------------------------------------------------------------------------------------------
// Build-time isolation
// ---------------------------------------------------------------------------------------------

/**
 * `network_mode: none` governs the container. It says nothing about the build that produces the
 * image, and the build is branch-controlled too — so while the context was the repository and the
 * build had a network, a Dockerfile could copy the checkout into a layer and a `RUN` could send it
 * somewhere. The isolation claim was about execution and was written as though it were about CI.
 *
 * Both halves are asserted, because either alone leaves the hole open: a narrow context with a
 * networked build still lets a `RUN` reach out, and a networkless build over the whole repository
 * still bakes the checkout into a layer for anyone who later runs the image.
 */
test("the image build is isolated too: a narrow context, no build network, and no RUN", async () => {
  const compose = await read("compose.ci.yml");
  const build = compose.slice(compose.indexOf("build:"), compose.indexOf("image:"));

  assert.match(build, /^\s*context:\s*ci$/m, "the build context must be ci/, not the repository");
  assert.match(build, /^\s*network:\s*none$/m, "a build with a network is a build that can exfiltrate its context");

  const dockerfile = await read("ci/Dockerfile");
  const runInstructions = dockerfile.split("\n").filter((l) => /^\s*RUN\b/.test(l));
  assert.deepEqual(runInstructions, [], "a Dockerfile with no RUN has nothing a build-time network could serve");

  // Deny-by-default. An exclusion list is only ever updated by someone who thought of it.
  const ignore = (await read("ci/.dockerignore")).split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  assert.deepEqual(ignore, ["*", "!entrypoint.sh"], "the build context is narrowed to the one file the Dockerfile copies");
});

/**
 * The executed half of the claim above: build a probe image whose Dockerfile copies the entire
 * context, and read back what it got. Static assertions describe the configuration; this one is the
 * only thing that establishes what Docker actually hands the build.
 *
 * It needs a Docker daemon, so it does not run inside the CI container — which has no Docker socket,
 * deliberately, and would be the wrong place to test this from anyway. It runs on the developer host,
 * where `ci/ci.sh` is invoked from.
 */
test("the build context really does contain only entrypoint.sh", async (t) => {
  if (spawnSync("docker", ["info"], { encoding: "utf8" }).status !== 0) {
    t.skip("no Docker daemon reachable; this assertion runs on the host, not inside the CI container");
    return;
  }

  const dir = await mkdtemp(path.join(tmpdir(), "hfn-ctx-"));
  const tag = `hfn-ci-context-probe:${process.pid}`;
  try {
    const probe = path.join(dir, "probe.Dockerfile");
    await writeFile(probe, "FROM busybox\nCOPY . /ctx\nRUN find /ctx -type f | sort\n");

    const r = spawnSync(
      "docker",
      ["build", "--network", "none", "--no-cache", "--progress", "plain", "-f", probe, "-t", tag, path.join(REPO, "ci")],
      { encoding: "utf8" },
    );
    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);

    const seen = [...`${r.stdout}\n${r.stderr}`.matchAll(/^#\d+ [\d.]+ (\/ctx\/.+)$/gm)].map(([, f]) => f.trim());
    assert.deepEqual(seen, ["/ctx/entrypoint.sh"], "anything else here is a file a malicious Dockerfile could bake into a layer");
  } finally {
    spawnSync("docker", ["image", "rm", "--force", tag], { encoding: "utf8" });
    await rm(dir, { recursive: true, force: true });
  }
});

test("verification evidence is ignored, not committed", async () => {
  const ignored = await read(".gitignore");
  assert.match(ignored, /artifacts\/local-ci/);

  const tracked = spawnSync("git", ["-C", REPO, "ls-files", "artifacts/local-ci"], { encoding: "utf8" });
  assert.equal(tracked.stdout.trim(), "", "a claim about a verification must not be committed without the verification");
});

// ---------------------------------------------------------------------------------------------
// Concurrent runs, actually overlapped
// ---------------------------------------------------------------------------------------------

/**
 * A scratch repository holding a real copy of ci/ and compose.ci.yml, plus a stub `docker` first on
 * PATH.
 *
 * The stub is what makes the concurrency question answerable at all: a real run takes a minute and
 * needs a daemon, so two of them would be a demonstration rather than a test. What matters here is
 * which names the wrapper invents and hands to Docker, and that is entirely visible from the calls
 * it makes.
 *
 * The build stub is a barrier, not a sleep. It refuses to return until every expected run has
 * entered its build, so the two runs are provably in flight at the same moment — if overlap were
 * impossible the test would time out rather than quietly pass having run them one after the other.
 */
async function ciScratch({ runs = 1 } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-ci-run-"));
  const work = path.join(dir, "work");
  const bin = path.join(dir, "bin");
  const barrier = path.join(dir, "barrier");

  await mkdir(work, { recursive: true });
  await mkdir(bin, { recursive: true });
  await mkdir(barrier, { recursive: true });

  git(work, ["init", "--quiet", "--initial-branch", "feature/concurrent"]);
  git(work, ["config", "user.email", "scratch@invalid"]);
  git(work, ["config", "user.name", "Scratch"]);
  await cp(path.join(REPO, "ci"), path.join(work, "ci"), { recursive: true });
  await cp(path.join(REPO, "compose.ci.yml"), path.join(work, "compose.ci.yml"));
  await writeFile(path.join(work, "README.md"), "A repository that exists for one assertion.\n");
  git(work, ["add", "-A"]);
  git(work, ["commit", "--quiet", "-m", "Scratch"]);

  const docker = path.join(bin, "docker");
  await writeFile(
    docker,
    [
      "#!/usr/bin/env bash",
      // Every call is recorded with the image name the wrapper exported for it. That pairing is the
      // whole question: did this run build and then run *its own* tag?
      'printf "image=%s args=%s\\n" "${CI_IMAGE:-none}" "$*" >> "$STUB_LOG"',
      'case " $* " in',
      "  *\" info \"*) exit 0 ;;",
      "  *\" build\"*)",
      // Keyed on the run id, deliberately not on the image name: the barrier has to work
      // identically whether or not the tags are unique, or it would detect the very defect this
      // test is meant to catch by deadlocking instead of by asserting.
      '    touch "$STUB_BARRIER/$STUB_RUN_ID"',
      "    for _ in $(seq 1 300); do",
      '      if [ "$(ls -1 "$STUB_BARRIER" | wc -l)" -ge "${STUB_BARRIER_N:-1}" ]; then exit 0; fi',
      "      sleep 0.05",
      "    done",
      '    printf "stub docker: the runs never overlapped\\n" >&2',
      "    exit 1",
      "    ;;",
      "  *\" run \"*)",
      '    printf "::ci-stage:: name=inventory status=passed seconds=0\\n"',
      '    printf "::ci-stage:: name=check status=passed seconds=0\\n"',
      '    printf "%s\\n" "${STUB_RUN_TAIL:-::ci-complete:: stages=2}"',
      '    exit "${STUB_RUN_STATUS:-0}"',
      "    ;;",
      "esac",
      "exit 0",
      "",
    ].join("\n"),
  );
  await chmod(docker, 0o755);

  return { dir, work, bin, barrier, runs };
}

/** Launch ci/ci.sh in a scratch repository, with the stub Docker ahead of any real one. */
function launchCi(s, { id, env = {} } = {}) {
  const child = spawn("bash", [forBash(path.join(s.work, "ci", "ci.sh"))], {
    cwd: s.work,
    env: {
      ...process.env,
      PATH: `${s.bin}${path.delimiter}${process.env.PATH}`,
      STUB_LOG: forBash(path.join(s.dir, `docker-${id}.log`)),
      STUB_RUN_ID: id,
      STUB_BARRIER: forBash(s.barrier),
      STUB_BARRIER_N: String(s.runs),
      ...env,
    },
  });

  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  return new Promise((resolve) => child.on("close", (status) => resolve({ status, out })));
}

/**
 * THE CONCURRENCY DEFECT. Unique Compose project names scope containers and networks; they do
 * nothing for an image tag. While every run at a given Node major wrote `hfn-local-ci:node20`, a
 * second build could move that name between the first run's build and its `compose run` — and the
 * first run would then execute an image built from another checkout while reporting on its own.
 *
 * Overlap is forced rather than hoped for: neither build returns until both have started.
 */
test("two overlapping runs never share an image tag, a project, or a log", async () => {
  const s = await ciScratch({ runs: 2 });
  try {
    const [a, b] = await Promise.all([launchCi(s, { id: "a" }), launchCi(s, { id: "b" })]);

    assert.equal(a.status, 0, a.out);
    assert.equal(b.status, 0, b.out);

    assert.equal(
      (await readdir(s.barrier)).length,
      2,
      "both runs must have been inside their build at the same moment, or this proves nothing about concurrency",
    );

    const calls = async (id) => (await readFile(path.join(s.dir, `docker-${id}.log`), "utf8")).trim().split(/\r?\n/);
    const [callsA, callsB] = [await calls("a"), await calls("b")];

    const imagesOf = (lines) => new Set(lines.map((l) => l.match(/^image=(\S+)/)[1]).filter((i) => i !== "none"));
    const [imagesA, imagesB] = [imagesOf(callsA), imagesOf(callsB)];

    assert.equal(imagesA.size, 1, `a run must use exactly one image tag, saw ${[...imagesA]}`);
    assert.equal(imagesB.size, 1, `a run must use exactly one image tag, saw ${[...imagesB]}`);
    assert.notDeepEqual([...imagesA], [...imagesB], "two concurrent runs must not write the same image name");

    const projectsOf = (lines) => new Set(lines.flatMap((l) => [...l.matchAll(/-p (\S+)/g)].map(([, p]) => p)));
    assert.notDeepEqual([...projectsOf(callsA)], [...projectsOf(callsB)], "project names must differ too");

    // The image each run executed is the image that run built — not whatever the name pointed at by
    // then. This is the assertion the shared tag made impossible.
    for (const [lines, images] of [[callsA, imagesA], [callsB, imagesB]]) {
      const ran = lines.find((l) => / run /.test(l));
      assert.ok(ran, "each run must have reached `compose run`");
      assert.equal(ran.match(/^image=(\S+)/)[1], [...images][0]);
    }

    // Per-run logs, because the stage markers are parsed back out of them. One shared log holding
    // two runs' markers is a run that can read a pass it did not earn.
    const logs = (await readdir(path.join(s.work, "artifacts", "local-ci"))).filter((f) => f.startsWith("run-"));
    assert.equal(logs.length, 2, "each run writes its own log");
    for (const f of logs) {
      const text = await readFile(path.join(s.work, "artifacts", "local-ci", f), "utf8");
      assert.equal([...text.matchAll(/::ci-stage::/g)].length, 2, "a run's log must hold only its own markers");
    }
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * A container that exits 0 without running the pipeline has proved nothing, and `compose run`
 * reports its status faithfully. So a zero exit code is necessary and not sufficient: the runner
 * declares how many stages it completed, and the wrapper checks that declaration against the markers
 * it actually saw. Without this, a substituted entrypoint — or an image swapped in by the tag race
 * above — yields `result: passed` over an empty stage list, which is the shape a pipeline that never
 * ran produces.
 */
test("a container that exits 0 without completing the pipeline is not a pass", async () => {
  const s = await ciScratch();
  try {
    const r = await launchCi(s, { id: "silent", env: { STUB_RUN_TAIL: "no completion marker here" } });

    assert.notEqual(r.status, 0, "an unevidenced pass must not be reported as a pass");
    assert.match(r.out, /did not report a completed pipeline/);

    const evidence = JSON.parse(await readFile(path.join(s.work, "artifacts", "local-ci", "latest.json"), "utf8"));
    assert.equal(evidence.result, "failed");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

test("a completed pipeline is recorded as a pass, with the stages it reported", async () => {
  const s = await ciScratch();
  try {
    const r = await launchCi(s, { id: "ok" });

    assert.equal(r.status, 0, r.out);
    const evidence = JSON.parse(await readFile(path.join(s.work, "artifacts", "local-ci", "latest.json"), "utf8"));
    assert.equal(evidence.result, "passed");
    assert.deepEqual(evidence.checks.map((c) => c.name), ["inventory", "check"]);
    assert.match(evidence.environment.image, /^hfn-local-ci:node20-hfn-ci-/, "the evidence records the run-scoped tag");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// The PowerShell wrapper, executed
// ---------------------------------------------------------------------------------------------

/**
 * ci.ps1 was the acknowledged untested sibling: it shares the pipeline with ci.sh but not the
 * orchestration around it, and only the bash path was ever executed by a test. That is precisely
 * where its one review finding lived — a `finally` block reading $status before any assignment
 * reached it, which under Set-StrictMode raises a second error, masks the build failure it was
 * reporting, and skips the cleanup it exists to run.
 *
 * That defect hides behind a short circuit: the guard read `$KeepOnFailure -and $status -ne 0`, and
 * with the switch absent `-and` never evaluates its right operand, so the unset variable is only
 * ever touched on the `-KeepOnFailure` path. A test that omitted the switch would pass against the
 * defect and prove nothing — which is why the build-failure case below passes it.
 *
 * A Windows developer's Docker is stubbed the same way as above. These do not run inside the CI
 * container or on the hosted runner, both of which are Linux: the file they cover is the one a
 * Windows developer invokes, and the honest place to run it is there. That is a real gap rather than
 * a tidy one — on any Linux-only machine, ci.ps1 is still covered by nothing.
 */
/**
 * Windows only, and the `win32` half of that is not incidental. PowerShell runs on Linux too — the
 * GitHub runner has it — but `ci.ps1` is the file a Windows developer invokes, `Get-Command docker`
 * resolves a `.cmd` shim there and an extensionless executable here, and the two are not the same
 * test. Running these under pwsh-on-Linux exercises a configuration nobody uses; the first version
 * of this guard checked only for pwsh and duly failed on the hosted runner.
 */
const pwsh = (() => {
  if (process.platform !== "win32") return null;
  for (const exe of ["pwsh", "powershell"]) {
    if (spawnSync(exe, ["-NoProfile", "-Command", "exit 0"], { encoding: "utf8" }).status === 0) return exe;
  }
  return null;
})();

/**
 * A scratch repository with a stub `docker.cmd`, which is what `Get-Command docker` resolves on
 * Windows. The dispatch lives in a .ps1 the .cmd shells out to: batch's exit codes do not survive
 * nested parenthesised blocks reliably, and a stub whose failure signal is unreliable would make
 * this test assert nothing while appearing to.
 */
async function psScratch() {
  const s = await ciScratch();
  const stub = path.join(s.bin, "docker-stub.ps1");

  await writeFile(
    stub,
    [
      "$line = $args -join ' '",
      "Add-Content -Path $env:STUB_LOG -Value $line",
      "if ($args[0] -eq 'info') { exit 0 }",
      "if ($line -match '\\bbuild\\b') {",
      "    if ($env:STUB_BUILD_FAIL -eq '1') { [Console]::Error.WriteLine('the build failed on purpose'); exit 1 }",
      "    exit 0",
      "}",
      "if ($line -match '\\brun\\b') {",
      "    Write-Output '::ci-stage:: name=inventory status=passed seconds=0'",
      "    Write-Output '::ci-stage:: name=check status=passed seconds=0'",
      "    Write-Output $env:STUB_RUN_TAIL",
      "    exit 0",
      "}",
      "exit 0",
      "",
    ].join("\n"),
  );

  await writeFile(
    path.join(s.bin, "docker.cmd"),
    ["@echo off", `${pwsh} -NoProfile -ExecutionPolicy Bypass -File "${stub}" %*`, "exit /b %ERRORLEVEL%", ""].join("\r\n"),
  );

  return s;
}

function runPs(s, env = {}, args = []) {
  const r = spawnSync(pwsh, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(s.work, "ci", "ci.ps1"), ...args], {
    cwd: s.work,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${s.bin}${path.delimiter}${process.env.PATH}`,
      STUB_LOG: path.join(s.dir, "docker-ps.log"),
      STUB_RUN_TAIL: "::ci-complete:: stages=2",
      ...env,
    },
  });
  return { ...r, out: `${r.stdout}${r.stderr}` };
}

test("ci.ps1 runs a pipeline to completion and records the same evidence shape", async (t) => {
  if (!pwsh) return t.skip("not Windows; ci.ps1 is covered where it is invoked");

  const s = await psScratch();
  try {
    const r = runPs(s);
    assert.equal(r.status, 0, r.out);

    const evidence = JSON.parse(await readFile(path.join(s.work, "artifacts", "local-ci", "latest.json"), "utf8"));
    assert.equal(evidence.result, "passed");
    assert.equal(evidence.schemaVersion, "1.0");
    assert.deepEqual(evidence.checks.map((c) => c.name), ["inventory", "check"]);
    assert.match(evidence.environment.image, /^hfn-local-ci:node20-hfn-ci-/, "the tag must be run-scoped here too");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * THE POWERSHELL DEFECT. The build fails before $status is ever assigned; the `finally` block runs
 * anyway. What must come out is the build failure and a completed cleanup — not a StrictMode
 * complaint about an unset variable standing in front of it.
 */
test("ci.ps1 reports a build failure rather than a strict-mode error, and still cleans up", async (t) => {
  if (!pwsh) return t.skip("not Windows; ci.ps1 is covered where it is invoked");

  const s = await psScratch();
  try {
    // -KeepOnFailure, because that is the only path on which the guard evaluates $status at all.
    const r = runPs(s, { STUB_BUILD_FAIL: "1" }, ["-KeepOnFailure"]);

    assert.notEqual(r.status, 0, "a failed build must fail the run");
    assert.ok(
      !/has not been set|StrictMode/i.test(r.out),
      `the unset-variable error masks the failure it is standing in front of:\n${r.out}`,
    );
    assert.match(r.out, /The CI image failed to build/);

    // Cleanup must still have happened. A `finally` that raises its own error never gets here.
    const calls = await readFile(path.join(s.dir, "docker-ps.log"), "utf8");
    assert.match(calls, /down --remove-orphans --volumes/, "teardown must run even when the build never produced anything");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

test("ci.ps1 refuses to call an unevidenced pipeline a pass", async (t) => {
  if (!pwsh) return t.skip("not Windows; ci.ps1 is covered where it is invoked");

  const s = await psScratch();
  try {
    const r = runPs(s, { STUB_RUN_TAIL: "no completion marker here" });

    assert.notEqual(r.status, 0);
    assert.match(r.out, /did not report a completed pipeline/);
    const evidence = JSON.parse(await readFile(path.join(s.work, "artifacts", "local-ci", "latest.json"), "utf8"));
    assert.equal(evidence.result, "failed");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// The submission gate, executed
// ---------------------------------------------------------------------------------------------

const git = (cwd, args) => {
  const r = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout.trim();
};

/**
 * A throwaway repository with a throwaway remote, holding a real copy of ci/.
 *
 * The scripts resolve their repository from their own location, so copying them in is what makes
 * the file under test the file that runs. Nothing here touches this repository or its remote.
 */
async function scratch() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-submit-"));
  const work = path.join(dir, "work");
  const remote = path.join(dir, "remote.git");

  await mkdir(work, { recursive: true });
  git(work, ["init", "--quiet", "--initial-branch", "feature/verified-submission"]);
  git(work, ["config", "user.email", "scratch@invalid"]);
  git(work, ["config", "user.name", "Scratch"]);

  await cp(path.join(REPO, "ci"), path.join(work, "ci"), { recursive: true });
  await cp(path.join(REPO, ".gitignore"), path.join(work, ".gitignore"));
  await writeFile(path.join(work, "README.md"), "A repository that exists for one assertion.\n");

  // A CI stub, so the refusal paths can be exercised in a second rather than a Docker build. It
  // writes the same evidence shape ci/ci.sh writes, because submit-pr checks it.
  const stub = path.join(work, "stub-ci.sh");
  await writeFile(
    stub,
    [
      "#!/usr/bin/env bash",
      "set -e",
      'if [ "${STUB_CI_FAIL:-0}" = "1" ]; then echo "stub CI failing on purpose"; exit 1; fi',
      "mkdir -p artifacts/local-ci",
      'sha="${STUB_CI_COMMIT:-$(git rev-parse HEAD)}"',
      'cat > artifacts/local-ci/latest.json <<JSON',
      "{",
      '  "commit": "$sha",',
      '  "result": "${STUB_CI_RESULT:-passed}",',
      '  "completedAt": "2026-08-15T00:00:00Z",',
      '  "checks": [ { "name": "tests", "status": "passed" } ]',
      "}",
      "JSON",
      // The mutation the invariant exists to catch: a commit lands after CI verified the tree.
      'if [ "${STUB_CI_MUTATE:-0}" = "1" ]; then',
      '  echo "a change nobody verified" >> README.md',
      "  git add -A && git commit --quiet -m 'An unverified commit that arrived during CI'",
      "fi",
      "exit 0",
      "",
    ].join("\n"),
  );
  await chmod(stub, 0o755);

  // A gh stub, so PR creation is asserted without contacting GitHub.
  const gh = path.join(work, "gh-stub.sh");
  await writeFile(
    gh,
    [
      "#!/usr/bin/env bash",
      'if [ "$1" = "auth" ]; then exit 0; fi',
      // `pr view` answers "does this branch already have a PR?". Silent by default, so the happy
      // path still goes on to create one.
      // `pr view --json url` answers "does this branch already have a PR?"; `pr view --json body`
      // answers "what does it say right now?". The stub has to tell them apart, because updating an
      // existing body is a thing submit-pr does and a stub that returned a URL for both would let it
      // appear to work while rewriting a body it never read.
      'if [ "$1" = "pr" ] && [ "$2" = "view" ]; then',
      '  if [ -z "${GH_STUB_EXISTING_PR:-}" ]; then exit 1; fi',
      '  case "$*" in',
      // GH_STUB_BODY_FAILS is the transient GitHub read failure: the request exists, and what it
      // currently says is unknown. Distinct from a body that is genuinely empty, which is a real and
      // harmless state a PR can be in.
      '    *"--json body"*)',
      '      if [ "${GH_STUB_BODY_FAILS:-0}" = "1" ]; then exit 1; fi',
      '      if [ -n "${GH_STUB_EXISTING_BODY:-}" ]; then cat "$GH_STUB_EXISTING_BODY"; fi; exit 0 ;;',
      "  esac",
      '  printf "%s\\n" "$GH_STUB_EXISTING_PR"; exit 0',
      "fi",
      'while [ $# -gt 0 ]; do',
      '  printf "%s\\n" "$1" >> "$GH_STUB_LOG"',
      '  if [ "$1" = "--body-file" ]; then shift; cp "$1" "$GH_STUB_BODY"; fi',
      "  shift",
      "done",
      "exit 0",
      "",
    ].join("\n"),
  );
  await chmod(gh, 0o755);

  // Committed, not left untracked: an untracked file is a dirty tree, and every scenario below
  // except one needs the tree clean enough to reach the check it is actually about.
  git(work, ["add", "-A"]);
  git(work, ["commit", "--quiet", "-m", "The commit that should be verified"]);

  spawnSync("git", ["init", "--bare", "--quiet", remote], { encoding: "utf8" });
  git(work, ["remote", "add", "origin", remote]);

  return { dir, work, remote, stub, gh };
}

/** Run the real ci/submit-pr.sh inside a scratch repository. */
function submit(s, { env = {}, args = [] } = {}) {
  return spawnSync("bash", [forBash(path.join(s.work, "ci", "submit-pr.sh")), ...args], {
    cwd: s.work,
    encoding: "utf8",
    env: {
      ...process.env,
      LOCAL_CI_COMMAND: `bash ${forBash(s.stub)}`,
      GH_COMMAND: `bash`, // replaced below when a PR is expected
      GH_STUB_LOG: forBash(path.join(s.dir, "gh-args.txt")),
      GH_STUB_BODY: forBash(path.join(s.dir, "gh-body.md")),
      ...env,
    },
  });
}

const remoteBranches = (s) =>
  spawnSync("git", ["-C", s.remote, "for-each-ref", "--format=%(refname)"], { encoding: "utf8" }).stdout.trim();

test("submission pushes exactly the verified commit and records it in the PR body", async () => {
  const s = await scratch();
  try {
    const sha = git(s.work, ["rev-parse", "HEAD"]);
    const r = submit(s, {
      env: { GH_COMMAND: forBash(s.gh) },
      args: ["--body", "Prose the developer wrote and expects to keep."],
    });

    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.equal(
      spawnSync("git", ["-C", s.remote, "rev-parse", "refs/heads/feature/verified-submission"], { encoding: "utf8" })
        .stdout.trim(),
      sha,
      "the remote must hold exactly the commit CI verified",
    );

    const ghArgs = await readFile(path.join(s.dir, "gh-args.txt"), "utf8");
    assert.match(ghArgs, /^pr$/m);
    assert.match(ghArgs, /^create$/m);
    assert.match(ghArgs, /^The commit that should be verified$/m, "the title defaults to the commit subject");

    const body = await readFile(path.join(s.dir, "gh-body.md"), "utf8");
    assert.ok(body.includes(sha), "the PR body must name the verified commit in full");
    assert.match(body, /not by a GitHub-hosted Actions run/, "local verification must not be presented as Actions");
    assert.match(body, /\*\*PASS\*\*/);
    assert.ok(
      body.startsWith("Prose the developer wrote and expects to keep."),
      "the evidence block is appended to the developer's body, never in place of it",
    );
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * THE ONE THAT MATTERS. CI passes, and then a commit lands before the push. Everything the pipeline
 * proved is now about a tree that is no longer HEAD, and the only correct behaviour is to refuse.
 */
test("submission refuses when HEAD moved after CI verified it", async () => {
  const s = await scratch();
  try {
    const verified = git(s.work, ["rev-parse", "HEAD"]);
    const r = submit(s, { env: { STUB_CI_MUTATE: "1", GH_COMMAND: forBash(s.gh) } });

    assert.notEqual(r.status, 0, "a moved HEAD must not produce a submission");
    assert.match(r.stderr, /HEAD changed after CI verification/);
    assert.match(r.stderr, /has not been verified/);
    assert.match(r.stderr, /Nothing was pushed and no PR was created/);

    assert.notEqual(git(s.work, ["rev-parse", "HEAD"]), verified, "the scenario requires HEAD to have actually moved");
    assert.equal(remoteBranches(s), "", "nothing may reach the remote");
    assert.ok(!existsSync(path.join(s.dir, "gh-args.txt")), "gh must not have been invoked");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

test("submission refuses when CI fails, and pushes nothing", async () => {
  const s = await scratch();
  try {
    const r = submit(s, { env: { STUB_CI_FAIL: "1", GH_COMMAND: forBash(s.gh) } });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /CI failed\. No branch was pushed and no PR was created\./);
    assert.equal(remoteBranches(s), "");
    assert.ok(!existsSync(path.join(s.dir, "gh-args.txt")));
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

test("submission refuses a dirty working tree, because CI would verify what is never pushed", async () => {
  const s = await scratch();
  try {
    await writeFile(path.join(s.work, "README.md"), "edited but not committed\n");
    const r = submit(s, { env: { GH_COMMAND: forBash(s.gh) } });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /uncommitted change would be verified and never pushed/);
    assert.equal(remoteBranches(s), "");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

test("submission refuses to open a PR from the default branch onto itself", async () => {
  const s = await scratch();
  try {
    git(s.work, ["checkout", "--quiet", "-b", "main"]);
    const r = submit(s, { env: { GH_COMMAND: forBash(s.gh) } });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /never a PR source/);
    assert.equal(remoteBranches(s), "");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * The stale-evidence path. HEAD never moves and the tree is clean, so both SHA checks agree — but
 * the run that passed was a run of some other commit. Without this check a latest.json left over
 * from another branch would satisfy everything above it.
 */
test("submission refuses evidence that names a different commit", async () => {
  const s = await scratch();
  try {
    const r = submit(s, {
      env: { STUB_CI_COMMIT: "0".repeat(40), GH_COMMAND: forBash(s.gh) },
    });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /evidence names commit 0{40}/);
    assert.equal(remoteBranches(s), "");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * Every push after the first lands on a branch that already has a PR, and `gh pr create` fails on
 * that. The push is the half that carries the invariant, so the existing PR must be reported rather
 * than treated as a failed submission — and the developer's own description must survive it.
 *
 * REWRITTEN FOR ST-13, AND WHAT THE OLD VERSION WAS ACTUALLY ASSERTING. It ended with
 * `assert.ok(!existsSync("gh-args.txt"), "no second PR may be created")` — using "the GitHub CLI was
 * never invoked" as a proxy for "no second pull request was created". Those were the same fact only
 * while this path did nothing but print, and that doing-nothing was the defect: the request kept
 * asserting the first commit it had ever been verified against, under a heading reading **Verified
 * commit**. So the proxy was quietly pinning the defect in place, and a test that pins a defect
 * passes for exactly as long as nobody fixes it.
 *
 * The assertion now says what it always meant: `pr edit`, never `pr create`. Nothing was weakened —
 * the no-second-PR property is checked directly rather than through a stand-in, and three further
 * properties the old version could not see are checked beside it.
 */
test("submission updates an existing PR rather than failing to create a second one", async () => {
  const s = await scratch();
  try {
    const sha = git(s.work, ["rev-parse", "HEAD"]);
    const stale = "0".repeat(40);
    const bodyPath = path.join(s.dir, "existing-body.md");
    const prose = "A description a human wrote, which this must not touch.\n";
    await writeFile(bodyPath, `${prose}\n${evidenceBlock({ sha: stale, stages: "tests", completedAt: "2026-01-01T00:00:00Z" })}`);

    const r = submit(s, {
      env: {
        GH_COMMAND: forBash(s.gh),
        GH_STUB_EXISTING_PR: "https://example.invalid/pr/1",
        GH_STUB_EXISTING_BODY: forBash(bodyPath),
      },
    });

    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /A pull request already exists/);
    assert.match(r.stdout, /https:\/\/example\.invalid\/pr\/1/);
    assert.equal(
      spawnSync("git", ["-C", s.remote, "rev-parse", "refs/heads/feature/verified-submission"], { encoding: "utf8" })
        .stdout.trim(),
      sha,
      "the verified commit must still reach the remote",
    );

    const invocations = readFileSync(path.join(s.dir, "gh-args.txt"), "utf8");
    assert.match(invocations, /^edit$/m, "the existing request's body is edited");
    assert.doesNotMatch(invocations, /^create$/m, "no second PR may be created");

    const written = readFileSync(path.join(s.dir, "gh-body.md"), "utf8");
    assert.match(written, new RegExp(`\\| Verified commit \\| \`${sha}\` \\|`), "the block names this run's commit");
    assert.doesNotMatch(
      written,
      new RegExp(`\\| Verified commit \\| \`${stale}\` \\|`),
      "and no longer names the commit it was first verified against",
    );
    assert.match(written, new RegExp(stale), "which is recorded as superseded rather than deleted");
    assert.equal(written.slice(0, prose.length), prose, "the human's description is not the machine's to edit");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * The refusal half of the same path. A body whose evidence block cannot be located unambiguously —
 * edited by a human, or written before the markers existed — is reported and left alone. The push
 * still happened, so this is not a failed submission; it is the one case where the operator has to
 * paste the block themselves, and being told that is the whole point.
 */
test("submission refuses to rewrite a PR body whose evidence block cannot be located", async () => {
  const s = await scratch();
  try {
    const bodyPath = path.join(s.dir, "existing-body.md");
    await writeFile(bodyPath, "Prose.\n\n## Local CI\n\nA table a human wrote themselves.\n");

    const r = submit(s, {
      env: {
        GH_COMMAND: forBash(s.gh),
        GH_STUB_EXISTING_PR: "https://example.invalid/pr/1",
        GH_STUB_EXISTING_BODY: forBash(bodyPath),
      },
    });

    assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /was not rewritten/);
    assert.match(r.stdout, /Paste this in place of the stale block/);
    assert.ok(!existsSync(path.join(s.dir, "gh-body.md")), "a refusal writes no body to GitHub");

    // FALSIFIER: the block a human is told to paste must be one the next run can identify. Printing
    // from the `## Local CI` heading omitted the opening marker and kept the closing one, so anybody
    // following the instruction produced an unmatched pair — and an unmatched pair is precisely the
    // state this module refuses to touch. The repair instruction was arming the next refusal.
    const offered = r.stdout.slice(r.stdout.indexOf("Paste this in place of the stale block"));
    assert.ok(offered.includes(BEGIN), "the offered block must carry its opening marker");
    assert.ok(offered.includes(END), "and its closing marker");
    assert.ok(
      offered.indexOf(BEGIN) < offered.indexOf(END),
      "in that order, or pasting it produces a body no later run can identify",
    );
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * FALSIFIER — a read failure is not an empty body.
 *
 * Once the script knew a request existed, a failure of the second `pr view` was flattened to an
 * empty string by `|| true`. `pr-evidence.mjs` reads empty input as "there is no block here" and
 * correctly composes a fresh body — so a transient GitHub read failure became a `pr edit` that
 * replaced somebody's entire description with a CI table.
 *
 * That is the inverse of the rule this whole feature is built on. Not knowing what is there is the
 * strongest possible reason not to write, and turning it into confidence is worse than the stale
 * block ST-13 was opened for: stale provenance misleads a reader, this destroys a maintainer's work.
 */
test("submission refuses to write a body it could not read", async () => {
  const s = await scratch();
  try {
    const r = submit(s, {
      env: {
        GH_COMMAND: forBash(s.gh),
        GH_STUB_EXISTING_PR: "https://example.invalid/pr/1",
        GH_STUB_BODY_FAILS: "1",
      },
    });

    assert.equal(r.status, 0, `the push still happened: ${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /verified and pushed/, "the verified commit reaching the remote is the invariant");
    assert.ok(!existsSync(path.join(s.dir, "gh-body.md")), "nothing may be written to a body that was never read");

    const invocations = existsSync(path.join(s.dir, "gh-args.txt"))
      ? readFileSync(path.join(s.dir, "gh-args.txt"), "utf8")
      : "";
    assert.doesNotMatch(invocations, /^edit$/m, "`pr edit` must not be reached when the current body is unknown");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});

/**
 * Both wrappers, one rule.
 *
 * The scenario tests above drive `submit-pr.sh`, because they run under bash. `submit-pr.ps1` has
 * carried the identical defect twice now — once when only the shell script learned to update an
 * existing body, and once when only the shell script learned to fail closed on an unreadable one —
 * so the shared rules are asserted against both texts rather than against whichever one a test
 * happens to be able to execute.
 *
 * These are structural assertions and they know it. They cannot prove the PowerShell script behaves
 * correctly; they can prove it has not quietly lost the two constructs that make it behave
 * correctly, which is the drift that actually happened.
 *
 * MUTATIONS, from a committed baseline:
 *
 *   mutation                                                   unread-body  ambiguous-body  parity
 *   a failed body read is swallowed into an empty string again      x             ok           x
 *   the repair block is sliced from the heading down again          ok            x            ok
 *
 * The second row is the one worth reading. It reddened the behavioural test and NOT this parity
 * guard, because the guard matches one spelling of that `sed` expression and the mutation used
 * another. That is a real limit of a structural check and it is left recorded rather than papered
 * over by widening the pattern until it matches anything: the behavioural test is what actually
 * holds the shell script to the rule, and this guard exists for the PowerShell script, which has no
 * behavioural test at all. Knowing which assertion is load-bearing matters more than making both
 * look strong.
 */
test("both wrappers fail closed on an unreadable body and offer a complete block", async () => {
  for (const rel of ["ci/submit-pr.sh", "ci/submit-pr.ps1"]) {
    const text = await read(rel);

    assert.ok(
      !/--json body[^\n]*\|\|\s*true/.test(text),
      `${rel} swallows a failed body read into an empty string, which composes a fresh body over the description`,
    );
    assert.ok(
      /could not be read from GitHub/.test(text),
      `${rel} has no branch for "the current body could not be read"`,
    );
    assert.ok(
      /--block-only/.test(text),
      `${rel} builds its manual-repair output some other way; it must print the whole machine region, markers included`,
    );
    assert.ok(
      !/sed -n ['"]\/\^## Local CI\$\//.test(text),
      `${rel} still slices the repair block from the heading down, which drops the opening marker`,
    );
  }
});

test("submission refuses evidence that does not record a pass", async () => {
  const s = await scratch();
  try {
    const r = submit(s, { env: { STUB_CI_RESULT: "failed", GH_COMMAND: forBash(s.gh) } });

    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /does not record a pass/);
    assert.equal(remoteBranches(s), "");
  } finally {
    await rm(s.dir, { recursive: true, force: true });
  }
});
