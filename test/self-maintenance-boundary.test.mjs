/**
 * FE-13 — the boundary around the one sanctioned bypass.
 *
 * `packSelfMaintenance` exists because a pack under development cannot prove it is a release: `main`
 * is ahead of the tag it publishes by construction, so requiring the repository to establish an
 * independent release identity for itself would make its own gate unachievable, and an unachievable
 * gate gets relaxed rather than met. That reasoning is sound and the exemption is deliberate. It is
 * also the most dangerous thing in the feature, because it is the only path around identity
 * establishment that FE-13 sanctions, and any hole in it is the bypass FE-13 was built to remove.
 *
 * Independent review of PR #2 rejected both properties the exemption was claimed to have. This file
 * is those two rejections written as tests. Both were committed failing against the implementation
 * they refute, in the order this repository requires: reproduce, then remedy.
 *
 *   PROPERTY 1  no adopter can acquire the exemption
 *   ---------------------------------------------------------------------------------------------
 *   REJECTED: the structural condition was `path.resolve(root) === ROOT`, and `ROOT` is derived from
 *   the evaluator module's own location. So it did not say "this is the standards pack". It said
 *   "this directory is wherever the evaluator happens to be", which anyone who copies the evaluator
 *   into a directory they control satisfies for free. The old test proved only that a *separate*
 *   adopter directory could not claim the exemption — the case the escape does not use.
 *
 *   PROPERTY 2  a self-maintenance result cannot be consumed as an adoption result
 *   ---------------------------------------------------------------------------------------------
 *   REJECTED: self-maintenance returned `ok: true`, proceeded through the ordinary evaluator, and
 *   emitted the ordinary verdict envelope — so it could report `status: "COMPLIANT"` and exit 0.
 *   `releaseIdentity.established: false` was additional metadata beside an otherwise ordinary green.
 *   A consumer doing the natural thing (exit 0, or `status === "COMPLIANT"`) was misled, and the
 *   human rendering warning correctly is not a machine contract.
 *
 * WHAT REPLACED IT, in one line each, because the tests below assert the consequences rather than
 * the mechanism:
 *
 *   Eligibility now requires membership in this pack's certified release lineage — the annotated tag
 *   recorded in `scripts/certified-releases.json` must resolve to the exact commit oid recorded
 *   there, and HEAD must descend from it. Copying the evaluator into a project does not confer that.
 *
 *   Self-maintenance is no longer an outcome of `check` at all. It is a separate command, and its
 *   status is `SELF_MAINTENANCE`, never `COMPLIANT`. `check` can therefore only ever produce an
 *   adoption verdict, which is what makes `status === "COMPLIANT"` from `check` mean something.
 *
 * MUTATION EVIDENCE. Each row was applied to source, the unchanged tests watched, and the file
 * restored with `git checkout --` and confirmed byte-for-byte. The tests are numbered in the order
 * they appear below.
 *
 *   mutation                                                         1  2  3  4  5  6
 *   -------------------------------------------------------------------------------------
 *   eligibility is root-coincidence again; lineage not consulted      x  x  ok ok ok ok
 *   the recorded commit oid is not compared, only the tag name        ok x  ok ok ok ok
 *   check answers for the pack with a compliance status and exit 0    ok ok x  ok ok ok
 *   maintain promotes the working-tree result to the top-level status ok ok ok x  x  ok
 *   the declaration alone is honoured; the root test is dropped       ok ok ok ok ok x
 *
 * Five mutations, five distinct signatures, and no row leaves every test green — which is what
 * distinguishes these from tests that merely accompany the change that made them pass.
 *
 * THE RESIDUAL IS NAMED RATHER THAN CLOSED, and ADR 0009 carries the argument: a genuine fork of the
 * whole lineage possesses every byte the original does, including the certified tag and the recorded
 * oid, so no check that runs inside the evaluator distinguishes it. What the fork obtains is a
 * self-maintenance outcome, which is worthless as an adoption result — the point of property 2.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXIT = { OK: 0, FINDINGS: 1, INVOCATION: 2, BLOCKED: 3, UNIDENTIFIED_RELEASE: 5, SELF_MAINTENANCE: 6 };

function run(packDir, argv) {
  const r = spawnSync(process.execPath, [path.join(packDir, "scripts", "standards.mjs"), ...argv], {
    encoding: "utf8",
  });
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* a refusal is still JSON; a crash is not, and the assertions should say which happened */
  }
  return { exit: r.status, json, stdout: r.stdout, stderr: r.stderr };
}

const git = (dir, args) => spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });

/**
 * A copy of the pack, without its history, in a directory the "adopter" controls.
 *
 * This is the escape in its purest form and it is deliberately not exotic: no symlink, no junction,
 * no path normalisation trick. Copy the evaluator, keep the policy that declares the exemption, run
 * the copied evaluator against its own directory. `ROOT` is that directory, so the old structural
 * condition held, and nothing about this tree is the certified pack.
 */
async function copiedEvaluator({ withGit = false } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-copied-pack-"));
  await cp(REPO, dir, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
  });
  if (withGit) {
    assert.equal(git(dir, ["init", "--quiet", "-b", "main"]).status, 0);
    git(dir, ["config", "user.email", "fixture@example.invalid"]);
    git(dir, ["config", "user.name", "Fixture"]);
    git(dir, ["add", "-A"]);
    assert.equal(git(dir, ["commit", "--quiet", "-m", "copied evaluator"]).status, 0);
  }
  return dir;
}

// ---------------------------------------------------------------------------------------------
// Property 1 — no adopter can acquire the exemption
// ---------------------------------------------------------------------------------------------

/**
 * The rejection, minimally reproduced. Against the implementation this test refutes, the copied tree
 * satisfied both conditions — the declaration is in the policy it copied, and the root is the
 * evaluator's own root — and self-maintenance was granted to a directory with no history at all.
 */
test("FALSIFIER: a copied evaluator does not acquire the exemption by being its own root", async () => {
  const pack = await copiedEvaluator();
  try {
    const asCheck = run(pack, ["check", `--dir=${pack}`, "--json"]);
    assert.notEqual(asCheck.exit, EXIT.OK, "a tree with no certified lineage must not reach a green");
    assert.notEqual(asCheck.json?.status, "COMPLIANT");

    const asMaintain = run(pack, ["maintain", `--dir=${pack}`, "--json"]);
    assert.notEqual(
      asMaintain.exit,
      EXIT.OK,
      "self-maintenance is not conferred by holding a copy of the evaluator",
    );
    assert.equal(
      asMaintain.json?.releaseIdentity?.established,
      false,
      "and whatever it reports, it establishes nothing",
    );
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

/**
 * The same escape with a history of its own, including a self-made annotated `v1.0.0`. Requiring
 * merely that some annotated tag of that name exist would be satisfiable by anyone with `git tag -a`;
 * the recorded commit oid is what makes the lineage a fact about this pack rather than about naming.
 */
test("FALSIFIER: a self-made v1.0.0 tag does not put a project in the certified lineage", async () => {
  const pack = await copiedEvaluator({ withGit: true });
  try {
    assert.equal(git(pack, ["tag", "-a", "v1.0.0", "-m", "not the certified release"]).status, 0);
    const forged = git(pack, ["rev-parse", "refs/tags/v1.0.0^{commit}"]).stdout.trim();
    const certified = JSON.parse(await readFile(path.join(REPO, "scripts", "certified-releases.json"), "utf8"));
    assert.notEqual(forged, certified.releases["1.0.0"].commit, "the fixture must not accidentally be genuine");

    const { exit, json } = run(pack, ["maintain", `--dir=${pack}`, "--json"]);

    assert.equal(exit, EXIT.BLOCKED, "a tag of the right name pointing at the wrong object is a claim, not a lineage");
    assert.equal(json?.releaseIdentity?.reason, "lineage-contradicted");
    assert.equal(json.releaseIdentity.established, false);
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------------------------
// Property 2 — a self-maintenance result cannot be consumed as an adoption result
// ---------------------------------------------------------------------------------------------

/**
 * The second rejection. The assertion is about the machine contract and nothing else: whatever the
 * pack's own working tree happens to satisfy today, `check` must not answer for it with the two
 * signals every consumer actually reads.
 */
test("FALSIFIER: check never returns a compliance verdict for the pack maintaining itself", async () => {
  const { exit, json } = run(REPO, ["check", `--dir=${REPO}`, "--json"]);

  assert.equal(exit, EXIT.SELF_MAINTENANCE, "the natural consumer reads the exit code, so it must not be 0");
  assert.notEqual(json?.status, "COMPLIANT", "and the next thing it reads is status");
  assert.equal(json?.status, "SELF_MAINTENANCE");
  assert.equal(json.releaseIdentity.established, false);
  assert.equal(json.results.length, 0, "a refusal carries no per-rule results to be summarised as a pass");
  assert.ok(!("score" in json), "nor a score, which is the other number a dashboard would show");
});

/**
 * And the positive half: the pack does still need a gate, so the outcome exists — under a different
 * command, with a status that is not a compliance vocabulary word. A consumer that runs `check` can
 * never receive this; a consumer that runs `maintain` asked for it by name.
 */
test("self-maintenance is a distinct machine outcome, not a compliant adoption", async () => {
  const { exit, json } = run(REPO, ["maintain", `--dir=${REPO}`, "--json"]);

  assert.equal(exit, EXIT.OK, "the pack's own gate can still pass, or the requirement would be relaxed instead");
  assert.equal(json?.status, "SELF_MAINTENANCE", "the top-level status is never a compliance verdict");
  assert.equal(json.releaseIdentity.established, false);
  assert.equal(json.releaseIdentity.mode, "self-maintenance");
  assert.equal(json.workingTreeStatus, "COMPLIANT", "the compliance result is reported, under a name that scopes it");
  assert.equal(json.releaseIdentity.lineage.certifiedRelease, "1.0.0");
});

/**
 * A consumer that treats a self-maintenance envelope as an adoption envelope should find nothing to
 * misread. This is the "future composition surfaces" half of the review: not what the field says, but
 * whether a compliance-shaped field exists at all for something else to pick up later.
 */
test("no self-maintenance output carries the vocabulary of an established adoption", async () => {
  const { json } = run(REPO, ["maintain", `--dir=${REPO}`, "--json"]);
  const text = JSON.stringify(json);

  assert.equal(json.status, "SELF_MAINTENANCE");
  assert.ok(!/"status"\s*:\s*"COMPLIANT"/.test(text), "no nested status reintroduces the word as a verdict");
  assert.equal(json.releaseIdentity.requestedRelease ?? null, null, "nothing was requested, so nothing is echoed");

  const human = run(REPO, ["maintain", `--dir=${REPO}`]).stdout;
  assert.match(human, /SELF-MAINTENANCE/);
  assert.ok(!/^Status:\s+COMPLIANT/m.test(human), "the rendering must not lead with a compliance word either");
});

/**
 * The declaration away from the pack was the one property the old tests did cover, and it stays
 * covered: this is the case where someone writes the sentence into an ordinary adopter policy.
 */
test("the declaration in an adopter policy is a manipulation, not a configuration mistake", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-declaring-adopter-"));
  try {
    await writeFile(
      path.join(dir, "project-policy.yml"),
      [
        'standardVersion: "1.0.0"',
        'project: "DeclaringAdopter"',
        "rules: {}",
        "applicability: {}",
        "exceptions: []",
        "attestations: {}",
        'packSelfMaintenance: "this-project-is-the-pack"',
        "",
      ].join("\n"),
    );

    for (const command of ["check", "maintain"]) {
      const { exit, json } = run(REPO, [command, `--dir=${dir}`, "--json"]);
      assert.equal(exit, EXIT.BLOCKED, `${command}: claiming to be the pack is a Standard 42 matter`);
      assert.equal(json?.releaseIdentity?.reason, "not-the-pack");
      assert.equal(json.releaseIdentity.established, false);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
