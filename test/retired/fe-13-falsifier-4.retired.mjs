/**
 * RETIRED — FE-13 falsifier 4, preserved byte for byte.
 *
 * THIS FILE IS NOT IN THE TEST COMMAND, AND THAT IS THE POINT OF IT. It is a historical specimen, not
 * pending work. It was retired on 2026-08-16 by the owner, on execution evidence that its fixture
 * cannot express its own subject — not because the implementation failed it, and not because it was
 * inconvenient. The distinction is the whole justification, so it is recorded here rather than in a
 * commit message somebody would have to go looking for.
 *
 * WHAT IT WAS FOR. Correct tag, correct VERSION, modified standards file: every label agrees and the
 * bytes do not. A remedy that compares version strings, or resolves the tag and stops there, passes
 * every other FE-13 case and fails this one. That subject is real and is still guarded — see
 * `test/release-material-binding.test.mjs`, which asks it of the evaluator that exists now.
 *
 * WHY IT CAN NEVER PASS. The body below obtains its pack by checking out `v1.0.0`, so the code it
 * executes is v1.0.0's, which predates the release-identity mechanism. A release cannot acquire a
 * guarantee written after it (ADR 0008), so no future release changes what this exercises. The fixture
 * is bound to the one release that is permanently incapable of satisfying it.
 *
 * THE TWO EXECUTIONS THAT ESTABLISHED IT, recorded because "old" and "invalid" are different claims
 * and only the second justifies retirement:
 *
 *     same-volume, clone succeeds     executes the v1.0.0 evaluator
 *                                     standardVersion: "1.0.0" -> assertion 2 FAILS
 *                                     the fixture permanently cannot satisfy its intended condition
 *
 *     cross-volume, --local clone     "failed to create link ... Improper link"
 *       fails (Windows, F: -> C:)     the fallback copies the working tree without .git
 *                                     UNIDENTIFIED_RELEASE / no-repository -> both assertions PASS
 *                                     an apparent pass that exercised neither intended condition
 *
 * So it is not merely bound to the wrong release: it is non-portable and semantically unstable, giving
 * opposite answers in the two environments this repository actually runs in, and giving the reassuring
 * one on the developer's machine.
 *
 * THE RULE THIS RETIREMENT WAS MADE UNDER is ADR 0012. A precommitted falsifier may be retired only on
 * evidence that its fixture cannot express the property it was intended to test; the obligation is
 * never weakened or deleted; the original is preserved; replacement evidence must cover the same
 * subject before the owning feature closes. A falsifier that is merely red against a correct fixture
 * is not eligible. Retiring this one is permitted by that rule; retiring an inconvenient one is not.
 *
 * NOTHING BELOW THIS LINE WAS EDITED. The imports and the two helpers are the originals from
 * `test/release-identity.test.mjs`, carried across so the specimen still runs for anyone who wants to
 * watch it do what the record above says it does:
 *
 *     node --test test/retired/fe-13-falsifier-4.retired.mjs
 *
 * `test/release-material-binding.test.mjs` pins the specimen's bytes to sha256
 * 1c2b9d57051ab4bd7c9f742e475eb6f203e6f77295a85016798ddc651fbf5c4f
 * so that "retired" cannot quietly become "deleted" or "adjusted".
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TODO = { todo: "FE-13: release identity is not established; remove this marker with the remedy" };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");

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
