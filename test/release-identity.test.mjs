/**
 * FE-13 — adoption pins an immutable release.
 *
 * THIS FILE IS A FALSIFIER. Every assertion in it was written and committed before any remedy was
 * designed, and every one of them failed when it was written — deliberately, so that the false green
 * was reproducible rather than argued about.
 *
 * THREE OF THE FOUR ARE NOW ORDINARY TESTS. FE-13 stage 3 removed the paths they were written to
 * expose, they pass unchanged, and each was mutation-checked before the marker came off: the specific
 * mechanism it guards was reintroduced, the unchanged test was watched turn red, and the source was
 * restored byte for byte. They have crossed from defect reproduction into regression protection, and
 * leaving them `todo` past that point would only mean the gate no longer goes red when the defect
 * returns.
 *
 *   mutation                                                        1  2  3
 *   ------------------------------------------------------------- -- -- --
 *   the identity gate is not consulted; the claim is reported      ✗  ok ✗
 *   a failed identity is appended to a verdict rather than
 *     replacing it — the caveat FE-13 forbids by name              ✗  ok ✗
 *   a refusal no longer records what it refused                    ok ✗  ok
 *   `releaseIdentity` dropped from the success envelope            ok ok ok   <- see below
 *
 * TWO THINGS THAT TABLE SAYS, AND THEY ARE BOTH WORTH KNOWING.
 *
 * The last row is a gap in falsifier 2, not a redundancy. It asserts that the envelope carries a
 * release identity, and today it is satisfied by the REFUSAL envelope, because the pack running it on
 * a development branch cannot establish an identity and never reaches the success path. Dropping the
 * field from a successful verdict therefore leaves it green. Two tests in release-gate.test.mjs cover
 * that property directly and do go red. The falsifier is not weakened by this — it is simply narrower
 * than its name suggests, and a reader who assumed otherwise would be trusting the wrong test.
 *
 * Falsifiers 1 and 3 now fail and pass together, and no mutation separates them. Before the remedy
 * they differed: 3 deleted `VERSION` to reach a code path that substituted the string "unknown" and
 * carried on. That path is now downstream of a gate that refuses first, so the input that once
 * distinguished them no longer reaches anything distinct. This is what a remedy collapsing two defects
 * into one looks like, and it is recorded rather than presented as two independent guards.
 *
 * THE FOURTH IS RETIRED, and this file no longer contains it. It was never going to pass: it builds
 * its pack by checking out `v1.0.0`, so the code it exercises is `v1.0.0`'s, which predates the
 * release-identity mechanism and cannot contain it. A pack cannot bootstrap stronger authenticity
 * guarantees for releases that predate those guarantees (ADR 0008), so no release could satisfy that
 * body — the satisfaction condition it was given on 2026-08-16 named a release the fixture does not
 * execute. Two runs established it, and the second is the worse one: with a working clone it fails on
 * `standardVersion: "1.0.0"`, and where `git clone --local` cannot hardlink across volumes its
 * fallback copies the working tree without `.git` and passes without exercising either half.
 *
 * It is preserved byte for byte at `test/retired/fe-13-falsifier-4.retired.mjs`, out of the default
 * suite, under the rule in ADR 0012 — retirement is for a fixture that cannot express its subject,
 * never for one that is merely red. Its subject is now asserted of the evaluator that exists, in
 * `test/release-material-binding.test.mjs`, and FE-13 closes on that plus release-certification
 * evidence (R2) rather than on this file alone.
 *
 * THE CLAIM UNDER TEST. An adopter that says it uses `v1.0.0` must demonstrably be evaluated against
 * the exact immutable release. Where that cannot be established, evaluation must fail closed rather
 * than silently substituting a branch, a moving ref, a local checkout, or a cached copy whose
 * identity is no longer proven.
 *
 * THE DISTINCTION THE CURRENT SYSTEM DOES NOT MAKE. Version equality is not identity equality.
 * `standardVersion: "1.0.0"` in an adopter's policy establishes what that project *claims* to use. It
 * establishes nothing about which bytes were evaluated. Today the claim is not merely unverified — it
 * is the value the tool reports back, at scripts/standards.mjs:615:
 *
 *     standardVersion: loaded.policy.standardVersion ?? version
 *
 * The policy's own assertion wins outright, and the catalog is loaded from `ROOT` — wherever the CLI
 * happens to live — with no identity check at any point. So a deliberately altered pack evaluating an
 * adopter that claims 1.0.0 produces output stating the adopter was evaluated against 1.0.0.
 *
 * WHY A FALSIFIER FIRST. The two defects this release actually shipped and had to correct were both
 * invisible to reasoning and visible to execution: a CI comment that was wrong for months because
 * nothing re-read it, and a test invocation that had never once run in CI. Designing the remedy
 * before reproducing the failure would repeat that mistake in the one area where this repository
 * claims the most.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * WHY `todo` RATHER THAN A RED BUILD. All four were reproduced failing, and the intent was to
 * commit them failing. They were marked `todo` instead for one reason: this repository made CI a real
 * enforcement surface four commits before that one, and a knowingly-red `main` teaches everybody who
 * sees it that red means nothing. That erosion is the thing the whole release was built to resist.
 *
 * `todo` kept every property that mattered. They ran on every CI run, they printed exactly what they
 * assert, and FE-13 does not close while this marker is still on any of them. What was lost is the
 * build going red, and that was the part worth losing.
 *
 * THE ONLY LEGITIMATE WAY THIS MARKER DISAPPEARS is that the false green it names has been removed
 * and the falsifier — unchanged — passes. A falsifier may not be deleted, weakened, rewritten to
 * assert something easier, or moved out of the default test run. Doing any of that to reach a green
 * build is the "falsify evidence for" clause of `integrity.no-standards-manipulation`, applied to this
 * repository's own maintenance rather than to an adopter's.
 *
 * NO TEST IN THIS FILE CARRIES THE MARKER ANY MORE, and the paragraph above is kept rather than
 * deleted because it is the standard the fourth one was eventually judged against. Three were
 * converted unchanged when the false green was removed, which is the legitimate route. The fourth was
 * not converted and was not quietly satisfied either: it was retired, byte for byte and out of the
 * suite, on evidence that its fixture could never express its subject (ADR 0012). That is a third
 * disposition, and it needed to be, because the two this comment allows for — still red, or honestly
 * green — were both unreachable for it. The rule it must not become is "retire what stays red"; the
 * boundary is written down in the ADR, not left to whoever reads this next.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");

/** A copy of this pack with its identity deliberately broken, standing in for a substituted source. */
async function tamperedPack() {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-substituted-"));
  await cp(REPO, dir, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git`) && !src.includes("node_modules"),
  });

  // Not the released bytes, and not even claiming to be: this pack says it is something else.
  await writeFile(path.join(dir, "VERSION"), "0.0.0-substituted\n");

  // And its content differs from the release in a way that matters. The verbatim source line of a
  // prohibition is reworded — the exact defect `npm run fidelity` exists to catch, and which `check`
  // never asks about.
  const rulesPath = path.join(dir, "rules", "nutrition.json");
  const rules = JSON.parse(await readFile(rulesPath, "utf8"));
  const target = rules.rules.find((r) => r.id === "nutrition.no-crash-dieting");
  target.description = "Crash dieting is generally discouraged in most circumstances.";
  await writeFile(rulesPath, JSON.stringify(rules, null, 2) + "\n");

  return dir;
}

/** A minimal adopting project whose policy claims the immutable release. */
async function adopterClaiming(version) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-adopter-"));
  await writeFile(
    path.join(dir, "project-policy.yml"),
    [
      `standardVersion: "${version}"`,
      `project: "AdopterClaimingAnImmutableRelease"`,
      "domains: []",
      "rules: {}",
      "applicability: {}",
      "exceptions: []",
      "attestations: {}",
      "",
    ].join("\n"),
  );
  return dir;
}

function check(packDir, adopterDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(packDir, "scripts", "standards.mjs"), "check", `--dir=${adopterDir}`, "--json"],
    { encoding: "utf8" },
  );
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* a fail-closed implementation may legitimately produce no JSON verdict at all */
  }
  return { exit: r.status, json, stderr: r.stderr };
}

test("FALSIFIER: a substituted pack cannot report the release the adopter merely claims", async () => {
  const pack = await tamperedPack();
  const adopter = await adopterClaiming("1.0.0");
  try {
    const { exit, json } = check(pack, adopter);

    // What the tool currently does: it echoes the adopter's claim as established fact. This single
    // assertion is the whole finding — the output asserts an evaluation against 1.0.0 that did not
    // happen, using a pack that says it is 0.0.0-substituted and whose rule text differs.
    assert.notEqual(
      json?.standardVersion,
      "1.0.0",
      "the report states the adopter was evaluated against 1.0.0 while the evaluating pack is " +
        "0.0.0-substituted with altered rule text: version equality is not identity equality",
    );

    // And it produces a verdict at all, rather than refusing for want of an establishable identity.
    assert.notEqual(exit, 0, "a substituted source must not yield a passing verdict");
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

test("FALSIFIER: the report must record what was evaluated, not only what was claimed", async () => {
  const adopter = await adopterClaiming("1.0.0");
  try {
    const { json } = check(REPO, adopter);

    // Even against the genuine pack, nothing in the output identifies the bytes that produced the
    // verdict. A reader cannot distinguish this run from the substituted one above. Whatever FE-13
    // designs — a release digest, a resolved tag, a content hash over the catalog — it has to appear
    // here, or the distinction exists only in the operator's head.
    assert.ok(
      json?.releaseIdentity,
      "the JSON envelope carries no field establishing which release actually evaluated this project",
    );
  } finally {
    await rm(adopter, { recursive: true, force: true });
  }
});

test("FALSIFIER: an unestablishable release identity must fail closed", async () => {
  const pack = await tamperedPack();
  const adopter = await adopterClaiming("1.0.0");
  try {
    await rm(path.join(pack, "VERSION"), { force: true });
    const { exit, json } = check(pack, adopter);

    // With no VERSION at all the pack cannot say what it is. The current code substitutes the string
    // "unknown" and carries on — and because the policy's claim wins anyway, the report still says
    // 1.0.0. Fail-closed means refusing to produce a verdict, not producing one from a default.
    assert.notEqual(
      exit,
      0,
      "with no establishable release identity the evaluation must refuse rather than default",
    );
    assert.notEqual(json?.standardVersion, "1.0.0", "an unidentifiable pack must not report 1.0.0");
  } finally {
    await rm(pack, { recursive: true, force: true });
    await rm(adopter, { recursive: true, force: true });
  }
});

