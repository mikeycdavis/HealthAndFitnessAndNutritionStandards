/**
 * R1 — labels agree, bytes differ, and the evaluation must refuse.
 *
 * WHAT THIS REPLACES, AND WHY IT IS NOT A RELAXATION. FE-13's fourth falsifier asserted this exact
 * property and could never establish it. Its fixture obtained a pack by checking out `v1.0.0`, so the
 * evaluator it executed was v1.0.0's — a tree that predates the release-identity mechanism and, by
 * ADR 0008, can never contain it. No release could have satisfied that body, so the acceptance rule
 * built on it named a permanently untestable condition. The specimen is retired byte for byte under
 * ADR 0012 and preserved at `test/retired/fe-13-falsifier-4.retired.mjs`; the property it was written
 * to protect is asserted here, of the evaluator that exists now, and it is stronger for it:
 *
 *     the retired fixture     could exercise the tag half OR the bytes half, in different
 *                             environments, and in neither case the mechanism half
 *     this fixture            exercises all three at once, on every platform, on every run
 *
 * THE SUBJECT, unchanged from the original: correct tag, correct VERSION, one modified standards file.
 * A remedy that compares `standardVersion` to `VERSION`, or that resolves the tag and stops there,
 * passes every other FE-13 case and fails this one — which is the point of it. Identity is a property
 * of the material, not of the labels, and every label here agrees.
 *
 * WHY THE RELEASE IS CONSTRUCTED RATHER THAN BORROWED. See `test/helpers/scratch-release.mjs`. In
 * short: the old fixture's `git clone --local` cannot hardlink across volumes on Windows, and its
 * fallback silently substituted a different pack and a different refusal. A fixture with a fallback
 * path has two subjects and reports on whichever one it took. This one has no fallback because it
 * needs nothing from the host repository's `.git` at all.
 *
 * WHAT R1 DOES NOT DO. It does not certify a real release. An internally constructed release proves
 * the mechanism binds material to labels; it says nothing about whether the release this repository is
 * about to publish does so with the machinery it actually contains. That is R2, it runs once during
 * the signing ceremony against the real unpublished tag, and its evidence is recorded under
 * `artifacts/evidence/`. FE-13 closes on both, not on this file alone.
 *
 * MUTATIONS RUN, recorded as observed rather than as predicted:
 *
 *   mutation                                                          R1   control  specimen
 *   ---------------------------------------------------------------- ---- -------- --------
 *   MR1  the `release.ok === false` refusal in commandCheck is        red  ok       ok
 *        skipped, so an unestablished identity evaluates anyway
 *   MR2  one character changed in the retired specimen                ok   ok       red
 *   MR3  the retired specimen is deleted                              ok   ok       red
 *   MR4  the retired specimen is put back into the test command       ok   ok       red
 *
 * MR1 is the one that matters for R1, and the separation is the evidence: the control stayed green
 * under it, so R1's refusal is about the modified bytes and not about the fixture being unable to
 * start. MR2–MR4 are the three ways "retired" decays — edited, deleted, quietly made pending again —
 * and each is a different sentence in ADR 0012's rule.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scratchRelease, adopterClaiming, check } from "./helpers/scratch-release.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RETIRED = path.join(REPO, "test", "retired", "fe-13-falsifier-4.retired.mjs");

/**
 * The bytes of FE-13 falsifier 4, as they stood when it was retired. Pinned so that a retirement
 * cannot decay into a deletion, and so that "preserved unchanged" is a checked claim rather than an
 * assurance in a document. Computed over the specimen region only — the retired file's explanatory
 * header is ordinary prose and may be improved.
 */
const SPECIMEN_SHA256 = "1c2b9d57051ab4bd7c9f742e475eb6f203e6f77295a85016798ddc651fbf5c4f";
const SPECIMEN_START = "/**\n * The negative control that a string-comparison remedy would pass.";

test("R1: a release whose labels all agree and whose bytes differ cannot obtain a verdict", async () => {
  const { dir, release } = await scratchRelease();
  const adopter = await adopterClaiming(release);
  try {
    // The modification happens AFTER the release object exists, which is the only ordering that
    // reproduces the subject: the tag designates a tree, and the disk no longer matches it. One
    // standard, one appended line — the smallest change that a version-string comparison cannot see.
    const standard = path.join(dir, "standards", "32-energy-balance.md");
    await writeFile(standard, (await readFile(standard, "utf8")) + "\n\nLocally added guidance.\n");

    // Every label still agrees. This is the assertion the whole test hangs on: if VERSION had drifted,
    // a string comparison would catch the fixture and the test would prove nothing about material.
    assert.equal((await readFile(path.join(dir, "VERSION"), "utf8")).trim(), release);

    const { exit, json } = check(dir, adopter);

    assert.notEqual(exit, 0, "every label agrees and the standards bytes differ: this must refuse");
    assert.equal(json?.status, "UNIDENTIFIED_RELEASE");
    assert.equal(json?.releaseIdentity?.established, false);
    assert.equal(
      json?.releaseIdentity?.reason,
      "material-differs",
      "the refusal must name the material, not the labels — a tag-resolution failure here would mean " +
        "the fixture broke rather than that the mechanism worked",
    );
    assert.ok(json?.releaseIdentity?.differenceCount >= 1, "the refusal must say how much differed");
    assert.equal(
      json?.standardVersion,
      null,
      "a pack that cannot prove which release it is must not report the version the adopter claimed",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

test("R1 positive control: the same release, unmodified, does establish its identity", async () => {
  // Without this, R1 is satisfied by any fixture that fails for any reason at all — a missing tag, an
  // unreadable directory, a pack that cannot start. The refusal above means something only because
  // this run, differing in exactly one appended line, does not refuse.
  const { dir, release } = await scratchRelease();
  const adopter = await adopterClaiming(release);
  try {
    const { json } = check(dir, adopter);
    assert.equal(json?.releaseIdentity?.established, true, "the unmodified release must verify");
    assert.equal(json?.standardVersion, release, "and report the release it proved, not one it was told");
    assert.notEqual(json?.status, "UNIDENTIFIED_RELEASE");
  } finally {
    await rm(dir, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

test("the retired falsifier is preserved unchanged, and is out of the default suite", async () => {
  // ADR 0012's second clause, made mechanical. Retirement is a disposition about a fixture; it is not
  // permission to remove the record. If this goes red, the question to ask is not "how do I make it
  // green" but "who edited a retired specimen, and why".
  assert.ok(existsSync(RETIRED), "the retired specimen must remain in the repository");

  const content = await readFile(RETIRED, "utf8");
  const start = content.indexOf(SPECIMEN_START);
  assert.notEqual(start, -1, "the retired file no longer contains the specimen it was made to preserve");

  const specimen = content.slice(start).replace(/\n$/u, "");
  assert.equal(
    createHash("sha256").update(specimen, "utf8").digest("hex"),
    SPECIMEN_SHA256,
    "the retired falsifier's bytes have changed. It was retired because its fixture could not express " +
      "its subject, not because its text was wrong, and an edited specimen no longer evidences that.",
  );

  // And it must not be pending work. A retired falsifier left in the run as a `todo` is exactly the
  // indefinite-pending state the retirement exists to end.
  const pkg = JSON.parse(await readFile(path.join(REPO, "package.json"), "utf8"));
  assert.ok(
    !pkg.scripts.test.includes("test/retired/"),
    "a retired specimen must not be registered in the test command",
  );
  assert.ok(
    !content.includes("test(") || content.includes("const TODO"),
    "the specimen keeps its original markers; it is a record, not a live assertion",
  );
});
