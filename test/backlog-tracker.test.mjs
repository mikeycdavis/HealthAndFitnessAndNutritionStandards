/**
 * The tracker is derived, and this file is what makes that claim true rather than aspirational.
 *
 * WHY THIS FILE EXISTS. `artifacts/backlog/README.md` opened with "GENERATED FILE - do not edit by
 * hand" for sixteen days while no generator existed anywhere in this repository. It was hand-edited
 * the whole time, and it drifted in four independent ways at once: the headline read 12 of 25 (48%)
 * where the items gave 13 of 26 (50%); the status table summed to 38 across 39 items; the story
 * count omitted ST-14 entirely; and FE-17 rendered as in-progress while its frontmatter said
 * DEFERRED. Every one of those was a separate hand edit that nothing compared against anything.
 *
 * A comment claiming a file is generated is not a mechanism. This is the mechanism.
 *
 * THE LEGACY ALIAS IS TESTED EXPLICITLY, and it is the reason the arithmetic went wrong in the
 * first place. ST-13 carries `status: DONE` — the pre-Standard-8 spelling of COMPLETE, which the
 * validator still accepts. Whoever last updated the tracker by hand counted the canonical statuses
 * and dropped the one legacy row, which is exactly how 39 items became a table summing to 38 and
 * how a completed story vanished from the numerator. The generator normalises aliases in one
 * documented place (`STATUS_ALIASES`), and the fixture below proves the normalisation is real
 * rather than incidental: a DONE item must be *counted* and must *render* as Complete.
 *
 * TWO SURFACES, NOT ONE CONSTANT. The fixture writes `DONE` and asserts the tracker says
 * `Complete` — two different spellings that only agree if something translated between them. A
 * test that asked the generator for its own alias map and compared it to itself would report
 * agreement with itself.
 *
 * MUTATIONS RUN against `scripts/backlog.mjs`, each applied through a helper that exits non-zero
 * when the text it was told to replace is absent, because an unapplied mutation is indistinguishable
 * from a surviving one in the output:
 *
 *   mutation                                                          committed alias falsifier
 *   ----------------------------------------------------------------- --------- ----- ----------
 *   MB1  `done: "COMPLETE"` removed from STATUS_ALIASES                red       red   ok
 *   MB2  leaf progress counts items twice, not once                    red       red   red
 *   MB3  `--check` reports staleness but never exits 1                 ok        ok    red
 *   MB4  the Total row sums the rendered rows instead of counting      ok        ok    ok   <- survived
 *        the items
 *
 * MB2 WAS PREDICTED red/ok/ok AND CAME BACK red/red/red. The prediction is left visible rather than
 * quietly corrected: it was wrong because the mutation is coarser than the property it was aimed at,
 * and every fixture here has completed leaves, so all three see it. Recorded as observed.
 *
 * MB4 SURVIVED, and the reason matters more than a green row would have. `items.length` and the sum
 * of the rendered status rows are equal by construction — the table skips only zero-count statuses,
 * so nothing is ever dropped from the sum. No assertion can separate the two expressions, because
 * this code path cannot produce the discrepancy. The hand-maintained tracker's 38-against-39 was a
 * human miscount of a table nobody derived, which is precisely the failure the generator retires
 * rather than one it could reintroduce. Left in place, and not papered over with a fixture written
 * to redden the row.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR = path.join(REPO, "scripts", "backlog.mjs");

const run = (cwd, ...args) =>
  spawnSync(process.execPath, [GENERATOR, ...args], { cwd, encoding: "utf8" });

/**
 * A backlog of exactly the items a test names, in its own directory. Self-contained on purpose:
 * a fixture that pointed at the real `artifacts/backlog/` would change its answer every time
 * somebody closed a story, and the alias assertions below would then be measuring this repository's
 * current state rather than the generator's behaviour.
 */
async function scratchBacklog(items) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-backlog-"));
  // A parent must be exactly one level up, so every fixture needs the full spine down to the level
  // its stories hang from. These four are never leaves — each has a child — so they never enter the
  // progress arithmetic, which is what the assertions below count.
  items = {
    "TH-01": "id: TH-01\ntype: theme\ntitle: Scratch theme\nstatus: IN_PROGRESS\nopened: 2026-08-25",
    "IN-01": "id: IN-01\ntype: initiative\ntitle: Scratch initiative\nparent: TH-01\nstatus: IN_PROGRESS\nopened: 2026-08-25",
    "EP-01": "id: EP-01\ntype: epic\ntitle: Scratch epic\nparent: IN-01\nstatus: IN_PROGRESS\nopened: 2026-08-25",
    "FE-01": "id: FE-01\ntype: feature\ntitle: Scratch feature\nparent: EP-01\nstatus: IN_PROGRESS\nopened: 2026-08-25",
    ...items,
  };
  // The generator locates the project root by walking up for `.git` or `package.json`. Without one
  // it would climb out of the temp directory and find this repository, and the fixture would
  // silently become a second run against the real backlog.
  await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "scratch" }));
  const itemsDir = path.join(dir, "artifacts", "backlog", "items");
  await mkdir(itemsDir, { recursive: true });
  for (const [id, frontmatter] of Object.entries(items)) {
    await writeFile(path.join(itemsDir, `${id}.md`), `---\n${frontmatter}\n---\n\n## What\n\nScratch.\n`);
  }
  return dir;
}

const TRACKER = (dir) => readFileSync(path.join(dir, "artifacts", "backlog", "README.md"), "utf8");

// This repository's backlog moved to GitHub Issues, so there are no item files to derive a tracker
// from. The generator and its other tests still run; only this check has nothing to check.
const MAPPING = path.join(REPO, "artifacts", "backlog", "github-mapping.json");
const MOVED = existsSync(MAPPING) && JSON.parse(readFileSync(MAPPING, "utf8")).authority === "github";

test("the committed tracker is what the generator derives from the items", { skip: MOVED && "the backlog is in GitHub Issues; there are no item files" }, () => {
  // The whole point. If this goes red the tracker was committed stale, or somebody edited it by
  // hand — the two failure modes are the same failure and the remedy is the same: `npm run backlog`.
  const r = run(REPO, "--check");
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

// What replaces the check above once the backlog lives in GitHub: the record of where it lives has to
// be valid, and the local tooling must not quietly bring a second, empty backlog back.
test("the GitHub-authority mapping is valid, and no item files or generated items directory exist", { skip: !MOVED && "this repository's backlog is still in files" }, () => {
  const mapping = JSON.parse(readFileSync(MAPPING, "utf8"));
  assert.equal(mapping.authority, "github");
  assert.match(mapping.switchedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(mapping.source, mapping.target, "the backlog is in this repository's own issues");
  assert.ok(mapping.verifiedBy, "the switch records what verified it");
  const entries = Object.entries(mapping.items);
  assert.ok(entries.length > 0, "an empty mapping would make every id unresolvable");
  for (const [id, entry] of entries) {
    assert.match(id, /^(TH|IN|EP|FE|ST|TA)-\d+$/, id);
    assert.ok(Number.isInteger(entry.number) && Number.isInteger(entry.id), `${id} needs an issue number and id`);
  }
  assert.equal(existsSync(path.join(REPO, "artifacts", "backlog", "items")), false, "item files would be a second source of truth");
});

test("the local generator refuses on a GitHub-backed backlog and does not recreate an items directory", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "moved-"));
  try {
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "scratch" }));
    await mkdir(path.join(dir, "artifacts", "backlog"), { recursive: true });
    await writeFile(path.join(dir, "artifacts", "backlog", "github-mapping.json"), JSON.stringify({
      source: "acme/widgets", target: "acme/widgets", authority: "github", switchedAt: "2026-09-19", items: { "ST-01": { number: 1, id: 1 } },
    }));
    for (const args of [[], ["--check"], ["--json"]]) {
      const r = run(dir, ...args);
      assert.notEqual(r.status, 0, `${args.join(" ") || "(write mode)"} must refuse: ${r.stdout}`);
      assert.match(r.stdout + r.stderr, /GitHub Issues/);
    }
    assert.equal(existsSync(path.join(dir, "artifacts", "backlog", "items")), false, "the generator must not create one");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("the legacy DONE alias is counted and rendered as Complete, not dropped", async () => {
  const dir = await scratchBacklog({
    "ST-01": "id: ST-01\ntype: story\ntitle: Legacy spelling\nparent: FE-01\nstatus: DONE\nclosed: 2026-08-25\nopened: 2026-08-25\nevidence:\n  - deadbee",
    "ST-02": "id: ST-02\ntype: story\ntitle: Canonical spelling\nparent: FE-01\nstatus: COMPLETE\nclosed: 2026-08-25\nopened: 2026-08-25\nevidence:\n  - deadbee",
    "ST-03": "id: ST-03\ntype: story\ntitle: Still open\nparent: FE-01\nstatus: IN_PROGRESS\nopened: 2026-08-25",
  });
  try {
    assert.equal(run(dir).status, 0);
    const tracker = TRACKER(dir);

    // Counted: two of the three leaves are done, and the DONE one is the difference between 2/3
    // and 1/3. This is the assertion the hand-maintained tracker failed.
    assert.match(tracker, /\*\*2 of 3 leaf items complete — 67%\*\*/u, tracker);

    // Rendered canonically: the item says DONE, the tracker must say Complete. Two spellings that
    // agree only because something translated between them.
    assert.match(tracker, /\| ● Complete \| 2 \|/u, tracker);
    // Scoped to a status row on purpose. A bare /\bDone\b/ matches the "Done" column header of the
    // progress-by-theme table, which is unrelated to status rendering — that assertion went red
    // against a correct tracker on its first run.
    assert.doesNotMatch(
      tracker,
      /^\| [○◔◑◒◐●◌✕] Done \|/mu,
      "the legacy spelling must not reach the tracker as a status",
    );

    // And every item is represented — the status rows must sum to the item count, which is the
    // specific arithmetic that broke. Seven: the four spine items plus the three stories.
    const rows = [...tracker.matchAll(/^\| [○◔◑◒◐●◌✕] \w[\w ]*\| (\d+) \|$/gmu)].map((m) => Number(m[1]));
    assert.ok(rows.length >= 2, "the status table was not found");
    assert.equal(
      rows.reduce((a, b) => a + b, 0),
      7,
      "every item must appear in exactly one status row",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("FALSIFIER: a tracker that disagrees with the items fails --check", async () => {
  // Without this the first test is satisfied by a `--check` that returns 0 for anything, and the
  // regression guard would be a guard over nothing.
  const dir = await scratchBacklog({
    "ST-01": "id: ST-01\ntype: story\ntitle: Open work\nparent: FE-01\nstatus: IN_PROGRESS\nopened: 2026-08-25",
  });
  try {
    assert.equal(run(dir).status, 0, "the fixture must start consistent");
    assert.equal(run(dir, "--check").status, 0, "and --check must accept it");

    // Close the story in the items and leave the tracker alone — the exact drift this file exists
    // for, in the direction that flatters the project.
    await writeFile(
      path.join(dir, "artifacts", "backlog", "items", "ST-01.md"),
      "---\nid: ST-01\ntype: story\ntitle: Open work\nparent: FE-01\nstatus: COMPLETE\nclosed: 2026-08-25\nopened: 2026-08-25\nevidence:\n  - deadbee\n---\n\n## What\n\nScratch.\n",
    );
    const stale = run(dir, "--check");
    assert.equal(stale.status, 1, "a stale tracker must fail");
    assert.match(stale.stdout + stale.stderr, /out of date/iu);

    // `--check` must not have quietly fixed it. A check that writes is not a check, and CI would
    // then pass on a working tree it had modified.
    assert.match(TRACKER(dir), /\*\*0 of 1 leaf items complete/u, "--check must write nothing");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
