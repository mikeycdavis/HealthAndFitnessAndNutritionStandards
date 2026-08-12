/**
 * FE-13 — adoption pins an immutable release.
 *
 * THIS FILE IS A FALSIFIER AND EVERY ASSERTION IN IT CURRENTLY FAILS. It was written and committed
 * before any remedy was designed, deliberately. Its assertions state the behaviour FE-13 must
 * produce; the current system does not produce it, and the point of committing it in this state is
 * that the false green is reproducible rather than argued about. They are marked `todo` — see the
 * note on that marker below, which explains what that costs and why.
 *
 * THE CLAIM UNDER TEST. An adopter that says it uses `v1.0.0` must demonstrably be evaluated against
 * the exact immutable release. Where that cannot be established, evaluation must fail closed rather
 * than silently substituting a branch, a moving ref, a local checkout, or a cached copy whose
 * identity is no longer proven.
 *
 * THE DISTINCTION THE CURRENT SYSTEM DOES NOT MAKE. Version equality is not identity equality.
 * `standardVersion: "1.0.0"` in an adopter's policy establishes what that project *claims* to use. It
 * establishes nothing about which bytes were evaluated. Today the claim is not merely unverified — it
 * is the value the tool reports back, at scripts/standards.mjs:615:
 *
 *     standardVersion: loaded.policy.standardVersion ?? version
 *
 * The policy's own assertion wins outright, and the catalog is loaded from `ROOT` — wherever the CLI
 * happens to live — with no identity check at any point. So a deliberately altered pack evaluating an
 * adopter that claims 1.0.0 produces output stating the adopter was evaluated against 1.0.0.
 *
 * WHY A FALSIFIER FIRST. The two defects this release actually shipped and had to correct were both
 * invisible to reasoning and visible to execution: a CI comment that was wrong for months because
 * nothing re-read it, and a test invocation that had never once run in CI. Designing the remedy
 * before reproducing the failure would repeat that mistake in the one area where this repository
 * claims the most.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WHY `todo` RATHER THAN A RED BUILD. All four were reproduced failing, and the intent was to
 * commit them failing. They are marked `todo` instead for one reason: this repository made CI a real
 * enforcement surface four commits before this one, and a knowingly-red `main` teaches everybody who
 * sees it that red means nothing. That erosion is the thing the whole release was built to resist.
 *
 * `todo` keeps every property that mattered. They run on every CI run, they print exactly what they
 * assert, and FE-13 does not close while this marker is still here — removing it is part of the
 * remedy, not a separate cleanup. What is lost is the build going red, and that is the part worth
 * losing.
 *
 * THE ONLY LEGITIMATE WAY THIS MARKER DISAPPEARS is that the false green has been removed and these
 * falsifiers — all of them, unchanged — pass. They may not be deleted, weakened, rewritten to assert
 * something easier, or moved out of the default test run. Doing any of that to reach a green build
 * is the "falsify evidence for" clause of `integrity.no-standards-manipulation`, applied to this
 * repository's own maintenance rather than to an adopter's.
 */
const TODO = { todo: "FE-13: release identity is not established; remove this marker with the remedy" };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");

/** A copy of this pack with its identity deliberately broken, standing in for a substituted source. */
async function tamperedPack() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-substituted-"));
  await cp(REPO, dir, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
  });

  // Not the released bytes, and not even claiming to be: this pack says it is something else.
  await writeFile(path.join(dir, "VERSION"), "0.0.0-substituted\n");

  // And its content differs from the release in a way that matters. The verbatim source line of a
  // prohibition is reworded — the exact defect `npm run fidelity` exists to catch, and which `check`
  // never asks about.
  const rulesPath = path.join(dir, "rules", "nutrition.json");
  const rules = JSON.parse(await readFile(rulesPath, "utf8"));
  const target = rules.rules.find((r) => r.id === "nutrition.no-crash-dieting");
  target.description = "Crash dieting is generally discouraged in most circumstances.";
  await writeFile(rulesPath, JSON.stringify(rules, null, 2) + "\n");

  return dir;
}

/** A minimal adopting project whose policy claims the immutable release. */
async function adopterClaiming(version) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-adopter-"));
  await writeFile(
    path.join(dir, "project-policy.yml"),
    [
      `standardVersion: "${version}"`,
      `project: "AdopterClaimingAnImmutableRelease"`,
      "domains: []",
      "rules: {}",
      "applicability: {}",
      "exceptions: []",
      "attestations: {}",
      "",
    ].join("\n"),
  );
  return dir;
}

function check(packDir, adopterDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(packDir, "scripts", "standards.mjs"), "check", `--dir=${adopterDir}`, "--json"],
    { encoding: "utf8" },
  );
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* a fail-closed implementation may legitimately produce no JSON verdict at all */
  }
  return { exit: r.status, json, stderr: r.stderr };
}

test("FALSIFIER: a substituted pack cannot report the release the adopter merely claims", TODO, async () => {
  const pack = await tamperedPack();
  const adopter = await adopterClaiming("1.0.0");
  try {
    const { exit, json } = check(pack, adopter);

    // What the tool currently does: it echoes the adopter's claim as established fact. This single
    // assertion is the whole finding — the output asserts an evaluation against 1.0.0 that did not
    // happen, using a pack that says it is 0.0.0-substituted and whose rule text differs.
    assert.notEqual(
      json?.standardVersion,
      "1.0.0",
      "the report states the adopter was evaluated against 1.0.0 while the evaluating pack is " +
        "0.0.0-substituted with altered rule text: version equality is not identity equality",
    );

    // And it produces a verdict at all, rather than refusing for want of an establishable identity.
    assert.notEqual(exit, 0, "a substituted source must not yield a passing verdict");
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

test("FALSIFIER: the report must record what was evaluated, not only what was claimed", TODO, async () => {
  const adopter = await adopterClaiming("1.0.0");
  try {
    const { json } = check(REPO, adopter);

    // Even against the genuine pack, nothing in the output identifies the bytes that produced the
    // verdict. A reader cannot distinguish this run from the substituted one above. Whatever FE-13
    // designs — a release digest, a resolved tag, a content hash over the catalog — it has to appear
    // here, or the distinction exists only in the operator's head.
    assert.ok(
      json?.releaseIdentity,
      "the JSON envelope carries no field establishing which release actually evaluated this project",
    );
  } finally {
    await rm(adopter, { recursive: true, force: true });
  }
});

test("FALSIFIER: an unestablishable release identity must fail closed", TODO, async () => {
  const pack = await tamperedPack();
  const adopter = await adopterClaiming("1.0.0");
  try {
    await rm(path.join(pack, "VERSION"), { force: true });
    const { exit, json } = check(pack, adopter);

    // With no VERSION at all the pack cannot say what it is. The current code substitutes the string
    // "unknown" and carries on — and because the policy's claim wins anyway, the report still says
    // 1.0.0. Fail-closed means refusing to produce a verdict, not producing one from a default.
    assert.notEqual(
      exit,
      0,
      "with no establishable release identity the evaluation must refuse rather than default",
    );
    assert.notEqual(json?.standardVersion, "1.0.0", "an unidentifiable pack must not report 1.0.0");
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

/**
 * The negative control that a string-comparison remedy would pass.
 *
 * Correct tag, correct VERSION, modified standards file. Every label agrees; the bytes do not. A
 * remedy that compares `standardVersion` to `VERSION`, or even resolves the tag and stops there,
 * goes green here — and it would be wrong, because the whole finding is about which bytes produced
 * the verdict rather than which commit someone says they came from.
 *
 * This is the case that separates artifact identity from labels, which is why it is a falsifier and
 * not a note in the backlog.
 */
test("FALSIFIER: correct tag and correct VERSION with a modified standard must still reject", TODO, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-labels-agree-"));
  const adopter = await adopterClaiming("1.0.0");
  try {
    // A real checkout of the release where possible, so the tag genuinely resolves. Where the tag is
    // unavailable — a shallow CI checkout has no tags — a plain copy stands in; the requirement is
    // identical either way, and only the strength of the "correct tag" half is reduced.
    const cloned = spawnSync("git", ["clone", "--local", "--quiet", REPO, dir], { encoding: "utf8" });
    const checkedOut =
      cloned.status === 0 &&
      spawnSync("git", ["-C", dir, "checkout", "--quiet", "v1.0.0"], { encoding: "utf8" }).status === 0;
    if (!checkedOut) {
      await rm(dir, { recursive: true, force: true });
      await cp(REPO, dir, {
        recursive: true,
        filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
      });
    }

    // VERSION is untouched and correct. One standard is not.
    const standard = path.join(dir, "standards", "32-energy-balance.md");
    await writeFile(standard, (await readFile(standard, "utf8")) + "\n\nLocally added guidance.\n");
    assert.equal((await readFile(path.join(dir, "VERSION"), "utf8")).trim(), "1.0.0");

    const { exit, json } = check(dir, adopter);
    assert.notEqual(
      exit,
      0,
      `every label agrees and the standards bytes differ${checkedOut ? "" : " (tag unavailable; copy stood in)"}: ` +
        "identity must be established over the material, not over the labels",
    );
    assert.notEqual(json?.standardVersion, "1.0.0", "a modified pack must not report itself as 1.0.0");
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});
