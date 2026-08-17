/**
 * An immutable release, constructed by the test rather than borrowed from the host repository.
 *
 * WHY THIS EXISTS. FE-13's fourth falsifier tried to obtain a release by cloning this repository and
 * checking out `v1.0.0`. Two executions on 2026-08-16 showed why that cannot work:
 *
 *   working clone      the pack under test is v1.0.0's evaluator, which predates the release-identity
 *                      mechanism and reports the adopter's claim back as fact. Permanently red, for a
 *                      reason no future release can change (ADR 0008).
 *   failed clone       `git clone --local` cannot hardlink across volumes on Windows, so the fallback
 *                      copied the working tree without `.git`. Identity then failed at `no-repository`
 *                      — an apparent pass that exercised neither the tag half nor the bytes half.
 *
 * The fixture was the problem in both cases, not the implementation. So this helper takes nothing from
 * the host repository's `.git` at all: no clone, no object sharing, no tag lookup, no fallback path.
 * It copies the reviewed material boundary into a scratch directory, makes a repository out of it, and
 * annotates a tag over the result. What comes back is a real release by every test the mechanism
 * applies — an annotated tag, resolvable, designating a tree the material matches — and it contains
 * the current evaluator, which is the half the old fixture could never supply.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not sign the tag. Signing is the custodian's act
 * (`docs/release-signing.md`), a private key is never available to a test, and release identity does
 * not depend on a signature — `resolveRelease` requires an annotated tag, and authenticity is ST-12's
 * separate question. A helper that signed would be claiming an authority no test may hold.
 */

import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MATERIAL } from "../../scripts/release-material.mjs";

export const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The material boundary is imported, never restated. If `MATERIAL` grows a path and this helper kept
 * its own list, the constructed release would omit bytes the verifier compares and every test built on
 * it would fail for a reason that has nothing to do with what it asserts.
 */
export async function scratchRelease({ version } = {}) {
  const release = version ?? (await readFile(path.join(REPO, "VERSION"), "utf8")).trim();
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-release-"));

  for (const entry of MATERIAL) {
    const from = path.join(REPO, entry);
    const to = path.join(dir, entry);
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
  }

  const git = (...args) => {
    const r = spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args[0]} failed in the scratch release: ${r.stderr}`);
    return r;
  };

  // `-b main` and never a branch named after the tag: `resolveRelease` rejects a release reference two
  // objects answer to, and a fixture that tripped that check would be testing the wrong refusal.
  git("init", "--quiet", "-b", "main");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Scratch Release Fixture");
  git("config", "commit.gpgsign", "false");
  git("config", "tag.gpgsign", "false");
  git("add", "-A");
  git("commit", "--quiet", "-m", `scratch release v${release}`);
  git("tag", "-a", `v${release}`, "-m", `scratch release v${release}`);

  return { dir, release, commit: git("rev-parse", "HEAD").stdout.trim() };
}

/** A minimal adopting project whose policy claims a release. */
export async function adopterClaiming(version, extra = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "hfn-adopter-"));
  const lines = [
    `standardVersion: "${version}"`,
    `project: "${extra.project ?? "AdopterUnderTest"}"`,
    "domains: []",
    "rules: {}",
    "applicability: {}",
    "exceptions: []",
    "attestations: {}",
    "",
  ];
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(dir, "project-policy.yml"), extra.policy ?? lines.join("\n"));
  return dir;
}

/** Run a pack's `check` against an adopter, exactly as the published adapter contract declares it. */
export function check(packDir, adopterDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(packDir, "scripts", "standards.mjs"), "check", adopterDir, "--json"],
    { encoding: "utf8" },
  );
  let json = null;
  try {
    json = JSON.parse(r.stdout);
  } catch {
    /* a fail-closed implementation may legitimately produce no JSON verdict at all */
  }
  return { exit: r.status, json, stdout: r.stdout, stderr: r.stderr };
}
