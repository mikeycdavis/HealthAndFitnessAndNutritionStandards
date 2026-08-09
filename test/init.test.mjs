/**
 * init: the dry-run contract and the safety contract.
 *
 * The design brief requires that "dry-run and apply must derive from the same underlying plan so
 * that dry-run accurately represents what would happen". That is satisfied structurally — plan() is
 * pure and apply() executes exactly what it returned — and asserted here, because a structural
 * guarantee that nobody checks is one edit away from not being a guarantee.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { plan, apply, detectMode, ARTIFACTS } from "../scripts/init.mjs";
import { parseYaml } from "../scripts/yaml.mjs";
import { validate } from "../scripts/jsonschema.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..");
const schema = JSON.parse(await readFile(path.join(REPO, "schemas/project-policy.schema.json"), "utf8"));

const temp = async () => mkdtemp(path.join(os.tmpdir(), "init-"));

test("the dry run's action list is exactly the list apply executes", async () => {
  const dir = await temp();
  const before = await plan({ dir });

  // A dry run is plan() without apply(), so nothing may have been written.
  assert.equal(existsSync(path.join(dir, "project-policy.yml")), false);

  await apply({ dir, actions: before.actions });

  // Every action the dry run described must have happened.
  for (const action of before.actions) {
    if (action.kind === "create" || action.kind === "mkdir") {
      assert.ok(existsSync(path.join(dir, action.path)), `the dry run said it would create ${action.path}`);
    }
  }
  const created = before.actions.filter((a) => a.kind === "create").map((a) => a.path);
  assert.deepEqual(created.sort(), ARTIFACTS.map((a) => a.target).sort());

  await rm(dir, { recursive: true, force: true });
});

test("a second run converges: everything is preserved, nothing rewritten", async () => {
  const dir = await temp();
  const first = await plan({ dir });
  await apply({ dir, actions: first.actions });

  const second = await plan({ dir });
  assert.deepEqual(second.conflicts, []);
  for (const action of second.actions) {
    assert.notEqual(action.kind, "create", `${action.path} was created twice`);
    assert.notEqual(action.kind, "overwrite", `${action.path} was rewritten on a second run`);
  }
  assert.ok(second.actions.every((a) => a.kind === "preserve"));

  await rm(dir, { recursive: true, force: true });
});

test("a file that exists and differs is a conflict: nothing is written", async () => {
  const dir = await temp();
  await writeFile(path.join(dir, "PROJECT.md"), "# Ours, hand-written and important\n");

  const { actions, conflicts } = await plan({ dir });
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].path, "PROJECT.md");

  await apply({ dir, actions: actions.filter((a) => a.kind !== "conflict") });
  assert.equal(
    await readFile(path.join(dir, "PROJECT.md"), "utf8"),
    "# Ours, hand-written and important\n",
    "a conflicting file must be left exactly as it was",
  );

  await rm(dir, { recursive: true, force: true });
});

test("overwriting requires naming the exact path, and approving one does not approve another", async () => {
  const dir = await temp();
  await writeFile(path.join(dir, "PROJECT.md"), "# Ours\n");
  await writeFile(path.join(dir, "AGENTS.md"), "# Also ours\n");

  const { actions, conflicts } = await plan({ dir, forceOverwrite: ["PROJECT.md"] });
  const overwrites = actions.filter((a) => a.kind === "overwrite");
  assert.deepEqual(overwrites.map((a) => a.path), ["PROJECT.md"]);
  assert.ok(overwrites[0].destructive, "an overwrite must be marked destructive");
  assert.deepEqual(conflicts.map((c) => c.path), ["AGENTS.md"], "the unnamed path stays a conflict");

  await rm(dir, { recursive: true, force: true });
});

test("a bootstrapped project's policy validates against the real schema", async () => {
  const dir = await temp();
  const { actions } = await plan({ dir });
  await apply({ dir, actions });

  const policy = parseYaml(await readFile(path.join(dir, "project-policy.yml"), "utf8"));
  assert.deepEqual(validate(policy, schema), [], "init must not produce a policy its own schema rejects");

  await rm(dir, { recursive: true, force: true });
});

test("init creates the artifact directories empty, and seeds no health data", async () => {
  const dir = await temp();
  const { actions } = await plan({ dir });
  await apply({ dir, actions });

  const interpretations = path.join(dir, "artifacts/interpretations");
  assert.ok(existsSync(interpretations));
  assert.deepEqual(
    await readdir(interpretations),
    [],
    "writing a specimen record into a real project would seed it with fabricated measurements",
  );

  await rm(dir, { recursive: true, force: true });
});

test("mode detection labels its confidence, and a stated mode is CONFIRMED_BY_OWNER", async () => {
  const dir = await temp();

  const inferred = await detectMode(dir);
  assert.equal(inferred.mode, "greenfield");
  assert.equal(inferred.confidence, "INFERRED");

  await mkdir(path.join(dir, "artifacts/interpretations"), { recursive: true });
  await writeFile(path.join(dir, "project-policy.yml"), 'standardVersion: "1.0.0"\n');
  const detected = await detectMode(dir);
  assert.equal(detected.mode, "adopted");
  assert.ok(detected.evidence.length > 0, "an inference must carry the evidence it rests on");

  const stated = await detectMode(dir, "greenfield");
  assert.equal(stated.confidence, "CONFIRMED_BY_OWNER");
  assert.equal(stated.mode, "greenfield");

  await rm(dir, { recursive: true, force: true });
});

test("a missing template is reported rather than silently skipped", async () => {
  const dir = await temp();
  const empty = await temp();
  const { actions } = await plan({ dir, templatesDir: empty });
  assert.ok(actions.every((a) => a.kind === "mkdir" || a.kind === "missing-template"));
  assert.equal(actions.filter((a) => a.kind === "missing-template").length, ARTIFACTS.length);
  await rm(dir, { recursive: true, force: true });
  await rm(empty, { recursive: true, force: true });
});
