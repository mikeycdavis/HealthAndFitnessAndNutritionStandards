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

/** Verdicts a gate set may list at all. Anything else (non-verdict exits, unknown names) is refused. */
export const ACCEPTABLE_VERDICTS = ["COMPLIANT", "COMPLIANT_WITH_EXCEPTIONS", "NOT_EVALUATED"];
const PROFILES = ["development", "release"];

export function loadAcceptanceSets(file = ACCEPTANCE_FILE) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const sets = {};
  for (const name of Object.keys(raw)) {
    if (name === "_comment") continue;
    if (!PROFILES.includes(name)) throw new Error(`unknown acceptance profile '${name}'`);
  }
  for (const name of PROFILES) {
    const list = raw[name];
    if (!Array.isArray(list) || list.some((s) => typeof s !== "string")) {
      throw new Error(`acceptance set '${name}' must be a list of verdict names (both 'development' and 'release' are required)`);
    }
    const bad = list.filter((s) => NEVER_ACCEPTABLE.includes(s));
    if (bad.length) throw new Error(`acceptance set '${name}' lists never-acceptable verdict(s): ${bad.join(", ")}`);
    const unknown = list.filter((s) => !ACCEPTABLE_VERDICTS.includes(s));
    if (unknown.length) throw new Error(`acceptance set '${name}' lists unrecognised verdict(s): ${unknown.map((s) => JSON.stringify(s)).join(", ")}`);
    sets[name] = [...list];
  }
  // The point of FE-12, enforced in code rather than only in a test: a release gate never tolerates
  // NOT_EVALUATED, and never accepts anything development would refuse.
  if (sets.release.includes("NOT_EVALUATED")) throw new Error("the release acceptance set must not include NOT_EVALUATED");
  if (!sets.release.every((s) => sets.development.includes(s))) throw new Error("the release acceptance set must be a subset of development's");
  return sets;
}

/** Pure. A status that is not in the profile's set, or not a known verdict at all, is rejected. */
export function accepts(profile, status, sets = loadAcceptanceSets()) {
  if (!Object.hasOwn(sets, profile)) throw new Error(`unknown profile '${profile}'`);
  return sets[profile].includes(status);
}

function main(argv) {
  const [profile, ...rest] = argv.slice(2);
  const usage = "usage: gate.mjs <development|release> --status=<VERDICT> | --exit=<N>\n";
  // Exactly one selector, exactly once, with a canonical value. Contradictory, duplicated, empty or
  // unrecognised input is an invocation error (2), never a guess: an unset shell variable in
  // --exit=$CODE must not be able to pass a release gate.
  const statuses = rest.filter((a) => a.startsWith("--status="));
  const exits = rest.filter((a) => a.startsWith("--exit="));
  const unknown = rest.filter((a) => !a.startsWith("--status=") && !a.startsWith("--exit="));
  if (!profile || unknown.length || statuses.length + exits.length !== 1) {
    process.stderr.write(usage);
    return 2;
  }
  let status;
  if (statuses.length) {
    status = statuses[0].slice("--status=".length);
    if (!/^[A-Z_]+$/.test(status)) {
      process.stderr.write(usage);
      return 2;
    }
  } else {
    const code = exits[0].slice("--exit=".length);
    if (!/^(0|[1-9][0-9]*)$/.test(code)) {
      process.stderr.write(usage);
      return 2;
    }
    // Exit 0 is ambiguous: `check` returns it for both COMPLIANT and COMPLIANT_WITH_EXCEPTIONS.
    // It may stand in for the verdict only when the profile treats the two identically; if a set
    // distinguishes them, the actual verdict must be supplied with --status (exit 2 otherwise).
    status = EXIT_TO_STATUS[Number(code)] ?? "NOT_A_VERDICT";
    if (status === "COMPLIANT") {
      try {
        const sets = loadAcceptanceSets();
        if (Object.hasOwn(sets, profile) && sets[profile].includes("COMPLIANT") !== sets[profile].includes("COMPLIANT_WITH_EXCEPTIONS")) {
          process.stderr.write(`gate: exit 0 is ambiguous for profile '${profile}' (its set distinguishes COMPLIANT from COMPLIANT_WITH_EXCEPTIONS); pass --status=<VERDICT>\n`);
          return 2;
        }
      } catch (error) {
        process.stderr.write(`gate: ${error.message}\n`);
        return 2;
      }
    }
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
