/**
 * Policy validation: the YAML subset, the schema, and the semantic checks the schema cannot express.
 *
 * Includes a mutation check on the validator itself. A schema is only worth as much as the evaluator
 * that runs it, and an evaluator that silently skips a constraint reports PASS on a document it
 * never fully checked — so the tests assert that what the schema forbids is actually rejected,
 * rather than assuming it.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml, YamlError } from "../scripts/yaml.mjs";
import { validate, assertSchemaSupported, SchemaError } from "../scripts/jsonschema.mjs";
import { loadCatalog } from "../scripts/catalog.mjs";
import { inspect } from "../scripts/policy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const schema = JSON.parse(await readFile(path.join(REPO, "schemas/project-policy.schema.json"), "utf8"));
const catalog = await loadCatalog(path.join(REPO, "rules"));
const fixture = async (name) =>
  parseYaml(await readFile(path.join(HERE, "fixtures", "policies", `${name}.yml`), "utf8"));

// ---------------------------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------------------------

test("the evaluator implements every keyword the schema uses", () => {
  assert.doesNotThrow(() => assertSchemaSupported(schema));
});

test("an unsupported keyword throws rather than being skipped", () => {
  assert.throws(
    () => assertSchemaSupported({ type: "object", oneOf: [{ type: "string" }] }),
    SchemaError,
    "silently ignoring a constraint would report PASS on a document that was never fully checked",
  );
});

test("this repository's own policy is valid", async () => {
  const policy = parseYaml(await readFile(path.join(REPO, "project-policy.yml"), "utf8"));
  assert.deepEqual(validate(policy, schema), []);
});

test("the adopter template policy is valid", async () => {
  const policy = parseYaml(await readFile(path.join(REPO, "templates/project-policy.yml"), "utf8"));
  assert.deepEqual(validate(policy, schema), []);
});

test("every fixture policy parses, and only invalid-shape fails the schema", async () => {
  const files = (await readdir(path.join(HERE, "fixtures", "policies"))).filter((f) => f.endsWith(".yml"));
  assert.ok(files.length >= 14, "the fixture set should cover every mechanism");
  for (const file of files) {
    const name = file.replace(/\.yml$/, "");
    const policy = await fixture(name);
    const errors = validate(policy, schema);
    if (name === "invalid-shape") {
      assert.ok(errors.length > 0, "invalid-shape must fail the schema");
    } else {
      assert.deepEqual(errors, [], `${name} should be schema-valid so the semantic checks can see it`);
    }
  }
});

/**
 * MUTATION: assert the evaluator actually enforces what the schema declares, rather than the schema
 * merely declaring it.
 */
test("MUTATION: the evaluator rejects each thing the schema forbids", () => {
  const cases = [
    [{ standardVersion: "1.0" }, "an incomplete version"],
    [{ standardVersion: "1.0.0", unknownKey: "x" }, "an unknown top-level property"],
    [{ standardVersion: "1.0.0", project: "" }, "an empty project name"],
    [{ standardVersion: "1.0.0", rules: { "Health.NoCrashDieting": {} } }, "a non-canonical rule id"],
    [{ standardVersion: "1.0.0", applicability: { "health.x": { status: "not-applicable" } } }, "N/A with no reason"],
    [{ standardVersion: "1.0.0", applicability: { "health.x": { status: "maybe", reason: "y" } } }, "an invalid status"],
    [{ standardVersion: "1.0.0", exceptions: [{ rule: "health.x", reason: "y" }] }, "an exception with no approver"],
    [
      { standardVersion: "1.0.0", attestations: { "health.x": { status: "approved", reviewedBy: "a", reviewedAt: "2026-01-01" } } },
      "an attestation with no evidence",
    ],
    [
      { standardVersion: "1.0.0", attestations: { "health.x": { status: "approved", reviewedBy: "a", reviewedAt: "01-01-2026", evidence: "e" } } },
      "a malformed date",
    ],
  ];
  for (const [document, description] of cases) {
    assert.ok(validate(document, schema).length > 0, `should have been rejected: ${description}`);
  }
});

test("a prerelease standardVersion is accepted, so a project can track a series under construction", () => {
  assert.deepEqual(validate({ standardVersion: "1.0.0-dev" }, schema), []);
});

// ---------------------------------------------------------------------------------------------
// The YAML subset is strict on purpose
// ---------------------------------------------------------------------------------------------

test("the parser rejects every construct outside its subset rather than guessing", () => {
  const rejected = [
    ["a:\n\tb: 1", "tabs"],
    ["a: &anchor 1", "anchors"],
    ["a: |\n  block", "block scalars"],
    ["a: {b: 1}", "flow mappings with content"],
    ["a: [1, 2]", "flow sequences with content"],
    ["---\na: 1", "document markers"],
    ["a: 1\na: 2", "duplicate keys"],
    ["a: 'unterminated", "unterminated quotes"],
  ];
  for (const [text, description] of rejected) {
    assert.throws(() => parseYaml(text), YamlError, `should have been rejected: ${description}`);
  }
});

test("empty collections are accepted, because 'explicitly none' is a claim worth making", () => {
  const parsed = parseYaml("exceptions: []\nattestations: {}\n");
  assert.deepEqual(parsed.exceptions, []);
  assert.deepEqual(parsed.attestations, {});
});

test("every scalar is a string; coercion belongs to the schema", () => {
  const parsed = parseYaml("standardVersion: 1.0.0\ncount: 3\n");
  assert.equal(typeof parsed.standardVersion, "string");
  assert.equal(typeof parsed.count, "string", "a parser that returned a number would defeat the pattern check");
});

// ---------------------------------------------------------------------------------------------
// Semantic checks the schema cannot express
// ---------------------------------------------------------------------------------------------

const errorsFor = (policy) => inspect({ policy, catalog }).problems.filter((p) => p.severity === "error");
const warningsFor = (policy) => inspect({ policy, catalog }).problems.filter((p) => p.severity === "warning");

test("an unknown rule id is an error, not a silent no-op", () => {
  const problems = errorsFor({ rules: { "health.no-such-rule": {} } });
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /not a rule in this catalog/);
});

test("an exception against a prohibition or the invariant is an error", async () => {
  assert.ok(errorsFor(await fixture("exception-against-prohibition")).length > 0);
  assert.ok(errorsFor(await fixture("exception-against-invariant")).length > 0);
});

test("a rule both not-applicable and excepted is an error — the claims contradict", async () => {
  const problems = errorsFor(await fixture("conflicting-classification"));
  assert.ok(problems.some((p) => /contradictory/i.test(p.message)));
});

test("lowering a strength, or setting one on a prohibition, is an error", async () => {
  assert.ok(errorsFor(await fixture("strength-lowered")).length > 0);
  assert.ok(errorsFor(await fixture("strength-on-prohibition")).length > 0);
});

test("declaring or attesting the invariant is an error", async () => {
  assert.ok(errorsFor(await fixture("not-applicable-invariant")).length > 0);
  assert.ok(errorsFor(await fixture("attested-invariant")).length > 0);
});

/**
 * The heuristic that watches the one door left open on a prohibition. It cannot judge honesty — that
 * is a manual-review question like the prohibitions themselves — so it warns rather than failing.
 */
test("a not-applicable reason phrased as a preference warns; a scope claim does not", async () => {
  const suspicious = warningsFor(await fixture("false-not-applicable"));
  assert.ok(
    suspicious.some((p) => /preference rather than a limit of scope/.test(p.message)),
    "'because some users want rapid weight loss' is a waiver wearing a scope claim's clothing",
  );

  const honest = warningsFor({
    applicability: {
      "nutrition.no-crash-dieting": {
        status: "not-applicable",
        reason: "Application does not generate dietary plans, calorie targets, or weight-loss recommendations.",
        revisitWhen: "Any capability generates dietary guidance.",
      },
    },
  });
  assert.deepEqual(honest, [], "a genuine scope claim must not be flagged");
});

test("a not-applicable declaration with no revisit trigger warns", () => {
  const problems = warningsFor({
    applicability: { "fitness.plan-documented": { status: "not-applicable", reason: "No training here." } },
  });
  assert.ok(problems.some((p) => /revisitWhen/.test(p.message)));
});

test("this repository's own policy has no semantic errors and declares every rule", async () => {
  const policy = parseYaml(await readFile(path.join(REPO, "project-policy.yml"), "utf8"));
  const report = inspect({ policy, catalog });
  assert.deepEqual(report.problems.filter((p) => p.severity === "error"), []);
  assert.deepEqual(report.undeclared, [], "an undeclared rule is one nobody considered");
  assert.equal(report.declared, 59);
});
