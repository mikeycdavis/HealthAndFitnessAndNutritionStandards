/**
 * R2 — release certification, run against a signed tag that has not been pushed.
 *
 * WHAT THIS IS FOR. FE-13's obligation has two halves and only one of them is a unit test. R1
 * (`test/release-material-binding.test.mjs`) asks whether the evaluator that exists now binds material
 * to labels; it constructs its own release and runs on every CI run. R2 asks the question only the
 * ceremony can ask: does *this* release — the actual signed object about to be published — prove its
 * own identity using the machinery it actually contains?
 *
 * WHY IT IS A SCRIPT AND NOT A TEST. A test that requires an unpublished signed tag would be red on
 * every ordinary run, and making it conditional on the tag's existence would make it silently absent
 * exactly when it matters. Worse, converting such a test to non-`todo` after tagging would move the
 * commit the tag names, so the first release containing the mechanism would not contain the discharged
 * guard. R2 is therefore evidence, produced once, at a moment no suite can reproduce (ADR 0012).
 *
 * WHAT IT DOES NOT DO, AND WILL NOT BE MADE TO DO. It does not sign, and it never sees a private key.
 * Signing is the custodian's personal act (`docs/release-signing.md`), and a release script that held
 * the key so the ceremony would be convenient is the prohibition that document opens with. This script
 * reads a tag that already exists and reports what it finds.
 *
 *     node ci/certify-release.mjs v1.1.0
 *
 * Exit 0 means the release certified and the evidence block below is true. Any other exit means it did
 * not, and per step 5b nothing is pushed: the tag is deleted and recreated against a corrected
 * candidate, and the ceremony restarts from step 3.
 */

import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tag = process.argv[2];

if (!tag || !/^v\d+\.\d+\.\d+$/u.test(tag)) {
  process.stderr.write("usage: node ci/certify-release.mjs v<major>.<minor>.<patch>\n");
  process.exit(2);
}

const version = tag.slice(1);
const git = (...args) => spawnSync("git", ["-C", REPO, ...args], { encoding: "utf8" });
const fail = (why, detail = "") => {
  process.stdout.write(`\nR2 FAILED — ${why}\n${detail ? detail + "\n" : ""}`);
  process.stdout.write("\nNothing may be pushed. See docs/release-signing.md step 5b.\n");
  process.exit(1);
};

process.stdout.write(`R2 — certifying ${tag} before it is published\n\n`);

// ---------------------------------------------------------------------------------------------
// 1. The tag exists locally, is annotated, and has NOT been pushed.
// ---------------------------------------------------------------------------------------------
if (git("rev-parse", "--verify", "--quiet", `refs/tags/${tag}`).status !== 0) {
  fail(`refs/tags/${tag} does not exist locally`, "R2 runs after signing and before pushing.");
}
const tagType = git("cat-file", "-t", `refs/tags/${tag}`).stdout.trim();
if (tagType !== "tag") {
  fail(`${tag} is a ${tagType}, not an annotated tag object`, "A lightweight tag records nothing.");
}

// The unpushed precondition is the whole point of the timing, so it is checked rather than assumed.
// `ls-remote` failing (offline, no remote) is not evidence of absence and is reported as unknown.
const remote = git("ls-remote", "--tags", "origin", `refs/tags/${tag}`);
const publishedAtR2 =
  remote.status !== 0 ? "unknown (could not reach origin)" : remote.stdout.trim() === "" ? "no" : "YES";
if (publishedAtR2 === "YES") {
  fail(`${tag} is already published on origin`, "R2 must run while the tag is still unpublished.");
}

const releaseCommit = git("rev-list", "-n", "1", tag).stdout.trim();
const tagObject = git("rev-parse", `refs/tags/${tag}`).stdout.trim();

// ---------------------------------------------------------------------------------------------
// 2. The signature, verified with the operator's key from outside this repository.
// ---------------------------------------------------------------------------------------------
// Deliberately NOT `git verify-tag`: it resolves gpg.ssh.allowedSignersFile from configuration this
// repository controls, so a fork could nominate its own trust file and verify itself (ADR 0010).
// The anchor is a value the custodian supplies, never a path this tree could point at.
const anchorKey = process.env.HFN_TRUSTED_PUBLIC_KEY?.trim();
let signature = "not checked — HFN_TRUSTED_PUBLIC_KEY was not supplied";
if (anchorKey) {
  const raw = git("cat-file", "tag", tag).stdout;
  const begins = raw.indexOf("-----BEGIN SSH SIGNATURE-----");
  if (begins === -1) fail(`${tag} carries no SSH signature`);

  const signed = /^tag (.+)$/mu.exec(raw.slice(0, begins))?.[1]?.trim();
  if (signed !== tag) {
    fail(
      `the signature authorises the name ${JSON.stringify(signed)}, not ${JSON.stringify(tag)}`,
      "A ref is an alias; the tag header inside the signed payload is the binding.",
    );
  }

  const work = await mkdtemp(path.join(tmpdir(), "hfn-r2-verify-"));
  const allowed = path.join(work, "allowed-signers");
  const payload = path.join(work, "payload");
  const sig = path.join(work, "sig");
  await writeFile(allowed, `custodian ${anchorKey}\n`);
  await writeFile(payload, raw.slice(0, begins));
  await writeFile(sig, raw.slice(begins));
  const verified = spawnSync(
    "ssh-keygen",
    ["-Y", "verify", "-f", allowed, "-I", "custodian", "-n", "git", "-s", sig],
    { input: await readFile(payload), encoding: "utf8" },
  );
  await rm(work, { recursive: true, force: true });
  if (verified.error || verified.status === null) {
    fail("the signature could not be checked", "ssh-keygen did not run. Unavailable is not invalid.");
  }
  if (verified.status !== 0) fail("the signature did not verify under the supplied trust anchor", verified.stderr);
  signature = "verified under HFN_TRUSTED_PUBLIC_KEY";
}

// ---------------------------------------------------------------------------------------------
// 3. THE SUBJECT. Labels agree, one byte of material differs, and the release must refuse.
// ---------------------------------------------------------------------------------------------
const work = await mkdtemp(path.join(tmpdir(), "hfn-r2-"));
const pack = path.join(work, "pack");
const adopter = path.join(work, "adopter");
let r2 = "not run";
try {
  // `--no-hardlinks`: `--local` cannot link across volumes on Windows, and its failure is exactly how
  // the retired falsifier came to certify the wrong thing on this machine (ADR 0012).
  const cloned = spawnSync("git", ["clone", "--no-hardlinks", "--quiet", REPO, pack], { encoding: "utf8" });
  if (cloned.status !== 0) fail("could not materialise the release", cloned.stderr);
  const co = spawnSync("git", ["-C", pack, "checkout", "--quiet", tag], { encoding: "utf8" });
  if (co.status !== 0) fail(`could not check out ${tag}`, co.stderr);

  await cp(path.join(REPO, "templates", "project-policy.yml"), path.join(work, "unused"), { force: true }).catch(
    () => {},
  );
  await (await import("node:fs/promises")).mkdir(adopter, { recursive: true });
  await writeFile(
    path.join(adopter, "project-policy.yml"),
    [
      `standardVersion: "${version}"`,
      `project: "R2ReleaseCertification"`,
      "domains: []",
      "rules: {}",
      "applicability: {}",
      "exceptions: []",
      "attestations: {}",
      "",
    ].join("\n"),
  );

  const check = () => {
    const r = spawnSync(process.execPath, [path.join(pack, "scripts", "standards.mjs"), "check", adopter, "--json"], {
      encoding: "utf8",
    });
    let json = null;
    try {
      json = JSON.parse(r.stdout);
    } catch {
      /* fail-closed runs may emit no JSON */
    }
    return { exit: r.status, json };
  };

  // The control first. A refusal below means nothing unless this establishes.
  const control = check();
  if (control.json?.releaseIdentity?.established !== true) {
    fail(
      `${tag} cannot establish its own identity`,
      `status ${control.json?.status}, reason ${control.json?.releaseIdentity?.reason}. This release ` +
        `does not contain working release-identity machinery, which is the thing R2 exists to certify.`,
    );
  }
  if (control.json?.standardVersion !== version) {
    fail(`${tag} reported standardVersion ${JSON.stringify(control.json?.standardVersion)}`);
  }

  // Now the subject: every label still agrees, one file of material does not.
  const standard = path.join(pack, "standards", "32-energy-balance.md");
  await writeFile(standard, (await readFile(standard, "utf8")) + "\n\nLocally added guidance.\n");
  if ((await readFile(path.join(pack, "VERSION"), "utf8")).trim() !== version) {
    fail("the fixture drifted: VERSION no longer matches the tag");
  }

  const modified = check();
  if (modified.exit === 0) fail("a modified release still produced a passing verdict");
  if (modified.json?.status !== "UNIDENTIFIED_RELEASE") {
    fail(`expected UNIDENTIFIED_RELEASE, got ${JSON.stringify(modified.json?.status)}`);
  }
  if (modified.json?.releaseIdentity?.reason !== "material-differs") {
    fail(
      `the refusal named ${JSON.stringify(modified.json?.releaseIdentity?.reason)}`,
      "It must name the material. A tag-resolution failure here would mean the fixture broke.",
    );
  }
  if (modified.json?.standardVersion !== null) {
    fail("a pack that cannot prove which release it is reported a version anyway");
  }
  r2 = "PASS — control established identity; modified material refused as material-differs";
} finally {
  await rm(work, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------------------------
// The evidence block, in the shape docs/release-signing.md step 5b requires.
// ---------------------------------------------------------------------------------------------
const signer = anchorKey
  ? spawnSync("ssh-keygen", ["-lf", "-"], { input: `${anchorKey}\n`, encoding: "utf8" }).stdout.trim().split(/\s+/)[1]
  : "not established — no trust anchor supplied";

process.stdout.write(
  [
    "```text",
    `candidate commit                      ${releaseCommit}`,
    `signed annotated tag object           ${tagObject}`,
    `dereferenced release commit           ${releaseCommit}`,
    `signer fingerprint                    ${signer}`,
    `local external verification result    ${signature}`,
    `R2 result                             ${r2}`,
    `tag pushed at time of R2              ${publishedAtR2}`,
    "```",
    "",
    "R2 PASSED. Push only when every other condition in docs/release-signing.md holds, and push the",
    "exact tag object certified above — a recreated tag is a different object and has not been certified.",
    "",
  ].join("\n"),
);
