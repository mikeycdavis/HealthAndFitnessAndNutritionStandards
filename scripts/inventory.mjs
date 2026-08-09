#!/usr/bin/env node
/**
 * Prove that the standards series has not silently changed shape.
 *
 * WHY THIS EXISTS. "Did I cover everything?" is a memory exercise unless something checks it. A
 * comparable system extracted its series with a regex, got a number that was one short because a
 * single item was formatted differently from its siblings, and wrote that number into three
 * documents as a fact about the world. It was a fact about the regex.
 *
 * So the fix is not a better regex. It is that THE INVENTORY IS NOT DERIVED ON EVERY RUN.
 * `artifacts/standards-source-inventory.json` was reviewed by a human once and committed as the
 * canonical enumeration. This script extracts from the specification and compares the result
 * *against* that file. A parser that becomes more or less forgiving cannot redefine how many
 * standards exist — it can only disagree with the inventory, and disagreeing fails.
 *
 * The same property is what makes this tamper evidence rather than merely a typo check (ADR 0003):
 * a standard cannot be quietly dropped from the series, because dropping it requires editing a
 * reviewed file, and that edit is a visible line in a diff.
 *
 * TWO DIFFERENT QUESTIONS, kept apart:
 *
 *   1. Has the series changed shape?  Missing, unknown, duplicated, or renamed numbers; a count
 *      that disagrees with the list; a standards file no inventory entry claims. Always a failure.
 *
 *   2. Is every standard written yet?  An `implementedBy` path that does not resolve. During
 *      construction this is ordinary progress. At a release version it is a defect, because a
 *      released series that does not exist is a false claim.
 *
 * Strictness for (2) is tied to VERSION rather than to a command-line flag: a prerelease version
 * (`1.0.0-dev`) reports unimplemented standards as progress; a release version (`1.0.0`) fails on
 * them. A flag would work too, right up until someone left it on.
 *
 * STRUCTURE. `analyse()` is pure — it takes the inventory, the specification text, the list of
 * standards files, and the version, and returns a report. `main()` does the IO and the rendering
 * and runs only when this file is invoked directly. That split exists so the mutation tests can
 * call `analyse()` with a deliberately broken inventory and assert it objects, rather than testing
 * the guard only through its command-line skin.
 *
 * Usage:
 *   node scripts/inventory.mjs           report, exit 1 on any problem
 *   node scripts/inventory.mjs --json    machine-readable
 *
 * Exit: 0 clean · 1 a problem was found · 2 could not evaluate.
 * No third-party dependencies.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Deliberately forgiving: an optional Markdown heading prefix, any leading whitespace. If this is
 * ever tightened or loosened, the comparison against the reviewed inventory is what catches the
 * consequence.
 */
const ITEM_RE = /^#{0,3}\s*(\d{1,2})\.\s+([A-Z][^\n]{2,60})$/gm;

/**
 * Top-level items ascend monotonically through the document; a number lower than the last accepted
 * one is a nested list inside an item, not a standard. A number equal to the last accepted one is a
 * genuine duplicate heading and is reported.
 *
 * The unnumbered must-never lists cannot match this pattern at all, which is why they are carried
 * into the specification unnumbered (ADR 0004) — numbering them would put 34 spurious entries into
 * this extraction.
 */
export function extract(sourceText) {
  const found = new Map();
  const duplicates = [];
  let last = 0;
  for (const m of sourceText.matchAll(ITEM_RE)) {
    const number = Number(m[1]);
    const title = m[2].trim();
    if (number === last) {
      duplicates.push({ number, title });
    } else if (number > last) {
      found.set(number, title);
      last = number;
    }
    // number < last: nested list inside the current item — not a standard.
  }
  return { found, duplicates };
}

/** A release version demands a complete series; a prerelease does not. */
export function isPrerelease(version) {
  return version.includes("-");
}

/**
 * Pure. `standardFiles` is a list of bare filenames from `standards/`; `exists` answers whether a
 * repository-relative path resolves, injected so tests need no filesystem.
 */
export function analyse({ inventory, sourceText, standardFiles, version, exists }) {
  const prerelease = isPrerelease(version);
  const { found, duplicates } = extract(sourceText);

  const expected = new Map(inventory.standards.map((s) => [s.number, s.title]));
  const missing = [...expected.keys()].filter((n) => !found.has(n)).sort((a, b) => a - b);
  const unknown = [...found.keys()].filter((n) => !expected.has(n)).sort((a, b) => a - b);
  const titleMismatches = [...expected.entries()]
    .filter(([n, t]) => found.has(n) && found.get(n) !== t)
    .map(([n, t]) => ({ number: n, expected: t, found: found.get(n) }));

  const claimed = inventory.standards.filter((s) => s.implementedBy);
  const unimplemented = claimed.filter((s) => !exists(s.implementedBy)).map((s) => s.implementedBy);
  const unclaimedFiles = standardFiles
    .map((f) => `standards/${f}`)
    .filter((p) => !claimed.some((s) => s.implementedBy === p));

  const countMismatch = inventory.expectedCount !== inventory.standards.length;
  const detectedMismatch = inventory.expectedCount !== found.size;

  const shapeProblems =
    (countMismatch ? 1 : 0) +
    (detectedMismatch ? 1 : 0) +
    missing.length +
    unknown.length +
    duplicates.length +
    titleMismatches.length +
    unclaimedFiles.length;

  // Unimplemented standards fail only at a release version. See the header.
  const problems = shapeProblems + (prerelease ? 0 : unimplemented.length);

  return {
    version,
    prerelease,
    expectedCount: inventory.expectedCount,
    detectedCount: found.size,
    declaredCount: inventory.standards.length,
    implementedCount: claimed.length - unimplemented.length,
    claimedCount: claimed.length,
    countMismatch,
    missing,
    unknown,
    duplicates,
    titleMismatches,
    unimplemented,
    unclaimedFiles,
    shapeProblems,
    problems,
    ok: problems === 0,
  };
}

export function render(r) {
  const line = (label, value) => `${label.padEnd(30)} ${value}`;
  const list = (xs) => (xs.length === 0 ? "none" : xs.join(", "));

  const out = [
    line("Version:", `${r.version}${r.prerelease ? " (prerelease)" : ""}`),
    line("Expected source standards:", r.expectedCount),
    line("Detected source standards:", r.detectedCount),
    line("Implemented standards:", `${r.implementedCount} of ${r.claimedCount}`),
    "",
    line("Missing source numbers:", list(r.missing)),
    line("Duplicate source numbers:", list(r.duplicates.map((d) => `${d.number} (${d.title})`))),
    line("Unknown standards:", list(r.unknown)),
    line("Title mismatches:", list(r.titleMismatches.map((t) => `${t.number}: "${t.found}" != "${t.expected}"`))),
    line("Unclaimed standard files:", list(r.unclaimedFiles)),
  ];

  if (r.unimplemented.length > 0) {
    out.push(
      line("Not yet written:", `${r.unimplemented.length} standard(s)`),
      r.prerelease
        ? "  Progress, not a defect: this is a prerelease version. A release version fails here."
        : "  A release version must have every standard it claims. This is a defect.",
    );
  }

  if (r.countMismatch) {
    out.push("", `! inventory declares expectedCount ${r.expectedCount} but lists ${r.declaredCount} standards`);
  }

  if (r.problems > 0) {
    out.push(
      "",
      "The inventory is the canonical enumeration and was reviewed by a human. A disagreement means",
      "either the specification changed or the extraction changed. Establish which before editing the",
      "inventory — regenerating it from a run would destroy the guarantee it exists to provide.",
    );
  } else {
    out.push("", "Source extraction agrees with the reviewed inventory.");
  }

  return out.join("\n") + "\n";
}

async function main() {
  const jsonOut = process.argv.includes("--json");
  const fail = (message) => {
    process.stderr.write(`inventory: ${message}\n`);
    process.exit(2);
  };

  let inventory;
  try {
    inventory = JSON.parse(await readFile(path.join(ROOT, "artifacts/standards-source-inventory.json"), "utf8"));
  } catch (err) {
    fail(`cannot read artifacts/standards-source-inventory.json: ${err.message}`);
  }

  const sourcePath = path.join(ROOT, inventory.source);
  if (!existsSync(sourcePath)) fail(`source not found: ${inventory.source}`);

  const standardsDir = path.join(ROOT, "standards");
  const standardFiles = existsSync(standardsDir)
    ? (await readdir(standardsDir)).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()
    : [];

  const report = analyse({
    inventory,
    sourceText: await readFile(sourcePath, "utf8"),
    standardFiles,
    version: (await readFile(path.join(ROOT, "VERSION"), "utf8").catch(() => "0.0.0-unknown")).trim(),
    exists: (rel) => existsSync(path.join(ROOT, rel)),
  });

  process.stdout.write(jsonOut ? JSON.stringify(report, null, 2) + "\n" : render(report));
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
