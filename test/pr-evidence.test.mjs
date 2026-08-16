/**
 * ST-13 — the pull request evidence block, and the stale provenance it was manufacturing.
 *
 * `ci/submit-pr.sh` wrote a `## Local CI` table naming the commit a container had verified, and wrote
 * it on the create path only. Every push after the first left the old table in place, so an open
 * request kept asserting the first commit it was ever verified against. PR #2 carried `f56c7e1`
 * under a table naming `b70d798` — two commits and one remediation earlier, describing a design the
 * branch no longer had. Independent review caught it; the body was then corrected by hand three
 * times, which is the sound a mechanism makes when it is missing.
 *
 * Not a false green. A true one, pinned to the wrong object — the same class as the defect FE-13
 * exists to remove, on the surface a reviewer reads first.
 *
 * WHY THE BLOCK IS DELIMITED BY MARKERS rather than located by its heading. The heading is prose: a
 * human may write "## Local CI" in their own description, or edit the table, or paste a second copy.
 * A rewrite that guesses which of those it is looking at will eventually destroy someone's writing.
 * Markers make the machine-written region unambiguous, and anything ambiguous is refused rather than
 * guessed — the same contract `standards init --force-overwrite` has, for the same reason.
 *
 * WHY SUPERSEDED ROWS ARE KEPT. A request whose body shows what was verified at each push is a
 * better record than one showing only the latest, and this repository already prefers keeping
 * superseded content beside its correction to replacing it.
 *
 * MUTATIONS RUN AGAINST THESE, from a committed baseline. Columns are the tests below, in order,
 * and the last is the end-to-end submission test in `test/local-ci.test.mjs`.
 *
 *   mutation                                                  stale prose ambig dup absent hist submit
 *   the existing block is left alone and the new one appended    x    x    ok   ok   ok     x     x
 *   the whole body is replaced by the block                      ok   x    ok   ok   ok     ok    x
 *   an unmarked body is rewritten by locating the heading        ok   ok   x    ok   ok     ok    x
 *   a second marker pair is treated as the first                 ok   ok   ok   x    ok     ok    ok
 *   superseded rows are dropped on update                        ok   ok   ok   ok   ok     x     x
 *
 * Five mutations, five distinct signatures, none leaving the set green.
 *
 * The first row is wider than predicted, and the extra column is the useful part: appending rather
 * than replacing also reddens the prose test, because that test asserts *exactly one* machine region
 * rather than merely that the prose survived. Two blocks would have left the prose intact and the
 * body ambiguous — which is the state this module refuses to touch on the next push, so a mutation
 * that produced it would have quietly disabled every later update.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { applyEvidence, evidenceBlock, BEGIN, END } from "../ci/pr-evidence.mjs";

const RUN_A = { sha: "aaaaaaa1111111111111111111111111111111a1", stages: "tests, audit", completedAt: "2026-08-16T10:00:00Z" };
const RUN_B = { sha: "bbbbbbb2222222222222222222222222222222b2", stages: "tests, audit, maintain", completedAt: "2026-08-16T20:00:00Z" };

const PROSE = "A description a human wrote.\n\nIt has paragraphs, and one of them mentions Local CI in passing.\n";

/** A body as the create path would have produced it. */
const created = (run) => `${PROSE}\n${evidenceBlock(run)}`;

function updated(body, run) {
  const result = applyEvidence(body, run);
  assert.equal(result.error, undefined, `expected an update, got refusal: ${result.error}`);
  return result.body;
}

test("FALSIFIER: a body verified at one commit does not keep asserting it after another", () => {
  const body = updated(created(RUN_A), RUN_B);
  assert.match(body, new RegExp(`\\| Verified commit \\| \`${RUN_B.sha}\` \\|`));
  assert.doesNotMatch(
    body,
    new RegExp(`\\| Verified commit \\| \`${RUN_A.sha}\` \\|`),
    "the superseded commit may be recorded as superseded, never as the verified commit",
  );
  assert.match(body, new RegExp(RUN_B.stages));
  assert.match(body, new RegExp(RUN_B.completedAt));
});

test("prose above the block survives an update byte for byte", () => {
  const body = updated(created(RUN_A), RUN_B);
  assert.equal(body.slice(0, PROSE.length), PROSE, "the human's description is not the machine's to edit");
  assert.equal(body.indexOf(BEGIN), body.lastIndexOf(BEGIN), "exactly one machine region");
  assert.equal(body.indexOf(END), body.lastIndexOf(END));
});

test("an unmarked body that already mentions the block is refused, not guessed at", () => {
  const legacy = `${PROSE}\n---\n\n## Local CI\n\n| | |\n|---|---|\n| Verified commit | \`${RUN_A.sha}\` |\n`;
  const result = applyEvidence(legacy, RUN_B);
  assert.ok(result.error, "a block written before the markers existed cannot be located unambiguously");
  assert.equal(result.body, undefined, "a refusal writes nothing");
  assert.match(result.error, /Local CI/);
});

test("a body carrying two machine regions is refused rather than half-rewritten", () => {
  const doubled = `${PROSE}\n${evidenceBlock(RUN_A)}\n${evidenceBlock(RUN_A)}`;
  const result = applyEvidence(doubled, RUN_B);
  assert.ok(result.error, "two regions means the file is not in a state this can reason about");
  assert.equal(result.body, undefined);
});

test("a body with no block at all gains one, rather than silently doing nothing", () => {
  const body = updated(PROSE, RUN_B);
  assert.equal(body.slice(0, PROSE.length), PROSE);
  assert.match(body, new RegExp(`\\| Verified commit \\| \`${RUN_B.sha}\` \\|`));
});

test("superseded verifications accumulate, so the record shows what was verified when", () => {
  const once = updated(created(RUN_A), RUN_B);
  const run_c = { sha: "ccccccc3333333333333333333333333333333c3", stages: "tests", completedAt: "2026-08-16T22:00:00Z" };
  const twice = updated(once, run_c);

  assert.match(twice, new RegExp(`\\| Verified commit \\| \`${run_c.sha}\` \\|`));
  for (const superseded of [RUN_A, RUN_B]) {
    assert.match(twice, new RegExp(superseded.sha), `${superseded.sha} must survive as a superseded row`);
  }
  assert.equal(
    twice.match(new RegExp(RUN_A.sha, "g")).length,
    1,
    "a superseded commit appears once, not once per subsequent push",
  );
});
