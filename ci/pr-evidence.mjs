#!/usr/bin/env node
/**
 * The local-CI evidence block in a pull request body, and the one safe way to replace it (ST-13).
 *
 * WHAT WENT WRONG WITHOUT THIS. `ci/submit-pr.sh` wrote the block when it created a request and never
 * again. Every later push left the old table in place, so an open request kept asserting the first
 * commit it had ever been verified against — a table headed **Verified commit** naming an object two
 * commits and one remediation behind the branch. Not a false green: a true one, pinned to the wrong
 * thing, on the surface a reviewer reads first.
 *
 * WHY THIS IS A MODULE AND NOT MORE SHELL. Replacing a region of someone's prose is the kind of edit
 * that destroys work when it is approximately right, so it wants tests that call it directly with
 * awkward bodies rather than tests that push branches. `test/pr-evidence.test.mjs` is those tests.
 *
 * THE CONTRACT, in one line each:
 *
 *   - the machine-written region is delimited by markers, never located by its heading;
 *   - a body with no region gains one;
 *   - a body whose region cannot be identified unambiguously is REFUSED, and nothing is written;
 *   - superseded verifications are kept, because what was verified when is the record's whole point.
 *
 * REFUSAL RATHER THAN A CLEVER GUESS. The heading is prose. A human may write "## Local CI" in their
 * own description, keep a copy of an old table, or paste the block twice. Any rule for picking the
 * "real" one is a rule for eventually picking wrong, and the cost of being wrong is a maintainer's
 * writing. `standards init` refuses to overwrite without an exact path for the same reason.
 */

import process from "node:process";

export const BEGIN = "<!-- local-ci:begin -->";
export const END = "<!-- local-ci:end -->";

const SUPERSEDED_HEADING = "Superseded, kept so the record shows what was verified when:";

/** One verified run, as the block records it. */
function row({ sha, stages, completedAt }) {
  return `- \`${sha}\` — ${stages} — ${completedAt}`;
}

/**
 * The block, markers included. `superseded` is newest-first: the run this block replaces comes
 * before the ones it had already replaced, so the list reads backwards through time like the git log
 * above it.
 */
export function evidenceBlock({ sha, stages, completedAt }, superseded = []) {
  const lines = [
    BEGIN,
    "",
    "---",
    "",
    "## Local CI",
    "",
    "| | |",
    "|---|---|",
    `| Verified commit | \`${sha}\` |`,
    "| Result | **PASS** |",
    "| Environment | Docker, no network, `ci/run-checks.sh` |",
    `| Stages | ${stages} |`,
    `| Completed | ${completedAt} |`,
    "",
    "Verified locally in an ephemeral Docker container, not by a GitHub-hosted Actions run.",
    "This says nothing about whether GitHub Actions has run or passed for this commit.",
  ];
  if (superseded.length > 0) {
    lines.push("", SUPERSEDED_HEADING, "", ...superseded);
  }
  lines.push("", END, "");
  return lines.join("\n");
}

/**
 * Read the runs an existing block records: the one it currently asserts, demoted, followed by the
 * ones it had already demoted. Parsing our own output rather than storing state elsewhere keeps the
 * body the single record — a sidecar file would be a second truth to go stale.
 *
 * A COMMIT CANNOT SUPERSEDE ITSELF, which is why `incoming` is passed in. Re-submitting the same SHA
 * is ordinary — a failed `gh pr edit` retried, an authentication restored, a verification re-run
 * deliberately without moving HEAD — and treating each of those as a supersession wrote the commit
 * into the list of things it had replaced, once per retry. The provenance stayed true and the
 * history went false, which is the harder of the two to notice. The already-superseded rows are
 * carried through untouched: they record what really was replaced, and a re-verification is not an
 * event in their story.
 */
function supersededFrom(block, incoming) {
  const out = [];
  const current = /\|\s*Verified commit\s*\|\s*`([^`]+)`\s*\|/.exec(block);
  if (current && current[1] !== incoming) {
    const stages = /\|\s*Stages\s*\|\s*([^|]*?)\s*\|/.exec(block);
    const completed = /\|\s*Completed\s*\|\s*([^|]*?)\s*\|/.exec(block);
    out.push(row({
      sha: current[1],
      stages: stages ? stages[1] : "unrecorded",
      completedAt: completed ? completed[1] : "unrecorded",
    }));
  }
  for (const line of block.split("\n")) {
    if (/^- `[^`]+` — /.test(line.trim())) out.push(line.trim());
  }
  return out;
}

const refuse = (error) => ({ error });

/**
 * Put `run`'s evidence into `body`, returning `{ body }` or `{ error }`. Never both, and a refusal
 * never returns a partially rewritten body — the caller must be unable to write something it was
 * told not to write.
 */
export function applyEvidence(body, run) {
  const text = body ?? "";
  const begins = text.split(BEGIN).length - 1;
  const ends = text.split(END).length - 1;

  if (begins !== ends) {
    return refuse(`the body has ${begins} begin marker(s) and ${ends} end marker(s); refusing to guess where the Local CI block is`);
  }
  if (begins > 1) {
    return refuse(`the body has ${begins} Local CI blocks; refusing to guess which one is current`);
  }
  if (begins === 0) {
    // A block written before the markers existed, or a heading a human wrote themselves. Both look
    // the same from here, and rewriting either by locating the heading is how prose gets destroyed.
    if (/^##\s+Local CI\s*$/m.test(text)) {
      return refuse(
        "the body contains a '## Local CI' heading that is not inside the markers, so it cannot be " +
          "located unambiguously; refusing to rewrite it",
      );
    }
    const separator = text.length === 0 || text.endsWith("\n") ? "" : "\n";
    return { body: `${text}${separator}\n${evidenceBlock(run)}` };
  }

  const start = text.indexOf(BEGIN);
  const stop = text.indexOf(END, start);
  if (stop < start) {
    return refuse("the Local CI end marker precedes its begin marker; refusing to rewrite it");
  }
  const before = text.slice(0, start);
  const after = text.slice(stop + END.length).replace(/^\n/, "");
  return { body: `${before}${evidenceBlock(run, supersededFrom(text.slice(start, stop), run.sha))}${after}` };
}

// ---------------------------------------------------------------------------------------------
// CLI: reads the existing body on stdin, writes the new one on stdout. A refusal writes the reason
// to stderr and exits 1, so the shell cannot mistake it for a body.
// ---------------------------------------------------------------------------------------------

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].split("\\").join("/")}`).href) {
  const [sha, stages, completedAt] = process.argv.slice(2);
  if (!sha || !stages || !completedAt) {
    process.stderr.write("usage: pr-evidence.mjs <sha> <stages> <completedAt> < existing-body\n");
    process.exit(2);
  }
  let stdin = "";
  for await (const chunk of process.stdin) stdin += chunk;
  const result = applyEvidence(stdin, { sha, stages, completedAt });
  if (result.error) {
    process.stderr.write(`${result.error}\n`);
    process.exit(1);
  }
  process.stdout.write(result.body);
}
