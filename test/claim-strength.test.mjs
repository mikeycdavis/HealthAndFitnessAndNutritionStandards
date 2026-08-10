/**
 * Claim-strength agreement between a standard and its rule's rationale.
 *
 * This guard exists because of a real defect, found in the 1.0.0 release review and not by any
 * check here. Standard 37 R2 said shame "is a documented component of disordered eating patterns";
 * the rationale of `nutrition.no-food-moralizing` said "a documented component of disordered
 * eating". Dropping "patterns" made the JSON copy the broader claim, and nothing noticed, because
 * the rationale fields are prose in a data file and get read less carefully than standards text.
 *
 * Standard 14 R1 requires a claim to carry an indication of how well established it is. A claim
 * stated at two strengths in two files fails that on its own terms, whichever strength is right.
 *
 * So: where a rule's rationale restates an empirical claim its parent standard also makes, the
 * sentence is pinned here and must appear byte-identically in both. The list is deliberately short
 * and hand-maintained. A generic check would have to decide what counts as "the same claim", which
 * is the judgement this repository does not claim a machine can make.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Collapse the line wrapping in a markdown file so a wrapped sentence compares as one string. */
const flat = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Each entry: a claim that lives in two places, and must live there at one strength.
 * `sentence` is the shared text, verbatim. Both files must contain it.
 */
const SHARED_CLAIMS = [
  {
    rule: "nutrition.no-food-moralizing",
    catalog: "rules/nutrition.json",
    standard: "standards/37-dietary-quality.md",
    sentence:
      "Moralising food can contribute to shame and to rigid eating patterns, and weight-related " +
      "stigma and internalised stigma are associated with disordered-eating outcomes.",
    why: "Release review 1.0.0: the rationale dropped 'patterns' and broadened the claim.",
  },
];

test("a claim stated in both a standard and its rationale is stated at one strength", async () => {
  for (const claim of SHARED_CLAIMS) {
    const standardText = flat(await readFile(path.join(ROOT, claim.standard), "utf8"));
    const catalogRaw = await readFile(path.join(ROOT, claim.catalog), "utf8");
    const rule = JSON.parse(catalogRaw).rules.find((r) => r.id === claim.rule);

    assert.ok(rule, `${claim.rule} is not in ${claim.catalog}`);

    assert.ok(
      standardText.includes(claim.sentence),
      `${claim.standard} no longer contains the pinned sentence for ${claim.rule}.\n` +
        `If the claim was deliberately reworded, reword it in BOTH places and update this test.\n` +
        `Why this is pinned: ${claim.why}\n` +
        `Expected: ${claim.sentence}`,
    );

    assert.ok(
      flat(rule.rationale).includes(claim.sentence),
      `The rationale of ${claim.rule} no longer contains the pinned sentence.\n` +
        `A rationale must not state its standard's claim at a different strength.\n` +
        `Why this is pinned: ${claim.why}\n` +
        `Expected: ${claim.sentence}\n` +
        `Actual rationale: ${rule.rationale}`,
    );
  }
});

test("mutation: weakening or strengthening one copy fails the check", async () => {
  const claim = SHARED_CLAIMS[0];
  const standardText = flat(await readFile(path.join(ROOT, claim.standard), "utf8"));

  // The defect that was actually shipped: "disordered-eating outcomes" broadened by dropping a
  // qualifier. Reintroduce it against the real standard text and assert the comparison rejects it.
  const drifted = claim.sentence.replace("rigid eating patterns", "rigid eating");
  assert.notEqual(drifted, claim.sentence, "the mutation must actually change the sentence");
  assert.ok(
    !standardText.includes(drifted),
    "the drifted wording must not be present in the standard — otherwise this guard proves nothing",
  );
});
