/**
 * Release identity — stage 1 of 3: RESOLUTION.
 *
 * FE-13. A standards evaluation is release-identified only when the evaluator can prove that the
 * exact standards tree it is using is the tree designated by the immutable release reference the
 * adopter declared. That is three separate questions, and this file answers only the first:
 *
 *   1. RESOLUTION      what immutable object does `v1.0.0` designate?        <- here
 *   2. MATERIALISATION what bytes are we about to evaluate?
 *   3. VERIFICATION    are those bytes exactly the object resolved in 1?
 *
 * They are kept apart on purpose. Collapsing them is how the defect being fixed came about: a policy
 * claiming `standardVersion: "1.0.0"`, a catalog loaded from wherever the CLI lives, and a report
 * asserting the first about the second. `standardVersion` is the REQUESTED identity. It is not
 * evidence, and nothing in this file treats it as evidence.
 *
 * WHY GIT OBJECT IDENTITY rather than a content manifest of our own. `v1.0.0` already designates a
 * commit and a tree, under a cryptographic identity that predates this repository and is not ours to
 * define. Inventing a second normative source of truth would mean maintaining it, agreeing it with
 * adopters, and defending it — for a property Git already provides.
 *
 * NOTHING HERE IS WIRED INTO `check`, deliberately. Resolution has to have independently tested
 * failure semantics before a verdict is allowed to depend on it. The rule this slice observes: a
 * primitive that cannot state precisely why it refused is not ready to be trusted by something that
 * refuses on its behalf.
 */

import { spawnSync } from "node:child_process";

/**
 * Why resolution refused. These are part of the contract: callers will branch on them, and a failure
 * that cannot name itself is indistinguishable from a failure that was never checked for.
 */
export const REASON = Object.freeze({
  NOT_A_RELEASE_VERSION: "not-a-release-version",
  NO_REPOSITORY: "no-repository",
  TAG_NOT_FOUND: "tag-not-found",
  AMBIGUOUS_REF: "ambiguous-ref",
  UNANNOTATED_TAG: "unannotated-tag",
  UNRESOLVABLE: "unresolvable",
});

/** A release version is exactly `MAJOR.MINOR.PATCH`. `1.0.0-dev`, `main`, and a bare sha are not. */
const RELEASE_VERSION = /^\d+\.\d+\.\d+$/;

const fail = (reason, detail) => ({ ok: false, reason, detail });

/**
 * Resolve a declared release version to the immutable Git object it designates.
 *
 * Pure with respect to the filesystem: `git` is injected as `(args) => { status, stdout }`, so the
 * whole failure taxonomy is testable without constructing a repository per case. `gitIn()` supplies
 * the real one.
 *
 * Returns `{ ok: true, identity }` or `{ ok: false, reason, detail }`. It never throws for an
 * expected condition, and never returns a partial identity: an identity that resolved half way is a
 * failure, because a caller that reads only some of the fields would be trusting the rest.
 */
export function resolveRelease(requestedVersion, git) {
  if (typeof requestedVersion !== "string" || !RELEASE_VERSION.test(requestedVersion)) {
    return fail(
      REASON.NOT_A_RELEASE_VERSION,
      `${JSON.stringify(requestedVersion)} is not an adoptable release version. A prerelease such as ` +
        `1.0.0-dev, a branch such as main, and a certification candidate are all deliberately not adoptable.`,
    );
  }

  const tag = `v${requestedVersion}`;

  const inRepo = git(["rev-parse", "--git-dir"]);
  if (inRepo.status !== 0) {
    return fail(
      REASON.NO_REPOSITORY,
      "no Git repository is available here, so no release identity can be established. This is a " +
        "fail-closed case, not a reason to fall back to the local files.",
    );
  }

  // A tag and a branch of the same name both resolve; `git rev-parse v1.0.0` would silently pick one.
  // A release reference that two objects answer to is not a release reference.
  const asBranch = git(["rev-parse", "--verify", "--quiet", `refs/heads/${tag}`]);
  const asTag = git(["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`]);

  if (asTag.status !== 0) {
    return fail(
      REASON.TAG_NOT_FOUND,
      `refs/tags/${tag} does not exist here. Note that a shallow clone without tags reaches this ` +
        `case, which is correct: identity that cannot be proven is identity that is not established.`,
    );
  }
  if (asBranch.status === 0) {
    return fail(
      REASON.AMBIGUOUS_REF,
      `both refs/tags/${tag} and refs/heads/${tag} exist; the release reference is ambiguous and a ` +
        `branch is not immutable.`,
    );
  }

  // Annotated tags carry a tagger, a date, and a message — provenance a lightweight tag has none of.
  // Neither is immutable against a determined push, but only one records that it was ever made.
  const type = git(["cat-file", "-t", `refs/tags/${tag}`]);
  if (type.status !== 0) {
    return fail(REASON.UNRESOLVABLE, `refs/tags/${tag} exists but its object could not be read.`);
  }
  if (type.stdout.trim() !== "tag") {
    return fail(
      REASON.UNANNOTATED_TAG,
      `refs/tags/${tag} is a lightweight tag. A release reference must carry its own provenance.`,
    );
  }

  const commit = git(["rev-parse", `refs/tags/${tag}^{commit}`]);
  const tree = git(["rev-parse", `refs/tags/${tag}^{tree}`]);
  if (commit.status !== 0 || tree.status !== 0) {
    return fail(REASON.UNRESOLVABLE, `refs/tags/${tag} does not resolve to a commit and a tree.`);
  }

  return {
    ok: true,
    identity: {
      requestedRelease: tag,
      ref: `refs/tags/${tag}`,
      resolvedCommit: commit.stdout.trim(),
      resolvedTree: tree.stdout.trim(),
      annotated: true,
    },
  };
}

/** The real runner, rooted at a directory. Zero dependencies: `git` is invoked, not wrapped. */
export function gitIn(root) {
  return (args) => {
    const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    return { status: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
  };
}
