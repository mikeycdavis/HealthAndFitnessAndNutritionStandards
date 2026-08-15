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
import { spawnSync } from "node:child_process";
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    ["inventory", "rules", "fidelity", "policy", "diagrams", "tests", "audit", "check"],
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
    ["inventory", "rules", "fidelity", "policy", "diagrams", "tests", "audit", "check"],
  );
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

test("the CI image runs as an unprivileged user and installs nothing beyond git", async () => {
  const dockerfile = await read("ci/Dockerfile");
  assert.match(dockerfile, /^USER node$/m, "CI is untrusted code execution and does not run as root");

  const installs = [...dockerfile.matchAll(/apt-get install[^\n]*\n(?:[^\n]*\\\n)*[^\n]*/g)].join(" ");
  assert.match(installs, /\bgit\b/, "git is a genuine test dependency here");
  for (const tool of ["curl", "wget", "ssh", "sudo"]) {
    assert.ok(!installs.includes(tool), `the CI image installs ${tool}, which nothing in the pipeline needs`);
  }
});

test("verification evidence is ignored, not committed", async () => {
  const ignored = await read(".gitignore");
  assert.match(ignored, /artifacts\/local-ci/);

  const tracked = spawnSync("git", ["-C", REPO, "ls-files", "artifacts/local-ci"], { encoding: "utf8" });
  assert.equal(tracked.stdout.trim(), "", "a claim about a verification must not be committed without the verification");
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
