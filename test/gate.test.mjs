/**
 * FE-12: one evaluation, two external acceptance sets.
 * Development tolerates NOT_EVALUATED; release does not; the evaluator is identical in both.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { writeFileSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { loadCatalog } from "../scripts/catalog.mjs";
import { evaluate, STATUS } from "../scripts/compliance.mjs";
import { accepts, loadAcceptanceSets, EXIT_TO_STATUS, NEVER_ACCEPTABLE } from "../scripts/gate.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const catalog = await loadCatalog(path.join(REPO, "rules"));
const run = (policy, evaluated = []) =>
  evaluate({ catalog, policy, findings: [], evaluated, today: "2026-08-09", digests: new Map() });

test("the same evaluation is accepted in development and rejected at release when it is NOT_EVALUATED", () => {
  // One call to the evaluator: there is no profile argument to pass, so no second path can exist.
  const verdict = run({ standardVersion: "1.0.0" });
  assert.equal(verdict.status, STATUS.NOT_EVALUATED);
  assert.equal(accepts("development", verdict.status), true);
  assert.equal(accepts("release", verdict.status), false);
});

test("evaluator output is identical whichever gate later consumes it", () => {
  const a = run({ standardVersion: "1.0.0" });
  const b = run({ standardVersion: "1.0.0" });
  assert.deepEqual(a, b);
  const before = JSON.stringify(a);
  accepts("development", a.status);
  accepts("release", a.status);
  assert.equal(JSON.stringify(a), before, "gating must not mutate or influence the verdict");
});

test("COMPLIANT is accepted by both profiles; failing and blocked verdicts by neither", () => {
  for (const s of ["COMPLIANT", "COMPLIANT_WITH_EXCEPTIONS"]) {
    assert.equal(accepts("development", s), true);
    assert.equal(accepts("release", s), true);
  }
  for (const s of NEVER_ACCEPTABLE) {
    assert.equal(accepts("development", s), false);
    assert.equal(accepts("release", s), false);
  }
});

test("exit codes map to verdicts; non-verdict exits (2, 5, 6) are never accepted", () => {
  assert.deepEqual(EXIT_TO_STATUS, { 0: "COMPLIANT", 1: "NON_COMPLIANT", 3: "BLOCKED_BY_INVARIANT", 4: "NOT_EVALUATED" });
  const cli = (profile, exit) =>
    spawnSync(process.execPath, [path.join(REPO, "scripts", "gate.mjs"), profile, `--exit=${exit}`], { encoding: "utf8" }).status;
  assert.equal(cli("development", 4), 0);
  assert.equal(cli("release", 4), 1);
  assert.equal(cli("release", 0), 0);
  for (const code of [2, 5, 6]) {
    assert.equal(cli("development", code), 1);
    assert.equal(cli("release", code), 1);
  }
});

test("an acceptance set that lists a never-acceptable verdict refuses to load", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "gate-"));
  const file = path.join(dir, "sets.json");
  writeFileSync(file, JSON.stringify({ development: ["COMPLIANT", "NON_COMPLIANT"], release: ["COMPLIANT"] }));
  assert.throws(() => loadAcceptanceSets(file), /never-acceptable/);
  writeFileSync(file, JSON.stringify({ development: ["COMPLIANT"] }));
  assert.throws(() => loadAcceptanceSets(file), /both/);
});

test("the shipped sets: release is strictly narrower than development and excludes NOT_EVALUATED", () => {
  const sets = loadAcceptanceSets();
  assert.ok(sets.development.includes("NOT_EVALUATED"));
  assert.ok(!sets.release.includes("NOT_EVALUATED"));
  assert.ok(sets.release.every((s) => sets.development.includes(s)));
  assert.throws(() => accepts("staging", "COMPLIANT"), /unknown profile/);
});

test("no second evaluation path: no check-dev/check-release command, and the gate imports no evaluator", async () => {
  const gate = await readFile(path.join(REPO, "scripts", "gate.mjs"), "utf8");
  assert.ok(!/from "\.\/(compliance|standards|catalog)\.mjs"/.test(gate), "gate must not import the evaluator");
  const cli = await readFile(path.join(REPO, "scripts", "standards.mjs"), "utf8");
  assert.ok(!/check-dev|check-release|checkDev|checkRelease/.test(cli));
  const pkg = JSON.parse(await readFile(path.join(REPO, "package.json"), "utf8"));
  for (const name of Object.keys(pkg.scripts)) assert.ok(!/check[-:](dev|release)/.test(name), name);
});

test("the CLI fails closed on malformed, empty, contradictory or duplicate input (exit 2)", () => {
  const cli = (...args) =>
    spawnSync(process.execPath, [path.join(REPO, "scripts", "gate.mjs"), ...args], { encoding: "utf8" }).status;
  for (const bad of ["--exit=", "--exit=00", "--exit=0x0", "--exit=0.0", "--exit=-0", "--exit=abc", "--status=", "--status=compliant"]) {
    assert.equal(cli("release", bad), 2, bad);
  }
  assert.equal(cli("release", "--status=COMPLIANT", "--exit=4"), 2, "contradictory selectors");
  assert.equal(cli("release", "--exit=0", "--exit=4"), 2, "duplicate selectors");
  assert.equal(cli("release", "--exit=0", "--bogus"), 2, "unknown argument");
  assert.equal(cli("release"), 2);
  assert.equal(cli("__proto__", "--exit=0"), 2);
  assert.equal(cli("release", "--exit=0"), 0);
  assert.equal(cli("release", "--exit=1"), 1);
  assert.equal(cli("release", "--exit=3"), 1);
  assert.equal(cli("development", "--status=NOT_EVALUATED"), 0);
  assert.equal(cli("release", "--status=NOT_EVALUATED"), 1);
});
