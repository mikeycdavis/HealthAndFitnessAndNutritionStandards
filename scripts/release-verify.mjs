/**
 * Release identity — stage 3 of 3: VERIFICATION.
 *
 * FE-13.
 *
 *   1. RESOLUTION      what immutable object does `v1.0.0` designate?    scripts/release-identity.mjs
 *   2. MATERIALISATION what bytes are we about to evaluate?              scripts/release-material.mjs
 *   3. VERIFICATION    are those bytes exactly the object resolved in 1? <- here
 *
 * This file compares. It resolves nothing and reads no working tree: it is given an identity from
 * stage 1 and a material list from stage 2, and it answers one question about them. Keeping it that
 * narrow is not tidiness — a function that could re-resolve the tag, or re-read a file it found
 * disagreeable, could always be tempted to fetch a comparison that succeeds.
 *
 * WHAT "THE SAME" MEANS HERE. Not "the same commit": a worktree at the right commit can still hold
 * modified or untracked bytes, and `git status` is the wrong instrument anyway, since the adopter's
 * own product code is legitimately dirty and is none of this feature's business. What is compared is
 * the reviewed material boundary — every path whose bytes can change a verdict — file by file, by
 * the object id Git records. Stage 2 already computes those ids Git's way for exactly this moment,
 * so nothing is converted here and no second identity scheme exists to disagree with the first.
 *
 * THREE WAYS TO DIFFER, AND ALL THREE ARE REJECTIONS. A file whose contents changed is the obvious
 * one. A file the release has and the material does not is a pack with a hole in it. A file the
 * material has and the release does not is an addition — the local guidance, the vendored patch, the
 * helpful extra rule — and it is the case a comparison written as "every released file is present
 * and matches" would wave through. The verdict is produced by the bytes that are there, not by the
 * bytes that were supposed to be.
 *
 * THE DIGEST IS A CONVENIENCE, NOT THE CHECK. `materialDigest` and `releaseDigest` summarise the two
 * sorted (path, oid) lists so an operator can compare one value by eye and so the envelope carries
 * something stable. Equal digests do imply equal lists, but the differences below are computed from
 * the lists themselves, because a mismatch has to be able to say which file and how.
 *
 * WHAT THIS STILL CANNOT DO, stated here rather than discovered later. The code performing the
 * comparison is inside the material being compared, so a substituted pack that also deleted this
 * file would simply never run it. Verification raises the cost of tampering; it cannot make an
 * evaluator self-guaranteeing. That property belongs to an adopter fetching a pack rather than being
 * handed one — FE-14, not a hash.
 */

import { createHash } from "node:crypto";

import { MATERIAL } from "./release-material.mjs";

/**
 * Why verification refused. As in stages 1 and 2, callers branch on these: a failure that cannot
 * name itself is indistinguishable from a failure nobody checked for.
 */
export const REASON = Object.freeze({
  TREE_UNREADABLE: "tree-unreadable",
  RELEASE_HAS_NO_MATERIAL: "release-has-no-material",
  IRREGULAR_RELEASE_ENTRY: "irregular-release-entry",
  MATERIAL_DIFFERS: "material-differs",
});

/** How a single path differs. Named, because "3 files differ" is not an answer to anything. */
export const DIFFERENCE = Object.freeze({
  CONTENT_DIFFERS: "content-differs",
  MISSING_FROM_MATERIAL: "missing-from-material",
  NOT_IN_RELEASE: "not-in-release",
});

/** Regular file and executable file. Anything else in a release tree is refused, not interpreted. */
const REGULAR_MODES = new Set(["100644", "100755"]);

/** Enough to identify the fault without turning a refusal into a wall of text. The count is exact. */
const MAX_REPORTED = 20;

const fail = (reason, detail, extra = {}) => ({ ok: false, reason, detail, ...extra });

/**
 * Read the release's material as Git recorded it, filtered to the reviewed boundary.
 *
 * `-z` rather than the default: Git quotes and escapes unusual path names in its ordinary output,
 * and a comparison that unquoted them itself would be a second parser of Git's format with its own
 * bugs, in the one place where being wrong is invisible.
 */
export function releaseMaterial(identity, git, { material = MATERIAL } = {}) {
  const listed = git(["ls-tree", "-r", "-z", identity.resolvedTree]);
  if (listed.status !== 0) {
    return fail(
      REASON.TREE_UNREADABLE,
      `the tree ${identity.resolvedTree} designated by ${identity.requestedRelease} could not be read. ` +
        `A resolvable tag whose object is absent is the shape of a shallow or partial clone, and it is ` +
        `a fail-closed case: the release is named but not present.`,
    );
  }

  const entries = [];
  for (const record of listed.stdout.split("\0")) {
    if (record === "") continue;

    // "<mode> SP <type> SP <oid> TAB <path>"
    const tab = record.indexOf("\t");
    if (tab === -1) {
      return fail(REASON.TREE_UNREADABLE, `unparseable ls-tree record: ${JSON.stringify(record)}`);
    }
    const [mode, type, oid] = record.slice(0, tab).split(" ");
    const filePath = record.slice(tab + 1);

    if (!inBoundary(filePath, material)) continue;

    if (type !== "blob" || !REGULAR_MODES.has(mode)) {
      return fail(
        REASON.IRREGULAR_RELEASE_ENTRY,
        `${filePath} is recorded in the release as mode ${mode} ${type}. A symlink or a submodule ` +
          `inside the material boundary supplies bytes the release does not itself contain, so its ` +
          `identity cannot be established by comparing this tree.`,
      );
    }
    entries.push({ path: filePath, oid });
  }

  if (entries.length === 0) {
    return fail(
      REASON.RELEASE_HAS_NO_MATERIAL,
      `${identity.requestedRelease} designates a tree containing none of the declared pack material. ` +
        `An empty comparison agrees with everything, which is why it is refused rather than passed.`,
    );
  }

  entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { ok: true, entries };
}

/**
 * Verify that materialised bytes are exactly the release resolved in stage 1.
 *
 * Returns `{ ok: true, verification }` or `{ ok: false, reason, detail, differences? }`. As with the
 * earlier stages there is no partial success: a comparison that got half way is a failure, because a
 * caller reading only the part that matched would be trusting the part that did not.
 */
export function verifyRelease({ identity, material, git, boundary = MATERIAL }) {
  const released = releaseMaterial(identity, git, { material: boundary });
  if (released.ok === false) return released;

  const releaseByPath = new Map(released.entries.map((e) => [e.path, e.oid]));
  const materialByPath = new Map(material.entries.map((e) => [e.path, e.oid]));

  const differences = [];

  for (const [filePath, releasedOid] of releaseByPath) {
    const localOid = materialByPath.get(filePath);
    if (localOid === undefined) {
      differences.push({ path: filePath, difference: DIFFERENCE.MISSING_FROM_MATERIAL, released: releasedOid });
    } else if (localOid !== releasedOid) {
      differences.push({
        path: filePath,
        difference: DIFFERENCE.CONTENT_DIFFERS,
        released: releasedOid,
        evaluated: localOid,
      });
    }
  }
  for (const [filePath, localOid] of materialByPath) {
    if (!releaseByPath.has(filePath)) {
      differences.push({ path: filePath, difference: DIFFERENCE.NOT_IN_RELEASE, evaluated: localOid });
    }
  }

  differences.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const releaseDigest = digest(released.entries);
  const materialDigest = digest(material.entries);

  if (differences.length > 0) {
    return fail(
      REASON.MATERIAL_DIFFERS,
      `${differences.length} file(s) of pack material differ from ${identity.requestedRelease}. The ` +
        `verdict would have been produced by these bytes, not by the release's, so the evaluation ` +
        `has no release identity to report.`,
      {
        differences: differences.slice(0, MAX_REPORTED),
        differenceCount: differences.length,
        releaseDigest,
        materialDigest,
      },
    );
  }

  return {
    ok: true,
    verification: {
      requestedRelease: identity.requestedRelease,
      ref: identity.ref,
      resolvedCommit: identity.resolvedCommit,
      resolvedTree: identity.resolvedTree,
      // Two names for one value once they match, kept as two fields because they are two claims:
      // what the release says its material is, and what we are about to evaluate.
      releaseDigest,
      materialDigest,
      files: material.entries.length,
      identity: "MATCH",
    },
  };
}

/** A path is material if it is a declared entry or lives beneath a declared directory. */
function inBoundary(filePath, material) {
  return material.some((m) => filePath === m || filePath.startsWith(`${m}/`));
}

/**
 * A stable summary of a sorted (path, oid) list.
 *
 * Deliberately not called a tree oid. It is not one: the material is a filtered subset of the
 * release tree, so no Git tree object corresponds to it, and naming it after one would invite
 * exactly the confusion between "an identifier we computed" and "an identifier Git recorded" that
 * FE-13 exists to remove.
 */
function digest(entries) {
  const h = createHash("sha256");
  for (const e of entries) h.update(`${e.path} ${e.oid}\n`);
  return `sha256:${h.digest("hex")}`;
}
