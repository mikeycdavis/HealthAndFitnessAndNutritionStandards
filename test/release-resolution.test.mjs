/**
 * FE-13 stage 1 — release RESOLUTION, tested on its own before anything depends on it.
 *
 * These are ordinary tests and they pass. They are not the falsifiers: `test/release-identity.test.mjs`
 * holds those, still `todo`, and they stay `todo` until the whole false-green path is gone.
 * Resolution alone does not close any of them — a resolved tag proves what `v1.0.0` designates, not
 * that the bytes being evaluated are it.
 *
 * The failure taxonomy is the interesting half. A primitive whose refusals are untested is a
 * primitive that will be trusted to refuse and won't.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRelease, gitIn, REASON } from "../scripts/release-identity.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A fake git: a map from joined argv to a result. Anything unlisted fails, as a stranger should. */
const fakeGit = (table) => (args) => table[args.join(" ")] ?? { status: 1, stdout: "", stderr: "" };

const OK = { status: 0, stdout: "", stderr: "" };
const COMMIT = "570c45b742204841821e5a2ba4dbc38e6069bdc0";
const TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

const healthy = {
  "rev-parse --git-dir": { status: 0, stdout: ".git\n" },
  "rev-parse --verify --quiet refs/heads/v1.0.0": { status: 1, stdout: "" },
  "rev-parse --verify --quiet refs/tags/v1.0.0": { status: 0, stdout: `${COMMIT}\n` },
  "cat-file -t refs/tags/v1.0.0": { status: 0, stdout: "tag\n" },
  "rev-parse refs/tags/v1.0.0^{commit}": { status: 0, stdout: `${COMMIT}\n` },
  "rev-parse refs/tags/v1.0.0^{tree}": { status: 0, stdout: `${TREE}\n` },
};

test("an annotated release tag resolves to a commit and a tree", () => {
  const r = resolveRelease("1.0.0", fakeGit(healthy));
  assert.equal(r.ok, true);
  assert.deepEqual(r.identity, {
    requestedRelease: "v1.0.0",
    ref: "refs/tags/v1.0.0",
    resolvedCommit: COMMIT,
    resolvedTree: TREE,
    annotated: true,
  });
});

/**
 * The original FE-13 sentence: no tooling may treat `1.0.0-dev`, `main`, or a certification candidate
 * as adoptable. These are refused on shape, before any repository is consulted — a version that
 * cannot designate a release should never reach the point of looking one up.
 */
for (const requested of ["1.0.0-dev", "main", "v1.0.0", "570c45b", "1.0", "", null, undefined]) {
  test(`${JSON.stringify(requested)} is not an adoptable release version`, () => {
    const r = resolveRelease(requested, fakeGit(healthy));
    assert.equal(r.ok, false);
    assert.equal(r.reason, REASON.NOT_A_RELEASE_VERSION);
  });
}

test("no repository means no identity, and no fallback to the local files", () => {
  const r = resolveRelease("1.0.0", fakeGit({}));
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.NO_REPOSITORY);
});

test("a missing release tag fails closed", () => {
  const r = resolveRelease(
    "1.0.0",
    fakeGit({ "rev-parse --git-dir": OK, "rev-parse --verify --quiet refs/heads/v1.0.0": { status: 1 } }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.TAG_NOT_FOUND);
});

/**
 * A tag and a branch of the same name both answer to `git rev-parse v1.0.0`, which picks one. A
 * release reference that two objects answer to is not a release reference, and one of the two is a
 * moving ref.
 */
test("a tag shadowed by a branch of the same name is ambiguous, not resolvable", () => {
  const r = resolveRelease(
    "1.0.0",
    fakeGit({ ...healthy, "rev-parse --verify --quiet refs/heads/v1.0.0": { status: 0, stdout: "deadbee\n" } }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.AMBIGUOUS_REF);
});

test("a lightweight tag carries no provenance and is refused", () => {
  const r = resolveRelease(
    "1.0.0",
    fakeGit({ ...healthy, "cat-file -t refs/tags/v1.0.0": { status: 0, stdout: "commit\n" } }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.UNANNOTATED_TAG);
});

test("a tag that does not resolve to both a commit and a tree fails closed", () => {
  const r = resolveRelease(
    "1.0.0",
    fakeGit({ ...healthy, "rev-parse refs/tags/v1.0.0^{tree}": { status: 1, stdout: "" } }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.reason, REASON.UNRESOLVABLE);
});

test("a failure never returns a partial identity", () => {
  for (const table of [{}, { ...healthy, "cat-file -t refs/tags/v1.0.0": { status: 1 } }]) {
    const r = resolveRelease("1.0.0", fakeGit(table));
    assert.equal(r.ok, false);
    assert.equal(r.identity, undefined, "half an identity is worse than none: callers read fields");
    assert.ok(r.reason && r.detail, "a refusal must be able to say what it refused and why");
  }
});

/**
 * Dogfooding, and a real finding about the environment that enforces this.
 *
 * `actions/checkout@v4` fetches one commit and no tags by default, so `refs/tags/v1.0.0` is absent on
 * CI even though it exists on the remote. That is not a bug in this function — refusing is exactly
 * right, because identity that cannot be proven is identity that is not established — but it means
 * VERIFICATION cannot run under the current workflow without `fetch-depth: 0` or an explicit tag
 * fetch. Recorded in FE-13; deliberately not fixed here, because changing the workflow to suit a
 * primitive nothing yet depends on would be the wrong order.
 *
 * Both branches assert something. Neither is a skip.
 */
test("against this repository, resolution either proves v1.0.0 or refuses for a stated reason", () => {
  const git = gitIn(REPO);
  const tagPresent = git(["rev-parse", "--verify", "--quiet", "refs/tags/v1.0.0"]).status === 0;
  const r = resolveRelease("1.0.0", git);

  if (tagPresent) {
    assert.equal(r.ok, true, `expected v1.0.0 to resolve here: ${r.reason} — ${r.detail}`);
    assert.match(r.identity.resolvedCommit, /^[0-9a-f]{40}$/);
    assert.match(r.identity.resolvedTree, /^[0-9a-f]{40}$/);
    assert.equal(
      r.identity.resolvedCommit,
      git(["rev-parse", "v1.0.0^{commit}"]).stdout.trim(),
      "the identity must be the one Git reports, not one this code assembled",
    );
  } else {
    assert.equal(r.ok, false);
    assert.equal(
      r.reason,
      REASON.TAG_NOT_FOUND,
      "a checkout without tags must fail closed, not resolve something else",
    );
  }
});
