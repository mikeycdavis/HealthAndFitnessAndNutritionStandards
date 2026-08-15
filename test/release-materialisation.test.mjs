/**
 * FE-13 stage 2 — MATERIALISATION, tested on its own before anything depends on it.
 *
 * Ordinary tests, and they pass. They are not the falsifiers: `test/release-identity.test.mjs` holds
 * those, still `todo`, and they stay `todo` until the whole false-green path is gone. Materialisation
 * closes none of them either — knowing exactly which bytes are about to be evaluated is not knowing
 * that they are the right ones. That is stage 3, and it does not exist yet.
 *
 * Two things are worth more than the rest of this file. The first is that our blob identity is
 * checked against `git hash-object` rather than against itself, so "the object id Git would record"
 * is a claim under test and not a comment. The second is the boundary test: `MATERIAL` is compared
 * with the paths the CLI actually reads, so the reviewed list cannot quietly fall behind the code.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { materialise, blobOid, MATERIAL, REASON } from "../scripts/release-material.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A copy of this pack, without `.git`, that a test may deface. */
async function packCopy() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-material-"));
  await cp(REPO, dir, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
  });
  return dir;
}

const byPath = (m) => new Map(m.entries.map((e) => [e.path, e]));

test("this pack materialises, and every entry lies inside the declared boundary", async () => {
  const r = await materialise(REPO);
  assert.equal(r.ok, true, `expected this pack to materialise: ${r.reason} — ${r.detail}`);
  // Counted, not guessed at. The frozen baseline is 42 standards and six rule files, and a manifest
  // that quietly enumerated fewer would be the failure this whole stage is built to make impossible.
  const standards = r.material.entries.filter((e) => /^standards\/\d\d-[^/]+\.md$/.test(e.path));
  assert.equal(standards.length, 42, "all 42 standards are material");
  assert.equal(r.material.entries.filter((e) => e.path.startsWith("rules/")).length, 6);

  for (const e of r.material.entries) {
    assert.match(e.oid, /^[0-9a-f]{40}$/);
    assert.ok(!e.path.includes("\\"), `paths are POSIX for comparison with Git trees: ${e.path}`);
    assert.ok(
      MATERIAL.some((m) => e.path === m || e.path.startsWith(`${m}/`)),
      `${e.path} is outside the reviewed material boundary`,
    );
  }

  const paths = r.material.entries.map((e) => e.path);
  assert.deepEqual(paths, [...paths].sort(), "entries are sorted, so two runs are comparable byte for byte");
  assert.equal(new Set(paths).size, paths.length, "no path appears twice");
  assert.equal(
    r.material.totalBytes,
    r.material.entries.reduce((n, e) => n + e.bytes, 0),
  );
});

/**
 * The claim that matters: our blob identity is Git's, not ours. If this ever diverges, stage 3 would
 * compare two hashes of the same bytes and find them different, which is the worst possible failure
 * mode — a fail-closed system refusing correct material for a reason nobody can reproduce.
 */
test("a file's identity is the object id Git records for it", async () => {
  const r = await materialise(REPO);
  assert.equal(r.ok, true);
  const entries = byPath(r.material);

  const sample = ["VERSION", "rules/nutrition.json", "standards/32-energy-balance.md", "scripts/standards.mjs"];
  for (const rel of sample) {
    const entry = entries.get(rel);
    assert.ok(entry, `${rel} should be material`);

    const git = spawnSync("git", ["-C", REPO, "hash-object", "--", rel], { encoding: "utf8" });
    assert.equal(git.status, 0, `git hash-object failed for ${rel}: ${git.stderr}`);
    assert.equal(entry.oid, git.stdout.trim(), `${rel}: our blob id must be the one Git records`);
  }
});

test("blobOid follows Git's rule, including for the empty file", () => {
  // The well-known empty-blob id. A hash function that agrees with Git on ordinary files and not on
  // the degenerate one has got the header wrong in a way ordinary files hide.
  assert.equal(blobOid(Buffer.alloc(0)), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  assert.equal(blobOid(Buffer.from("hello\n")), "ce013625030ba8dba906f756967f9e9ca394464a");
});

test("materialisation is deterministic: the same bytes give the same manifest", async () => {
  const a = await materialise(REPO);
  const b = await materialise(REPO);
  assert.deepEqual(a.material.entries, b.material.entries);
});

/**
 * The tamper the falsifier performs, seen at this layer. Materialisation does not judge it — it has
 * nothing to judge it against — but the altered bytes must be visible in the manifest, or stage 3
 * will be comparing something that already lost the difference.
 */
test("a reworded prohibition changes the manifest", async () => {
  const pack = await packCopy();
  try {
    const before = byPath((await materialise(pack)).material);

    const rulesPath = path.join(pack, "rules", "nutrition.json");
    const rules = JSON.parse(await readFile(rulesPath, "utf8"));
    rules.rules.find((r) => r.id === "nutrition.no-crash-dieting").description =
      "Crash dieting is generally discouraged in most circumstances.";
    await writeFile(rulesPath, JSON.stringify(rules, null, 2) + "\n");

    const after = byPath((await materialise(pack)).material);
    assert.notEqual(after.get("rules/nutrition.json").oid, before.get("rules/nutrition.json").oid);
    assert.equal(after.size, before.size, "only the bytes changed, not the file list");
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

test("an added file inside the material changes the manifest", async () => {
  const pack = await packCopy();
  try {
    const before = await materialise(pack);
    await writeFile(path.join(pack, "standards", "99-locally-added.md"), "# Not in the release\n");
    const after = await materialise(pack);

    assert.equal(after.material.count, before.material.count + 1);
    assert.ok(byPath(after.material).has("standards/99-locally-added.md"));
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

/**
 * The scope distinction that would otherwise be got wrong. Adopters evaluate in-development code;
 * a dirty adopter tree is the normal case, not a violation. `materialise()` takes a pack root and
 * nothing else, so it cannot read the adopter's work even by mistake — a stronger guarantee than
 * remembering not to.
 */
test("the adopter's own files are not material, however close they sit", async () => {
  const pack = await packCopy();
  try {
    await mkdir(path.join(pack, "src"), { recursive: true });
    await writeFile(path.join(pack, "src", "half-written.js"), "// mid-refactor\n");
    await writeFile(path.join(pack, "project-policy.yml"), "standardVersion: \"1.0.0\"\n");
    await writeFile(path.join(pack, "README.md"), "# locally edited\n");

    const r = await materialise(pack);
    assert.equal(r.ok, true, "an adopter's dirty tree does not stop the pack materialising");
    const paths = byPath(r.material);
    assert.ok(!paths.has("src/half-written.js"));
    assert.ok(!paths.has("project-policy.yml"), "the adopter's policy is a claim, not pack material");
    assert.ok(!paths.has("README.md"), "prose about the pack cannot change a verdict");
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

test("a pack missing part of itself fails closed", async () => {
  const pack = await packCopy();
  try {
    await rm(path.join(pack, "VERSION"), { force: true });
    const r = await materialise(pack);
    assert.equal(r.ok, false);
    assert.equal(r.reason, REASON.MISSING_MATERIAL);
    assert.match(r.detail, /VERSION/);
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

test("a missing material directory fails closed too, not as an empty one", async () => {
  const pack = await packCopy();
  try {
    await rm(path.join(pack, "standards"), { recursive: true, force: true });
    const r = await materialise(pack);
    assert.equal(r.ok, false);
    assert.equal(r.reason, REASON.MISSING_MATERIAL);
  } finally {
    await rm(pack, { recursive: true, force: true });
  }
});

test("a pack root that is not a directory is refused", async () => {
  const r = await materialise(path.join(REPO, "VERSION"));
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.NOT_A_DIRECTORY);
});

test("a directory that declares no material at all is refused", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-empty-"));
  try {
    const r = await materialise(dir, { material: [] });
    assert.equal(r.ok, false);
    assert.equal(r.reason, REASON.NO_MATERIAL);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a failure never returns partial material", async () => {
  const r = await materialise(path.join(REPO, "VERSION"));
  assert.equal(r.ok, false);
  assert.equal(r.material, undefined, "half a manifest is worse than none: a caller would compare it");
  assert.ok(r.reason && r.detail, "a refusal must be able to say what it refused and why");
});

/**
 * Symlinks are refused rather than followed: a link supplies bytes from outside the material under a
 * path inside it, which is the substitution this feature exists to detect arriving through the
 * mechanism meant to detect it.
 *
 * Creating one needs privileges Windows does not grant by default, so the strong branch runs on CI —
 * where this is enforced — and the weak branch asserts the precondition it depends on. Neither is a
 * skip. This is the same shape as the tag-present branch in `release-resolution.test.mjs`, and for
 * the same reason: a test that quietly does nothing on the developer's machine is a test nobody
 * knows they have lost.
 */
test("a symbolic link inside the material is refused, not followed", async () => {
  const pack = await packCopy();
  const outside = await mkdtemp(path.join(tmpdir(), "hfn-outside-"));
  try {
    await writeFile(path.join(outside, "substituted.md"), "# bytes from elsewhere\n");

    let linked = true;
    try {
      await symlink(path.join(outside, "substituted.md"), path.join(pack, "standards", "43-linked.md"));
    } catch {
      linked = false;
    }

    const r = await materialise(pack);
    if (linked) {
      assert.equal(r.ok, false);
      assert.equal(r.reason, REASON.IRREGULAR_ENTRY);
      assert.match(r.detail, /43-linked\.md/);
    } else {
      assert.equal(r.ok, true, "without the link the same pack materialises normally");
      assert.ok(
        !byPath(r.material).has("standards/43-linked.md"),
        "the link was not created here, so nothing should have appeared under its path",
      );
    }
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

/**
 * The boundary guard, and the reason this file is worth more than its length.
 *
 * `MATERIAL` is a reviewed judgement about which bytes can change a verdict. Judgements go stale:
 * the CLI grows a new read from `ROOT`, nobody remembers this list, and identity is then established
 * over material that no longer includes something the verdict depends on — a false green of exactly
 * the kind FE-13 exists to remove, reintroduced by omission rather than by tampering.
 *
 * So the list is checked against the code rather than against itself. Mutation-tested: delete
 * `rules` from `MATERIAL` and this fails.
 */
test("every path the CLI reads from the pack is inside the material boundary", async () => {
  const source = await readFile(path.join(REPO, "scripts", "standards.mjs"), "utf8");
  const read = [...source.matchAll(/path\.join\(ROOT,\s*"([^"]+)"\)/g)].map((m) => m[1]);

  assert.ok(read.length >= 4, "the extractor found suspiciously little; has the ROOT idiom changed?");

  for (const rel of read) {
    assert.ok(
      MATERIAL.some((m) => rel === m || rel.startsWith(`${m}/`)),
      `scripts/standards.mjs reads ${rel}, which no MATERIAL entry covers: either it belongs in the ` +
        `boundary or the CLI should not be reading it to produce a verdict`,
    );
  }
});
