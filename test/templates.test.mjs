/**
 * Templates and detectors must share one vocabulary.
 *
 * The templates tell an adopter which headings to write; the detectors look for those headings. If
 * they drift, every adopting project follows the templates faithfully and fails the checks, which is
 * the worst kind of failure — the tool blaming a project for doing what it was told.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sectionBody, TIER_LABELS } from "../scripts/standards.mjs";
import { ARTIFACTS, DIRECTORIES, DOMAIN_TEMPLATES } from "../scripts/init.mjs";
import { loadCatalog } from "../scripts/catalog.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const template = (name) => readFile(path.join(REPO, "templates", name), "utf8");
const catalog = await loadCatalog(path.join(REPO, "rules"));

/** The headings the detectors require, per artifact. Kept here as the independent statement. */
const REQUIRED_HEADINGS = {
  "interpretation-record.md": [
    "Context",
    "Measurement Quality",
    "Baseline",
    "Uncertainty",
    "Medications and Contextual Factors",
    "Escalation Tier",
  ],
  "fitness-plan.md": [
    "Goals",
    "Baseline",
    "Progression",
    "Recovery and Rest",
    "Pain and Injury Response",
    "Review Cadence",
  ],
  "nutrition-plan.md": ["Targets", "Adequacy", "Restrictions and Context"],
};

test("every domain template carries the headings its detector looks for", async () => {
  for (const [file, headings] of Object.entries(REQUIRED_HEADINGS)) {
    const text = (await template(file)).replace(/<!--[\s\S]*?-->/g, "");
    for (const heading of headings) {
      assert.notEqual(
        sectionBody(text, heading),
        null,
        `templates/${file} must contain '## ${heading}' — the detector looks for it literally`,
      );
    }
  }
});

test("the interpretation template names all four canonical tiers", async () => {
  const text = (await template("interpretation-record.md")).toLowerCase();
  for (const label of TIER_LABELS) {
    assert.ok(text.includes(label), `the template must show the '${label}' label an author is meant to use`);
  }
});

test("the worked examples satisfy the same headings, so the fixtures built from them are real", async () => {
  const cases = [
    ["docs/examples/interpretation-normal-variation.md", REQUIRED_HEADINGS["interpretation-record.md"]],
    ["docs/examples/interpretation-worth-monitoring.md", REQUIRED_HEADINGS["interpretation-record.md"]],
    ["docs/examples/interpretation-worth-discussing.md", REQUIRED_HEADINGS["interpretation-record.md"]],
    ["docs/examples/interpretation-potentially-urgent.md", REQUIRED_HEADINGS["interpretation-record.md"]],
    ["docs/examples/fitness-plan.md", REQUIRED_HEADINGS["fitness-plan.md"]],
    ["docs/examples/nutrition-plan.md", REQUIRED_HEADINGS["nutrition-plan.md"]],
  ];
  for (const [file, headings] of cases) {
    const text = await readFile(path.join(REPO, file), "utf8");
    for (const heading of headings) {
      const body = sectionBody(text, heading);
      assert.ok(body, `${file} must have a non-empty '## ${heading}'`);
    }
  }
});

test("each per-tier example assigns its own tier and no other", async () => {
  const cases = [
    ["interpretation-normal-variation.md", "normal variation"],
    ["interpretation-worth-monitoring.md", "worth monitoring"],
    ["interpretation-worth-discussing.md", "worth discussing with a professional"],
    ["interpretation-potentially-urgent.md", "potentially urgent"],
  ];
  for (const [file, expected] of cases) {
    const text = await readFile(path.join(REPO, "docs/examples", file), "utf8");
    const body = sectionBody(text, "Escalation Tier").toLowerCase();
    const matched = TIER_LABELS.filter((label) => body.includes(label));
    assert.deepEqual(matched, [expected], `${file} must assign exactly '${expected}'`);
  }
});

test("templates reference only canonical rule ids that exist", async () => {
  const files = await readdir(path.join(REPO, "templates"));
  for (const file of files) {
    const text = await readFile(path.join(REPO, "templates", file), "utf8");
    for (const m of text.matchAll(/\b((?:health|fitness|nutrition|escalation|trend|integrity)\.[a-z0-9-]+)\b/g)) {
      assert.ok(catalog.rules.has(m[1]), `templates/${file} names ${m[1]}, which is not a rule`);
    }
  }
});

test("every artifact init writes has a template, and every domain template exists", async () => {
  for (const artifact of ARTIFACTS) {
    assert.ok(
      existsSync(path.join(REPO, "templates", artifact.template)),
      `init writes ${artifact.target} from a template that does not exist`,
    );
  }
  for (const name of DOMAIN_TEMPLATES) {
    assert.ok(existsSync(path.join(REPO, "templates", name)), `missing domain template ${name}`);
  }
  assert.ok(DIRECTORIES.includes("artifacts/interpretations"));
});

/** Collapse wrapping, so these assertions test content rather than where a line happened to break. */
const flat = (text) => text.replace(/\s+/g, " ");

test("AGENTS.md carries the stop rule, in full, as something an agent can act on", async () => {
  const text = flat(await template("AGENTS.md"));
  assert.match(text, /stop and say so/i, "the refusal must be stated, not implied");
  assert.match(text, /BLOCKED_BY_INVARIANT/, "the agent must know what the mechanical form looks like");
  assert.match(text, /NOT_EVALUATED/, "the agent must know it may conclude it does not know");
  assert.match(text, /never be required to produce a positive|may always conclude/i);
  for (const phrase of ["exception against a prohibition", "lower a rule's strength", "review that did not happen"]) {
    assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), `the stop rule must name: ${phrase}`);
  }
});

test("CLAUDE.md defers to AGENTS.md rather than restating it", async () => {
  const claude = await template("CLAUDE.md");
  const agents = await template("AGENTS.md");
  assert.ok(claude.length < agents.length, "two files describing how to work here will disagree within a month");
  assert.match(claude, /AGENTS\.md/);
  assert.ok(!/Load first/i.test(claude), "the load sequence lives in one place");
});

test("the copilot template carries the stop rule, because it is the one most likely to be skimmed", async () => {
  const text = flat(await template("copilot-instructions.md"));
  assert.match(text, /stop and say so/i);
  assert.match(text, /do not know|insufficient evidence/i);
});

test("the adopter policy template warns that NOT_EVALUATED is expected", async () => {
  const text = await template("project-policy.yml");
  assert.match(text, /NOT_EVALUATED/);
  assert.match(text, /BLOCKED_BY_INVARIANT/);
  assert.match(text, /cannot occur/i, "the not-applicable semantics must be spelled out for an adopter");
});

test("the PROJECT template requires a scope statement, since escalation.scope-disclosed looks for one", async () => {
  const text = flat(await template("PROJECT.md"));
  assert.match(text, /## Scope/);
  assert.match(text, /not a substitute|does not diagnose/i);
});

// ---------------------------------------------------------------------------------------------
// PROHIBITIONS.md is checked, not generated
// ---------------------------------------------------------------------------------------------

test("PROHIBITIONS.md lists exactly the catalog's prohibitions and the invariant, verbatim", async () => {
  const md = await readFile(path.join(REPO, "PROHIBITIONS.md"), "utf8");
  const listed = [...catalog.rules.values()].filter((r) => r.kind === "prohibition" || r.kind === "invariant");
  assert.equal(listed.length, 35);

  for (const rule of listed) {
    assert.ok(md.includes("`" + rule.id + "`"), `PROHIBITIONS.md does not list ${rule.id}`);
    const quoted = rule.description.replace(/^Never\s+/i, "");
    assert.ok(md.includes(quoted), `PROHIBITIONS.md does not carry the wording of ${rule.id} verbatim`);
  }

  const mentioned = new Set([...md.matchAll(/`([a-z]+\.[a-z0-9-]+)`/g)].map((m) => m[1]));
  for (const id of mentioned) {
    assert.ok(catalog.rules.has(id), `PROHIBITIONS.md names ${id}, which is not a rule`);
  }
});

test("PROHIBITIONS.md states the not-applicable semantics, since that is the only door left open", async () => {
  const md = await readFile(path.join(REPO, "PROHIBITIONS.md"), "utf8");
  assert.match(md, /cannot occur within the evaluated scope/i);
  assert.match(md, /integrity violation/i);
  assert.match(md, /nutrition\.no-crash-dieting/, "the worked example makes the distinction concrete");
});

test("every standards link in PROHIBITIONS.md resolves", async () => {
  const md = await readFile(path.join(REPO, "PROHIBITIONS.md"), "utf8");
  const links = new Set([...md.matchAll(/\((standards\/[^)#]+)/g)].map((m) => m[1]));
  assert.ok(links.size > 20);
  for (const link of links) {
    assert.ok(existsSync(path.join(REPO, link)), `PROHIBITIONS.md links to ${link}, which does not exist`);
  }
});
