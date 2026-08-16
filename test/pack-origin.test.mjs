/**
 * The canonical-origin contract (ST-12, ADR 0010).
 *
 * These are the owner's three acceptance tests, written to hold before the cryptographic mechanism is
 * chosen, because they are what the mechanism will be judged against rather than something to check
 * once it is in:
 *
 *   1. No anchor: legitimate pack lineage and no externally supplied anchor — maintenance succeeds,
 *      origin is NOT_ESTABLISHED / trust-anchor-absent.
 *   2. Attacker fork: a full fork carrying its own key and a correct signature over it, evaluated
 *      against an independently trusted real fingerprint — maintenance may run, origin stays
 *      NOT_ESTABLISHED.
 *   3. Origin-dependent consumer: fed either of those, the assertion path refuses.
 *
 * HONEST ABOUT THE ORDER: `scripts/pack-origin.mjs` was written before these, so they are not
 * falsifiers in the sense this repository usually means — they did not fail first against an absent
 * implementation. The compensating evidence is the mutation table below: each test was re-run against
 * a deliberately broken module and observed to redden. Recorded here rather than left for a reviewer
 * to notice, because "the tests pass" means less when the tests came second.
 *
 * MUTATIONS RUN. Recorded as observed, and the observations did not match the predictions — the two
 * that matter are noted rather than tidied away, because a mutation table that agrees with its author
 * every time is a table nobody ran.
 *
 *   M1  the destructured `anchor` defaults to a key the       → tests 1, 2 and 5 red (predicted: 1
 *       pack supplies — i.e. ADR 0010's rejected                 only). Test 3 SURVIVED, because its
 *       `trusted-key.json`, in one line                          verifier signs as the real trusted
 *                                                                key, so the substituted anchor is
 *                                                                rejected as untrusted-signer and it
 *                                                                still refuses. A test can be right
 *                                                                for a reason other than the one it
 *                                                                was written for.
 *   M2  the untrusted-signer branch compares nothing, so      → tests 2, 3 and 5 red (predicted: 2
 *       any fingerprint the verifier reports is accepted         only). The fork case exactly.
 *   M3  `assertCanonicalOrigin` also accepts                  → ONLY the no-field-substitutes test
 *       `status === "SELF_MAINTENANCE"`                          red (predicted: that and test 3).
 *                                                                Test 3 feeds it NOT_ESTABLISHED
 *                                                                results, so it never exercises the
 *                                                                greenest-thing-a-caller-can-find
 *                                                                case. That is precisely why the
 *                                                                fourth test is separate, and M3 is
 *                                                                the evidence it earns its place.
 *   M4  TRUST_ANCHOR_ABSENT reuses the invalid-signature      → only the distinct-reasons test red.
 *       string                                                   Every other test stayed green, which
 *                                                                is what a boolean-shaped collapse
 *                                                                looks like from the outside.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ORIGIN,
  ORIGIN_REASON,
  CanonicalOriginRequired,
  assertCanonicalOrigin,
  packOrigin,
} from "../scripts/pack-origin.mjs";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(REPO, "scripts", "standards.mjs");

/** The real custodian fingerprint an operator would hold in their own trust store. Never in the pack. */
const TRUSTED = { fingerprint: "AAAA1111BBBB2222", source: "operator trust store (test)" };
const ATTACKER = "DEAD9999BEEF8888";

const signedRelease = { version: "1.1.0", tag: "v1.1.0", signature: "<opaque signature bytes>" };

/** A verifier that always finds a technically perfect signature by whichever key it is told to name. */
const verifierSigningAs = (fingerprint) => () => ({ valid: true, fingerprint });

test("1. a legitimate pack with no external anchor still maintains itself, and claims no origin", async () => {
  // The half that matters operationally: maintenance is not held hostage to release authority.
  // A contributor with no trust configuration — which is every contributor — runs the pack's own gate.
  const own = spawnSync(process.execPath, [CLI, "maintain", `--dir=${REPO}`, "--json"], { encoding: "utf8" });
  assert.equal(own.status, 0, "maintenance must not require an anchor nobody but the release owner holds");
  const envelope = JSON.parse(own.stdout);
  assert.equal(envelope.status, "SELF_MAINTENANCE");

  // The half that matters as a claim: nothing about that green says anything about origin.
  const origin = packOrigin({ release: signedRelease, verify: verifierSigningAs(TRUSTED.fingerprint) });
  assert.equal(origin.status, ORIGIN.NOT_ESTABLISHED);
  assert.equal(origin.reason, ORIGIN_REASON.TRUST_ANCHOR_ABSENT);
  assert.equal(origin.trustedKey, null);
});

test("2. a fork that substitutes its own trust configuration cannot make its own signature canonical", () => {
  // The fork is competent. It holds every byte, it signs correctly, its signature verifies, and its
  // own trust file names its own key — internally consistent in every direction. It fails on the one
  // fact that is not its to change.
  const forkVerifier = verifierSigningAs(ATTACKER);

  const judgedByOperator = packOrigin({ anchor: TRUSTED, release: signedRelease, verify: forkVerifier });
  assert.equal(judgedByOperator.status, ORIGIN.NOT_ESTABLISHED);
  assert.equal(judgedByOperator.reason, ORIGIN_REASON.UNTRUSTED_SIGNER, "a valid signature by the wrong key is refused");
  assert.equal(judgedByOperator.trustedKey, null);

  // And the variant that catches the design mistake rather than the attacker: the fork supplies its
  // own anchor, as it would by shipping `trusted-key.json` in the repository. There is no code path
  // that lets pack-supplied material become the anchor, because the anchor is an argument and this
  // module cannot read a file — so the fork's key arrives as nothing at all.
  const forkAnchor = packOrigin({ release: signedRelease, verify: forkVerifier });
  assert.equal(forkAnchor.reason, ORIGIN_REASON.TRUST_ANCHOR_ABSENT);
});

test("3. an origin-dependent consumer refuses both of those results", () => {
  const noAnchor = packOrigin({ release: signedRelease, verify: verifierSigningAs(TRUSTED.fingerprint) });
  const fork = packOrigin({ anchor: TRUSTED, release: signedRelease, verify: verifierSigningAs(ATTACKER) });

  for (const [name, origin] of [["no anchor", noAnchor], ["attacker fork", fork]]) {
    assert.throws(
      () => assertCanonicalOrigin(origin, "evaluation against the canonical pack"),
      CanonicalOriginRequired,
      `the ${name} case must not be assertable as canonical origin`,
    );
  }
});

test("no field of a green maintenance result substitutes for an origin claim", () => {
  // ADR 0009's property 2 in its next possible costume: a consumer reading the greenest thing it can
  // find. The contract reads `origin.status` and nothing else, so the greenest possible maintenance
  // envelope — including one that has been handed an origin-shaped object that is not established —
  // still refuses.
  const green = { status: "SELF_MAINTENANCE", workingTreeStatus: "COMPLIANT" };
  assert.throws(() => assertCanonicalOrigin(green), CanonicalOriginRequired);
  assert.throws(() => assertCanonicalOrigin({ ...green, origin: { status: ORIGIN.ESTABLISHED } }), CanonicalOriginRequired);
  assert.throws(() => assertCanonicalOrigin(undefined), CanonicalOriginRequired);
  assert.throws(() => assertCanonicalOrigin({ status: "ESTABLISHED_ISH" }), CanonicalOriginRequired);
});

test("the reasons are distinct states, because a boolean would hide the differences that matter", () => {
  const seen = new Map();
  const cases = {
    [ORIGIN_REASON.TRUST_ANCHOR_ABSENT]: { release: signedRelease, verify: verifierSigningAs(TRUSTED.fingerprint) },
    [ORIGIN_REASON.RELEASE_NAME_MISMATCH]: {
      anchor: TRUSTED,
      release: { ...signedRelease, tag: "v9.9.9", mismatch: "v1.1.0" },
      verify: verifierSigningAs(TRUSTED.fingerprint),
    },
    [ORIGIN_REASON.VERIFICATION_UNAVAILABLE]: {
      anchor: TRUSTED,
      release: signedRelease,
      verify: () => ({ status: "unavailable", valid: false, fingerprint: null }),
    },
    [ORIGIN_REASON.RELEASE_UNAVAILABLE]: { anchor: TRUSTED, release: { tag: "v1.1.0", signature: "" }, verify: verifierSigningAs(TRUSTED.fingerprint) },
    [ORIGIN_REASON.VERIFICATION_UNIMPLEMENTED]: { anchor: TRUSTED, release: signedRelease },
    [ORIGIN_REASON.INVALID_SIGNATURE]: { anchor: TRUSTED, release: signedRelease, verify: () => ({ valid: false }) },
    [ORIGIN_REASON.UNTRUSTED_SIGNER]: { anchor: TRUSTED, release: signedRelease, verify: verifierSigningAs(ATTACKER) },
  };

  for (const [expected, input] of Object.entries(cases)) {
    const origin = packOrigin(input);
    assert.equal(origin.status, ORIGIN.NOT_ESTABLISHED, `${expected} must not be established`);
    assert.equal(origin.reason, expected);
    assert.ok(origin.detail.length > 40, `${expected} must say why, in words an operator can act on`);
    assert.ok(!seen.has(origin.reason), `${expected} shares a reason string with ${seen.get(origin.reason)}`);
    seen.set(origin.reason, expected);
  }
  assert.equal(seen.size, 7);
  assert.equal(seen.size, Object.keys(ORIGIN_REASON).length, "every reason the module defines is reachable and distinct");
});

test("established requires all three: an external anchor, a valid signature, and the right signer", () => {
  const established = packOrigin({ anchor: TRUSTED, release: signedRelease, verify: verifierSigningAs(TRUSTED.fingerprint) });
  assert.equal(established.status, ORIGIN.ESTABLISHED);
  assert.equal(established.trustedKey, TRUSTED.fingerprint);
  assert.equal(established.anchorSource, TRUSTED.source, "the record says where the trust came from");
  assert.equal(assertCanonicalOrigin(established), established, "and only this passes the one door");
});

test("the origin module cannot read a trust anchor out of the pack it is authenticating", async () => {
  // Structural, and deliberately so. Every other test here would pass just as well if a future edit
  // added a "fall back to scripts/trusted-key.json when no anchor is supplied" branch — that is the
  // rejected design ADR 0010 names, and it is invisible from the outside precisely because it makes
  // the happy path easier. A module that cannot open a file cannot be persuaded into it.
  const source = await readFile(path.join(REPO, "scripts", "pack-origin.mjs"), "utf8");
  assert.ok(!/from\s+"node:fs/.test(source), "pack-origin.mjs must not import the filesystem");
  assert.ok(!/require\(|readFile|readFileSync|import\(/.test(source), "nor reach one by another route");
  assert.ok(!/ROOT|__dirname|import\.meta\.url/.test(source), "nor learn where the pack is");
});
