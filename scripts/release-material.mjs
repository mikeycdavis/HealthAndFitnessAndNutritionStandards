/**
 * Release identity — stage 2 of 3: MATERIALISATION.
 *
 * FE-13.
 *
 *   1. RESOLUTION      what immutable object does `v1.0.0` designate?      scripts/release-identity.mjs
 *   2. MATERIALISATION what bytes are we about to evaluate?                <- here
 *   3. VERIFICATION    are those bytes exactly the object resolved in 1?
 *
 * This file answers the second question and deliberately cannot answer the other two. It never takes
 * a version, never consults a tag, and never compares anything: it reports what is on disk. A
 * primitive that both gathers the bytes and judges them can always be tempted to gather bytes that
 * pass, which is a longer way of describing the defect FE-13 exists to remove.
 *
 * > **Materialisation may reuse bytes; it may not reuse trust.**
 *
 * A cache hit can avoid a download. It cannot avoid stage 3. Nothing here establishes identity —
 * `materialise()` succeeding means "these are the bytes", never "these are the right bytes".
 *
 * WHAT COUNTS AS PACK MATERIAL, AND WHY IT IS A DECLARED LIST. The identity check applies to the
 * standards pack, never to the adopter's own product code: adopters evaluate in-development work,
 * and that is the normal case, not a violation. This function is therefore given a pack root and
 * nothing else — it is structurally incapable of reading the adopter's tree, which is a stronger
 * guarantee than remembering not to. The tempting implementation, `git status --porcelain` over the
 * whole repository, is wrong for exactly that reason.
 *
 * `MATERIAL` below is the reviewed boundary: every path whose bytes can change a verdict. Prose
 * about the pack (README, CHANGELOG, the backlog, the design docs) is outside it — not because it
 * does not matter, but because nothing in an evaluation reads it, and a boundary that includes
 * everything is a boundary that fails on every unrelated edit and is then widened until it means
 * nothing. `test/release-materialisation.test.mjs` checks this list against what the CLI actually
 * reads, so it cannot silently go stale as the CLI grows.
 *
 * WHY GIT BLOB IDENTITY. Stage 3 has to compare these bytes with a Git tree. Hashing them any other
 * way would mean inventing a second normative identity — the thing FE-13 already ruled out — and
 * then translating between the two at exactly the point where a mistake is invisible. So a file's
 * identity here is the object id Git would give it: `sha1("blob " + length + "\0" + contents)`.
 * Nothing else in this repository needs to know that, and stage 3 will not have to convert anything.
 *
 * THE LIMIT WORTH STATING PLAINLY. `scripts/` is included, so a substituted evaluator is material
 * that fails verification like any other. But the code doing the checking is the code being checked:
 * a substituted pack that also removed the check would not run it at all. Materialisation raises the
 * cost of tampering; it does not make an evaluator self-guaranteeing, and no arrangement of this code
 * could. That is a property of the adopter running a pack it fetched rather than one it was handed,
 * and it belongs in the adoption procedure (FE-14), not in a hash.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Why materialisation refused. As with resolution, callers branch on these, and a failure that
 * cannot name itself is indistinguishable from one that was never checked for.
 */
export const REASON = Object.freeze({
  NOT_A_DIRECTORY: "not-a-directory",
  MISSING_MATERIAL: "missing-material",
  NO_MATERIAL: "no-material",
  IRREGULAR_ENTRY: "irregular-entry",
  UNREADABLE: "unreadable",
});

/**
 * The reviewed material boundary: every pack path whose bytes can change a verdict.
 *
 * Files and directories both; directories are walked in full. Ordering here is irrelevant — the
 * result is sorted — but it is kept alphabetical so a diff adding one is obvious.
 */
export const MATERIAL = Object.freeze([
  "PROHIBITIONS.md",
  "VERSION",
  "artifacts/rule-inventory.json",
  "artifacts/standards-source-inventory.json",
  "rules",
  "schemas",
  "scripts",
  "standards",
  "templates",
]);

const fail = (reason, detail) => ({ ok: false, reason, detail });

/** The object id Git would record for these bytes. Not our scheme; theirs, so stage 3 can compare. */
export function blobOid(bytes) {
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

/**
 * Enumerate the standards-pack material at `packRoot` and give every file its Git blob identity.
 *
 * Returns `{ ok: true, material }` or `{ ok: false, reason, detail }`, and — as with resolution —
 * never a partial result: material that enumerated half way is a failure, because a caller comparing
 * a truncated file list against a tree would find every missing file agreeable.
 *
 * `material.entries` is sorted by `path`, which is always POSIX-separated regardless of platform:
 * Git tree paths are, and stage 3 compares against Git.
 */
export async function materialise(packRoot, { material = MATERIAL } = {}) {
  const root = path.resolve(packRoot);

  const rootStat = await stat(root).catch(() => null);
  if (!rootStat?.isDirectory()) {
    return fail(REASON.NOT_A_DIRECTORY, `${root} is not a directory, so there is nothing to evaluate.`);
  }

  const entries = [];

  for (const rel of material) {
    const absolute = path.join(root, rel);
    const info = await stat(absolute).catch(() => null);

    if (!info) {
      return fail(
        REASON.MISSING_MATERIAL,
        `${rel} is declared pack material and is absent. A pack missing part of itself is not a ` +
          `release with a gap; it is a pack whose identity cannot be established.`,
      );
    }

    const collected = info.isDirectory() ? await walk(absolute, rel) : await one(absolute, rel, info);
    if (collected.ok === false) return collected;
    entries.push(...collected.entries);
  }

  if (entries.length === 0) {
    return fail(REASON.NO_MATERIAL, "no pack material was found, and an empty pack evaluates nothing.");
  }

  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  return {
    ok: true,
    material: {
      root,
      entries,
      count: entries.length,
      totalBytes: entries.reduce((n, e) => n + e.bytes, 0),
    },
  };
}

/** One file. `info` is its already-taken stat, so the regular-file check is not re-raced. */
async function one(absolute, rel, info) {
  if (!info.isFile()) {
    return fail(
      REASON.IRREGULAR_ENTRY,
      `${rel} is neither a regular file nor a directory. Git records such entries differently, and a ` +
        `link is a reference to bytes rather than the bytes themselves.`,
    );
  }
  const bytes = await readFile(absolute).catch((e) => e);
  if (!Buffer.isBuffer(bytes)) {
    return fail(REASON.UNREADABLE, `${rel} could not be read: ${bytes.message}. Unread bytes are unproven bytes.`);
  }
  return { ok: true, entries: [{ path: toPosix(rel), oid: blobOid(bytes), bytes: bytes.length }] };
}

/**
 * Walk a material directory in full.
 *
 * Symlinks are refused rather than followed. A followed link is bytes from somewhere the release
 * does not cover, wearing a path that the release does — which is precisely the substitution this
 * whole feature exists to detect, arriving through the mechanism meant to detect it.
 */
async function walk(absolute, rel) {
  const entries = [];
  const dirents = await readdir(absolute, { withFileTypes: true }).catch((e) => e);
  if (!Array.isArray(dirents)) {
    return fail(REASON.UNREADABLE, `${rel} could not be listed: ${dirents.message}.`);
  }

  for (const dirent of dirents) {
    const childRel = `${rel}/${dirent.name}`;
    const childAbs = path.join(absolute, dirent.name);

    if (dirent.isSymbolicLink()) {
      return fail(
        REASON.IRREGULAR_ENTRY,
        `${childRel} is a symbolic link. It is refused rather than followed: a link supplies bytes ` +
          `from outside the material under a path inside it.`,
      );
    }
    if (dirent.isDirectory()) {
      const nested = await walk(childAbs, childRel);
      if (nested.ok === false) return nested;
      entries.push(...nested.entries);
      continue;
    }
    if (!dirent.isFile()) {
      return fail(REASON.IRREGULAR_ENTRY, `${childRel} is neither a regular file nor a directory.`);
    }

    const bytes = await readFile(childAbs).catch((e) => e);
    if (!Buffer.isBuffer(bytes)) {
      return fail(REASON.UNREADABLE, `${childRel} could not be read: ${bytes.message}.`);
    }
    entries.push({ path: toPosix(childRel), oid: blobOid(bytes), bytes: bytes.length });
  }

  return { ok: true, entries };
}

const toPosix = (rel) => rel.split(path.sep).join("/");
