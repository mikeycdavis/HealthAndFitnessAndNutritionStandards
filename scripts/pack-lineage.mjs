/**
 * Self-maintenance eligibility — is this working tree part of this pack's certified release lineage?
 *
 * FE-13 sanctions exactly one path around release identity: the pack maintaining itself. `main` is
 * ahead of the tag it publishes by construction, so a development pack can never match the release it
 * declares, and requiring it to would make the repository's own gate unachievable — after which the
 * requirement gets relaxed rather than met. That much is sound. The question this file answers is the
 * one independent review of PR #2 found unanswered: WHO IS ELIGIBLE.
 *
 * WHAT WAS WRONG. Eligibility was `path.resolve(root) === ROOT`, and `ROOT` is derived from the
 * evaluator module's own location. That does not say "this is the standards pack". It says "this
 * directory is wherever the evaluator happens to be" — which anybody who copies the evaluator into a
 * directory they control satisfies for free, with no history, no tag, and no relationship to these
 * standards at all. The reviewer's words: an adopter can copy or fork the evaluator and arrange for
 * its controlled project to be that evaluator's root.
 *
 * WHAT IS REQUIRED NOW. Three facts, all about Git objects rather than about paths:
 *
 *   1. the certified release tag named in scripts/certified-releases.json exists here,
 *   2. it is annotated and resolves to EXACTLY the commit oid recorded there, and
 *   3. HEAD descends from that commit.
 *
 * Requiring only that some annotated `v1.0.0` exist would be satisfied by `git tag -a v1.0.0`, which
 * costs one command. The recorded oid is what turns the check from a question about spelling into a
 * question about history, and (3) is what makes it a question about THIS history rather than about a
 * repository that merely contains the object somewhere.
 *
 * WHAT THIS STILL DOES NOT ESTABLISH, said here rather than in a commit message nobody reads: a fork
 * of this repository possesses every byte the original does — this file, the recorded oid, the tag,
 * and the lineage — so nothing running inside the evaluator distinguishes a fork from the pack. That
 * residual is real and is not closed here. It is made worthless instead: what eligibility buys is a
 * self-maintenance outcome, which is not a compliance verdict and cannot be consumed as one. ADR 0009
 * carries the full argument, including the one mechanism that would close it (tag signature
 * verification against a key the fork does not hold) and why that is not in this slice.
 *
 * The two failure kinds are kept apart because they mean different things to the operator:
 *
 *   CONTRADICTED  the evidence is present and says something else — a tag of the certified name
 *                 pointing at another object. Somebody made that. It is a Standard 42 matter.
 *   UNAVAILABLE   the evidence is absent — no repository, no tags, a shallow clone. Nobody has done
 *                 anything wrong; the claim simply cannot be established, and unestablished fails
 *                 closed. Accusing this case of manipulation would be a false accusation.
 */

export const LINEAGE = Object.freeze({
  NO_REPOSITORY: "no-repository",
  TAG_MISSING: "lineage-tag-missing",
  CONTRADICTED: "lineage-contradicted",
  NOT_DESCENDED: "lineage-not-descended",
  RECORD_UNREADABLE: "lineage-record-unreadable",
});

/** `contradicted` reaches exit 3; `unavailable` reaches exit 5. Nothing else may be added silently. */
const contradicted = (reason, detail) => ({ ok: false, kind: "contradicted", reason, detail });
const unavailable = (reason, detail) => ({ ok: false, kind: "unavailable", reason, detail });

/**
 * Decide whether `git`'s repository is part of the lineage `record` describes.
 *
 * `git` is injected as `(args) => { status, stdout }` exactly as in release-identity.mjs, so the whole
 * taxonomy is testable without building a repository per case. The record is passed in rather than
 * read here: a module that reads its own authority off disk cannot be tested against a record it does
 * not agree with, and disagreement is the interesting case.
 */
export function packLineage(git, record) {
  const certified = record?.certified;
  const entry = certified ? record?.releases?.[certified] : null;
  if (!entry || typeof entry.commit !== "string" || typeof entry.tag !== "string") {
    return contradicted(
      LINEAGE.RECORD_UNREADABLE,
      "scripts/certified-releases.json does not name a certified release with a tag and a commit. " +
        "Eligibility for self-maintenance is decided against that record, so an unreadable record is " +
        "not a reason to proceed without one.",
    );
  }

  if (git(["rev-parse", "--git-dir"]).status !== 0) {
    return unavailable(
      LINEAGE.NO_REPOSITORY,
      "there is no Git repository here, so this tree cannot show it belongs to the standards pack's " +
        "release lineage. A copy of the evaluator is not the pack; it is a copy of the evaluator.",
    );
  }

  const tagRef = `refs/tags/${entry.tag}`;
  if (git(["rev-parse", "--verify", "--quiet", tagRef]).status !== 0) {
    return unavailable(
      LINEAGE.TAG_MISSING,
      `${tagRef} is not present here. A shallow clone reaches this case, which is correct: the ` +
        `history that would establish the lineage is simply absent.`,
    );
  }

  const type = git(["cat-file", "-t", tagRef]);
  const commit = git(["rev-parse", `${tagRef}^{commit}`]);
  if (type.status !== 0 || commit.status !== 0) {
    return unavailable(LINEAGE.TAG_MISSING, `${tagRef} exists but its object could not be read.`);
  }

  const found = commit.stdout.trim();
  if (found !== entry.commit) {
    return contradicted(
      LINEAGE.CONTRADICTED,
      `${tagRef} resolves to ${found}, but the certified ${certified} release is ${entry.commit}. A tag ` +
        `of the certified name pointing at a different object is a claim about identity that the ` +
        `history does not support, and self-maintenance is not granted on a claim ` +
        `(integrity.no-standards-manipulation, Standard 42).`,
    );
  }
  if (entry.annotated === true && type.stdout.trim() !== "tag") {
    return contradicted(
      LINEAGE.CONTRADICTED,
      `${tagRef} is recorded as an annotated tag and is not one here. The release reference has been ` +
        `replaced by something that answers to its name without carrying its provenance.`,
    );
  }

  const head = git(["rev-parse", "HEAD"]);
  if (head.status !== 0) {
    return unavailable(LINEAGE.NO_REPOSITORY, "HEAD does not resolve, so there is no working line to place.");
  }
  if (git(["merge-base", "--is-ancestor", entry.commit, "HEAD"]).status !== 0) {
    return unavailable(
      LINEAGE.NOT_DESCENDED,
      `HEAD does not descend from the certified ${certified} release (${entry.commit}). Holding the ` +
        `release object somewhere in the repository is not the same as continuing its line of work, ` +
        `and self-maintenance is a claim about the second.`,
    );
  }

  return {
    ok: true,
    lineage: {
      certifiedRelease: certified,
      tag: entry.tag,
      certifiedCommit: entry.commit,
      head: head.stdout.trim(),
      descends: true,
    },
  };
}
