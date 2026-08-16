/**
 * FE-13 stage 3 — VERIFICATION, tested on its own before the verdict is allowed to depend on it.
 *
 * Ordinary tests, and they pass. The falsifiers are still in `test/release-identity.test.mjs`, and
 * this file closes none of them by itself: knowing that a comparison refuses correctly is not the
 * same as `check` refusing to produce a verdict. That is the wiring, and it is asserted where it
 * happens.
 *
 * TWO KINDS OF TEST HERE, and the split is deliberate. The failure taxonomy runs against an injected
 * `git`, so every branch is reachable without constructing a repository per case. The claims that
 * actually matter run against a real checkout of `v1.0.0`, because a comparator that agrees with a
 * fixture it also generated has established nothing.
 *
 * THE ONE THAT WOULD BE MISSED. "Every released file is present and matches" passes a pack with an
 * extra rule file in it, and that pack produces a different verdict. `not-in-release` is asserted
 * with its own test for that reason, and the boundary test beside it is its complement: material
 * added inside the boundary is a rejection, and prose changed outside it is not.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRelease, gitIn } from "../scripts/release-identity.mjs";
import { materialise, MATERIAL } from "../scripts/release-material.mjs";
import { verifyRelease, releaseMaterial, REASON, DIFFERENCE } from "../scripts/release-verify.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = "1.0.0";

const IDENTITY = Object.freeze({
  requestedRelease: "v1.0.0",
  ref: "refs/tags/v1.0.0",
  resolvedCommit: "570c45b742204841821e5a2ba4dbc38e6069bdc0",
  resolvedTree: "0".repeat(40),
});

/** A `git` that answers `ls-tree` with the records given, in Git's own -z framing. */
function treeOf(records, { status = 0 } = {}) {
  const stdout = records.map((r) => `${r.mode ?? "100644"} ${r.type ?? "blob"} ${r.oid}\t${r.path}\0`).join("");
  return () => ({ status, stdout, stderr: "" });
}

/** A material list in stage 2's shape. Only `path` and `oid` are compared. */
const materialOf = (entries) => ({
  root: "/pack",
  entries: entries.map((e) => ({ ...e, bytes: 1 })),
  count: entries.length,
  totalBytes: entries.length,
});

const oidA = "a".repeat(40);
const oidB = "b".repeat(40);

// ---------------------------------------------------------------------------------------------
// The failure taxonomy
// ---------------------------------------------------------------------------------------------

test("a tree that cannot be read is a fail-closed case, not an empty comparison", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([{ path: "VERSION", oid: oidA }]),
    git: treeOf([], { status: 128 }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.TREE_UNREADABLE);
  // The wording matters: this is the shape a shallow or partial clone produces, and an operator who
  // reads "could not be read" and thinks "transient" will retry rather than fix their checkout.
  assert.match(r.detail, /shallow or partial clone/);
});

test("a release tree holding none of the declared material is refused, because it would agree with anything", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([{ path: "VERSION", oid: oidA }]),
    git: treeOf([
      { path: "README.md", oid: oidA },
      { path: "docs/local-ci.md", oid: oidB },
    ]),
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.RELEASE_HAS_NO_MATERIAL);
});

test("a symlink or submodule inside the boundary is refused rather than interpreted", () => {
  for (const irregular of [
    { mode: "120000", type: "blob" },
    { mode: "160000", type: "commit" },
  ]) {
    const r = verifyRelease({
      identity: IDENTITY,
      material: materialOf([{ path: "VERSION", oid: oidA }]),
      git: treeOf([{ path: "VERSION", oid: oidA, ...irregular }]),
    });
    assert.equal(r.ok, false, `mode ${irregular.mode} must not verify`);
    assert.equal(r.reason, REASON.IRREGULAR_RELEASE_ENTRY);
  }
});

test("an unparseable ls-tree record refuses rather than being skipped", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([{ path: "VERSION", oid: oidA }]),
    git: () => ({ status: 0, stdout: "100644 blob deadbeef VERSION\0", stderr: "" }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.TREE_UNREADABLE);
});

test("changed content is reported as the path it changed at, both object ids named", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([{ path: "VERSION", oid: oidB }]),
    git: treeOf([{ path: "VERSION", oid: oidA }]),
  });
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.MATERIAL_DIFFERS);
  assert.deepEqual(r.differences, [
    { path: "VERSION", difference: DIFFERENCE.CONTENT_DIFFERS, released: oidA, evaluated: oidB },
  ]);
  assert.equal(r.differenceCount, 1);
});

test("a released file the material does not have is a pack with a hole in it", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([{ path: "VERSION", oid: oidA }]),
    git: treeOf([
      { path: "VERSION", oid: oidA },
      { path: "rules/health.json", oid: oidB },
    ]),
  });
  assert.equal(r.ok, false);
  assert.deepEqual(r.differences, [
    { path: "rules/health.json", difference: DIFFERENCE.MISSING_FROM_MATERIAL, released: oidB },
  ]);
});

/**
 * The asymmetric case, and the reason this comparison is a set comparison rather than a loop over
 * the release. A pack carrying an extra rule file satisfies "every released file is present and
 * matches" completely — and evaluates an adopter against a rule the release does not contain.
 */
test("a file the release does not have is a rejection too, not a harmless addition", () => {
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf([
      { path: "VERSION", oid: oidA },
      { path: "rules/local-additions.json", oid: oidB },
    ]),
    git: treeOf([{ path: "VERSION", oid: oidA }]),
  });
  assert.equal(r.ok, false);
  assert.deepEqual(r.differences, [
    { path: "rules/local-additions.json", difference: DIFFERENCE.NOT_IN_RELEASE, evaluated: oidB },
  ]);
});

test("many differences report an exact count and a bounded list", () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ path: `standards/${i}.md`, oid: oidA }));
  const r = verifyRelease({
    identity: IDENTITY,
    material: materialOf(many.map((e) => ({ ...e, oid: oidB }))),
    git: treeOf(many),
  });
  assert.equal(r.ok, false);
  assert.equal(r.differenceCount, 30, "the count is the truth");
  assert.equal(r.differences.length, 20, "the list is bounded so a refusal stays readable");
});

test("release material is read only within the reviewed boundary", () => {
  const r = releaseMaterial(
    IDENTITY,
    treeOf([
      { path: "VERSION", oid: oidA },
      { path: "README.md", oid: oidB },
      { path: "ci/run-checks.sh", oid: oidB },
      { path: "standards/01-wellness-vs-medical-assessment.md", oid: oidA },
    ]),
  );
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.entries.map((e) => e.path),
    ["VERSION", "standards/01-wellness-vs-medical-assessment.md"].sort(),
  );
});

// ---------------------------------------------------------------------------------------------
// Against the real release
// ---------------------------------------------------------------------------------------------

/**
 * A genuine checkout of the release.
 *
 * `--no-hardlinks` rather than a plain `--local` clone: the default hardlinks the object store, and
 * hardlinks do not cross volumes, so on a machine whose repository and temp directory live on
 * different drives the plain form fails. A test that quietly took a different path on one developer's
 * machine is the environment difference this slice exists to remove.
 */
async function releaseCheckout() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-release-"));
  const cloned = spawnSync("git", ["clone", "--no-hardlinks", "--quiet", REPO, dir], { encoding: "utf8" });
  assert.equal(cloned.status, 0, `cloning this repository must work: ${cloned.stderr}`);
  const out = spawnSync("git", ["-C", dir, "checkout", "--quiet", `v${RELEASE}`], { encoding: "utf8" });
  assert.equal(out.status, 0, `v${RELEASE} must be checkoutable: ${out.stderr}`);
  return dir;
}

async function verifyCheckout(dir) {
  const resolved = resolveRelease(RELEASE, gitIn(dir));
  assert.equal(resolved.ok, true, `resolution: ${resolved.reason} — ${resolved.detail}`);
  const material = await materialise(dir);
  assert.equal(material.ok, true, `materialisation: ${material.reason} — ${material.detail}`);
  return verifyRelease({ identity: resolved.identity, material: material.material, git: gitIn(dir) });
}

test("a real checkout of v1.0.0 verifies as the release it says it is", async () => {
  const dir = await releaseCheckout();
  try {
    const r = await verifyCheckout(dir);
    assert.equal(r.ok, true, `expected MATCH: ${r.reason} — ${r.detail}`);
    assert.equal(r.verification.identity, "MATCH");
    assert.equal(r.verification.resolvedCommit, "570c45b742204841821e5a2ba4dbc38e6069bdc0");
    assert.equal(r.verification.releaseDigest, r.verification.materialDigest);
    assert.match(r.verification.materialDigest, /^sha256:[0-9a-f]{64}$/);
    assert.ok(r.verification.files > 60, "the whole material boundary was compared, not a corner of it");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/**
 * The mutation test. Every guard in this repository is run against the defect it describes before it
 * is trusted, and this is the defect: correct tag, correct VERSION, one standard changed. It is the
 * same shape as FE-13's control case, asserted here at the level where the mechanism lives.
 */
test("one changed byte in one standard is enough to lose release identity", async () => {
  const dir = await releaseCheckout();
  try {
    const standard = path.join(dir, "standards", "32-energy-balance.md");
    await writeFile(standard, (await readFile(standard, "utf8")) + "\n\nLocally added guidance.\n");
    assert.equal((await readFile(path.join(dir, "VERSION"), "utf8")).trim(), RELEASE, "the label still agrees");

    const r = await verifyCheckout(dir);
    assert.equal(r.ok, false, "labels agreeing is not identity");
    assert.equal(r.reason, REASON.MATERIAL_DIFFERS);
    assert.deepEqual(
      r.differences.map((d) => [d.path, d.difference]),
      [["standards/32-energy-balance.md", DIFFERENCE.CONTENT_DIFFERS]],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("an added rule file loses release identity, though every released file still matches", async () => {
  const dir = await releaseCheckout();
  try {
    await writeFile(path.join(dir, "rules", "local.json"), '{"rules": []}\n');
    const r = await verifyCheckout(dir);
    assert.equal(r.ok, false);
    assert.deepEqual(
      r.differences.map((d) => [d.path, d.difference]),
      [["rules/local.json", DIFFERENCE.NOT_IN_RELEASE]],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/**
 * The boundary's other half. If prose changes rejected the release, the boundary would be widened
 * until it meant nothing — so this asserts the thing that makes the narrow list survivable, and it
 * is deliberately a file that really does differ between the release and the current `main`.
 */
test("prose outside the material boundary changes nothing about identity", async () => {
  const dir = await releaseCheckout();
  try {
    for (const outside of ["README.md", "CHANGELOG.md"]) {
      await writeFile(path.join(dir, outside), "Entirely rewritten.\n");
    }
    const r = await verifyCheckout(dir);
    assert.equal(r.ok, true, `prose is not material: ${r.reason} — ${r.detail}`);
    assert.ok(
      !MATERIAL.includes("README.md") && !MATERIAL.includes("CHANGELOG.md"),
      "and the boundary says so explicitly rather than by accident",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
