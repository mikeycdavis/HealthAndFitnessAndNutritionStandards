/**
 * The acceptance gate (FE-12): one evaluation, two external acceptance sets.
 *
 * Development and release run the identical evaluation -- the same command, the same policy, the same
 * rule states, the same exit codes. The only thing that differs is which resulting verdicts a gate will
 * tolerate. NOT_EVALUATED may be tolerated while developing and must not be tolerated at a release
 * gate; that is a property of the gate, not of the evaluator.
 *
 * This module therefore sits AFTER the evaluator and imports nothing that evaluates. It takes a
 * verdict (or the evaluator's exit code) and a profile name and answers accept or reject. There is no
 * `check-dev` and no `check-release`: two commands drift, one command with two acceptance sets cannot.
 *
 * Usage:  node scripts/gate.mjs <development|release> --status=<VERDICT> | --exit=<N>
 *   exit 0 accepted, 1 rejected, 2 invocation error
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ACCEPTANCE_FILE = path.join(HERE, "..", "ci", "acceptance-sets.json");

/** Verdicts that must never be tolerated, by any profile, however a set is edited. */
export const NEVER_ACCEPTABLE = ["NON_COMPLIANT", "BLOCKED_BY_INVARIANT"];

/** The evaluator's exit codes mapped to the verdict each reports. Anything else is not a verdict. */
export const EXIT_TO_STATUS = {
  0: "COMPLIANT",
  1: "NON_COMPLIANT",
  3: "BLOCKED_BY_INVARIANT",
  4: "NOT_EVALUATED",
};

export function loadAcceptanceSets(file = ACCEPTANCE_FILE) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const sets = {};
  for (const [name, list] of Object.entries(raw)) {
    if (name.startsWith("_")) continue;
    if (!Array.isArray(list) || list.some((s) => typeof s !== "string")) {
      throw new Error(`acceptance set '${name}' must be a list of verdict names`);
    }
    const bad = list.filter((s) => NEVER_ACCEPTABLE.includes(s));
    if (bad.length) throw new Error(`acceptance set '${name}' lists never-acceptable verdict(s): ${bad.join(", ")}`);
    sets[name] = list;
  }
  if (!sets.development || !sets.release) throw new Error("both 'development' and 'release' acceptance sets are required");
  return sets;
}

/** Pure. A status that is not in the profile's set, or not a known verdict at all, is rejected. */
export function accepts(profile, status, sets = loadAcceptanceSets()) {
  if (!Object.hasOwn(sets, profile)) throw new Error(`unknown profile '${profile}'`);
  return sets[profile].includes(status);
}

function main(argv) {
  const [profile, ...rest] = argv.slice(2);
  const statusArg = rest.find((a) => a.startsWith("--status="));
  const exitArg = rest.find((a) => a.startsWith("--exit="));
  if (!profile || (!statusArg && !exitArg)) {
    process.stderr.write("usage: gate.mjs <development|release> --status=<VERDICT> | --exit=<N>\n");
    return 2;
  }
  let status = statusArg?.slice("--status=".length);
  if (!status) {
    status = EXIT_TO_STATUS[Number(exitArg.slice("--exit=".length))] ?? "NOT_A_VERDICT";
  }
  try {
    const ok = accepts(profile, status);
    process.stdout.write(`${profile} gate: ${status} ${ok ? "accepted" : "rejected"}\n`);
    return ok ? 0 : 1;
  } catch (error) {
    process.stderr.write(`gate: ${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv));
}
