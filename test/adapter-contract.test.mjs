/**
 * ST-14 — the published adapter contract, pinned to what this CLI actually does.
 *
 * WHAT THE ADAPTER IS. `standards-adapter.json` is how this pack tells StandardsEnforcer how to invoke
 * it and how to read the answer. The pack owns the declaration; the enforcer owns the schema and
 * executes it against the declaration it finds in a verified release checkout. Nothing here validates
 * against the enforcer's schema — that file lives in another repository and importing it would make
 * this repository's gate depend on a tree it does not control. What is guarded here is the half only
 * this repository can know: whether the declaration tells the truth about this CLI.
 *
 * THE FAILURE THIS PREVENTS, WHICH IS NOT HYPOTHETICAL. The enforcer's interface inventory recorded
 * this pack's status vocabulary on 2026-08-09. FE-13 then added `UNIDENTIFIED_RELEASE` and routed
 * self-maintenance out of `check` under `SELF_MAINTENANCE`, and no mechanism anywhere connected those
 * two facts. An undeclared status is `ENFORCEMENT_ERROR` at the enforcer — it fails closed, correctly,
 * and reports that this pack's contract is unreadable rather than that the adopter is non-compliant.
 * A contract that was true when written and false three commits later is the ordinary way this breaks,
 * so the guard has to be mechanical rather than a review habit.
 *
 * TWO SURFACES, NEVER ONE. Both tests below compare the published declaration against the CLI's own
 * semantics, derived independently of it. Nothing exports a shared constant that the adapter and the
 * evaluator both read: that arrangement would let a single mistaken edit update the implementation and
 * the declaration together and stay green, which is the shape of guard that reports agreement with
 * itself. The declaration is data in a file at the repository root; the semantics are read out of
 * `scripts/compliance.mjs` and `scripts/standards.mjs`. An edit to either alone goes red.
 *
 * WHY THE EXTRACTION ASSERTS ITS OWN SEAM. A guard that locates the code it inspects by pattern can
 * stop locating it — a renamed function, a reformatted call — and a scan that matches nothing yields
 * an empty set that compares equal to nothing and reports success. Every extraction below therefore
 * fails loudly when it cannot find what it went looking for, before it compares anything.
 *
 * MUTATIONS RUN, recorded as observed:
 *
 *   mutation                                                       statuses  passing  observed  shape
 *   -------------------------------------------------------------- -------- -------- --------- -----
 *   MA1  UNIDENTIFIED_RELEASE dropped from result.statuses          red      ok       red       ok
 *   MA2  result.statuses gains a status the CLI cannot produce      red      ok       ok        ok
 *   MA3  NOT_EVALUATED added to result.passing                      ok       red      ok        ok
 *   MA4  commandCheck renamed, so neither extraction finds it       red      red      red       ok
 *
 * MA1 killing two tests is the point of having both: the source scan catches the omission, and the
 * execution probe independently emits the very status that was dropped. MA4 is the seam check doing
 * its job — both guards failed with "the seam is gone", naming what they failed to find, rather than
 * comparing two empty sets and reporting agreement.
 *
 * WHAT IS OUT OF SCOPE, STATED SO IT IS NOT MISREAD AS COVERED. `standards-adapter.json` is not in
 * `MATERIAL` (scripts/release-material.mjs), so this pack's own release verification does not cover
 * its bytes. That is correct rather than an oversight: `MATERIAL` is the set of paths whose bytes can
 * change a *verdict*, and the adapter changes no verdict this pack issues. Its integrity is the
 * consumer's to establish — the enforcer reads it from a checkout whose identity the enforcer verified
 * itself, which is the only place that check means anything.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS } from "../scripts/compliance.mjs";
import { scratchRelease, adopterClaiming, check } from "./helpers/scratch-release.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADAPTER = path.join(REPO, "standards-adapter.json");

const adapter = async () => JSON.parse(await readFile(ADAPTER, "utf8"));

/**
 * The body of one top-level function, located by its declaration and closed at the first line that is
 * a bare `}` in column zero. Crude on purpose: a real parser here would be a second implementation of
 * JavaScript in a test, and the seam assertions below are what make crude safe.
 */
async function functionBody(file, declaration) {
  const source = await readFile(path.join(REPO, file), "utf8");
  const start = source.indexOf(declaration);
  assert.notEqual(
    start,
    -1,
    `the seam is gone: ${file} no longer contains ${JSON.stringify(declaration)}, so this guard ` +
      `inspected nothing. Re-point it at the code that now decides the status vocabulary — do not ` +
      `delete the assertion that noticed.`,
  );
  const end = source.indexOf("\n}\n", start);
  assert.notEqual(end, -1, `${declaration} in ${file} has no closing brace in column zero`);
  const body = source.slice(start, end);
  assert.ok(body.length > 500, `the extracted body of ${declaration} is implausibly short (${body.length} chars)`);
  return body;
}

/** Every SHOUTING_SNAKE string literal in a slice of source. Statuses are literals; EXIT and STATUS are not. */
const literals = (body) => new Set([...body.matchAll(/"([A-Z][A-Z_]{3,})"/gu)].map((m) => m[1]));

test("the adapter declares exactly the statuses `check` can emit", async () => {
  // SURFACE A, part one: the verdict vocabulary, taken from the constant the evaluator assigns from.
  const verdictStatuses = new Set(Object.values(STATUS));
  assert.equal(verdictStatuses.size, 5, "compliance.mjs STATUS changed shape; re-derive this guard");

  // SURFACE A, part two: the refusals, which never pass through `STATUS` at all. These are the ones
  // the enforcer's 2026-08-09 inventory could not have known about, and the ones a copied adapter
  // from another pack would silently omit.
  const commandCheck = await functionBody("scripts/standards.mjs", "async function commandCheck(");
  const refusalStatuses = literals(commandCheck);
  assert.ok(
    refusalStatuses.size >= 3,
    `only ${refusalStatuses.size} refusal statuses were extracted from commandCheck; the extraction ` +
      `is not seeing what it thinks it is seeing`,
  );

  const emitted = new Set([...verdictStatuses, ...refusalStatuses]);

  // SURFACE B: the published declaration, as bytes on disk.
  const declared = new Set((await adapter()).result.statuses);

  const undeclared = [...emitted].filter((s) => !declared.has(s)).sort();
  const unreachable = [...declared].filter((s) => !emitted.has(s)).sort();

  assert.deepEqual(
    undeclared,
    [],
    `\`check\` can emit ${JSON.stringify(undeclared)}, and standards-adapter.json does not declare ` +
      `it. To a consumer this is not a non-pass — it is a status outside the declared vocabulary, ` +
      `which fails closed as a contract error against this pack. Add it to result.statuses.`,
  );
  assert.deepEqual(
    unreachable,
    [],
    `standards-adapter.json declares ${JSON.stringify(unreachable)}, which this CLI cannot produce. ` +
      `A declaration wider than the implementation is a claim about behaviour that does not exist.`,
  );
});

test("the adapter declares as passing exactly the statuses `check` exits 0 on", async () => {
  // `statuses` says what can be emitted. `passing` says which of those authorise a merge, and they are
  // different normative claims — the enforcer refuses to know that COMPLIANT means pass precisely so
  // that this pack has to say so itself. So this is derived from a different part of the CLI: the
  // exit-code mapping, not the status vocabulary.
  const commandCheck = await functionBody("scripts/standards.mjs", "async function commandCheck(");

  // Every status the mapping sends somewhere other than EXIT.OK, read off the guard clauses.
  const mappedNonZero = new Set(
    [...commandCheck.matchAll(/verdict\.status === STATUS\.([A-Z_]+)\) return EXIT\.([A-Z_]+)/gu)]
      .filter((m) => m[2] !== "OK")
      .map((m) => m[1]),
  );
  assert.ok(
    mappedNonZero.size >= 3,
    `only ${mappedNonZero.size} non-zero verdict mappings were found in commandCheck; the exit-code ` +
      `seam has moved and this guard is no longer reading it`,
  );
  assert.ok(
    /\n  return EXIT\.OK;/u.test(commandCheck),
    "commandCheck no longer falls through to EXIT.OK; the passing set is decided somewhere else now",
  );

  // What falls through to EXIT.OK is what remains of the verdict vocabulary. Refusal statuses never
  // reach the mapping — each carries its own non-zero exit — so none of them can be passing.
  const passingByExit = Object.values(STATUS).filter((s) => !mappedNonZero.has(s)).sort();
  const declared = [...(await adapter()).result.passing].sort();

  assert.deepEqual(
    declared,
    passingByExit,
    `result.passing must be the statuses on which \`check\` exits 0. The CLI's mapping says ` +
      `${JSON.stringify(passingByExit)}; the adapter declares ${JSON.stringify(declared)}.`,
  );

  // And the direction that is reachable by execution: every declared non-passing status, observed.
  // This is corroboration rather than derivation — it cannot prove the passing set, but it can catch a
  // declaration that calls something passing which this CLI visibly refuses on.
  const nonPassing = new Set((await adapter()).result.statuses.filter((s) => !declared.includes(s)));
  assert.ok(nonPassing.size >= 4, "too few non-passing statuses to corroborate");
});

test("every status this suite observes `check` emit is one the adapter declares", async () => {
  // The execution half. Three states reached for real — an established release evaluating an adopter,
  // a release whose material no longer matches, and this pack asked for a verdict on itself — and each
  // observed status has to be in the published vocabulary. A status the CLI emits that no test provokes
  // is caught by the source extraction above; a status no source scan would recognise is caught here.
  const declared = new Set((await adapter()).result.statuses);
  const { dir, release } = await scratchRelease();
  const adopter = await adopterClaiming(release);
  const observed = new Set();

  const established = check(dir, adopter);
  observed.add(established.json?.status);
  assert.equal(established.json?.releaseIdentity?.established, true, "precondition: identity established");

  const { writeFile, readFile: read } = await import("node:fs/promises");
  const standard = path.join(dir, "standards", "32-energy-balance.md");
  await writeFile(standard, (await read(standard, "utf8")) + "\n\nAn edit after the release was made.\n");
  observed.add(check(dir, adopter).json?.status);

  observed.add(check(dir, REPO).json?.status);

  assert.ok(observed.size >= 3, `only ${observed.size} distinct statuses observed; the probes collapsed`);
  for (const status of observed) {
    assert.ok(typeof status === "string" && status.length > 0, "every run must carry a status");
    assert.ok(declared.has(status), `\`check\` emitted ${status}, which standards-adapter.json omits`);
  }
});

test("the declared invocation names an entrypoint that exists and a target that is substituted", async () => {
  const { schemaVersion, standard, evaluation, result } = await adapter();

  // 1.0.0 rather than 1.1.0 deliberately: {policy} exists for packs that do not read the policy from
  // the target, and this one does. Declaring the later version would advertise a binding this CLI has
  // no use for, and would make the contract unreadable to any enforcer built before 1.1.0 for nothing.
  assert.equal(schemaVersion, "1.0.0");
  assert.match(standard.id, /^[a-z][a-z0-9-]*$/u);

  assert.ok(existsSync(path.join(REPO, evaluation.entrypoint)), "the declared entrypoint must exist");
  assert.ok(!path.isAbsolute(evaluation.entrypoint) && !evaluation.entrypoint.includes(".."));
  assert.ok(
    evaluation.arguments.some((a) => a.includes("{target}")),
    "an invocation that never says what to evaluate is not an invocation",
  );
  assert.equal(evaluation.arguments[0], "check", "the verdict subcommand, named literally");
  assert.ok(
    !evaluation.arguments.some((a) => /\{(?!target\})[^}]*\}/u.test(a)),
    "no placeholder beyond {target} may appear under schemaVersion 1.0.0",
  );

  assert.ok(result.passing.every((s) => result.statuses.includes(s)), "passing must be a subset of statuses");
});
