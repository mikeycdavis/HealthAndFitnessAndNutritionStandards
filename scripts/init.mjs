/**
 * Bootstrap an adopting project: write the policy, the manifest, the agent instructions, and the
 * artifact directories the standards expect.
 *
 * THE STRUCTURE IS THE SAFETY PROPERTY. `plan()` is pure — it reads the target and returns a list of
 * actions, writing nothing. `apply()` is the only writer, and it executes exactly the list `plan()`
 * produced. `--dry-run` is therefore literally `plan()` without `apply()`, not a parallel rendering
 * path that describes what a separate code path would do.
 *
 * The design brief requires that "dry-run and apply must derive from the same underlying plan so
 * that dry-run accurately represents what would happen". Two functions where one calls the other
 * satisfies that by construction; two functions that each decide what to do satisfies it only for as
 * long as nobody edits one of them. A test asserts the action lists are identical.
 *
 * THE OTHER SAFETY PROPERTY is what happens to a file that already exists and differs from what we
 * would write. It is a `conflict`: nothing is written, the run exits 1, and the path is reported.
 * Overwriting requires naming the exact path with --force-overwrite, and approving one path does not
 * approve another. A tool that silently overwrote an adopting project's policy would destroy the
 * applicability reasoning that policy exists to hold.
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = path.join(ROOT, "templates");

/**
 * What `init` creates. Each entry names a template and where it lands in the target project.
 * Directories are created empty where the standards expect a location rather than a starting file:
 * writing a specimen interpretation record into a real project would seed it with fictional health
 * data, which is exactly what Standard 5's prohibition on fabricated measurements is about.
 */
export const ARTIFACTS = [
  { template: "project-policy.yml", target: "project-policy.yml" },
  { template: "PROJECT.md", target: "PROJECT.md" },
  { template: "AGENTS.md", target: "AGENTS.md" },
  { template: "CLAUDE.md", target: "CLAUDE.md" },
  { template: "copilot-instructions.md", target: ".github/copilot-instructions.md" },
];

export const DIRECTORIES = ["artifacts/interpretations", "artifacts/adr", "docs"];

/** Domain templates an adopter copies per artifact, rather than having init place them. */
export const DOMAIN_TEMPLATES = ["interpretation-record.md", "fitness-plan.md", "nutrition-plan.md"];

/**
 * Detect what kind of project this is, so the report can say what was assumed. `confidence` is
 * INFERRED unless the caller stated the mode, in which case it is CONFIRMED_BY_OWNER — the same
 * labelling discipline the standards require of health interpretations, applied to the tool's own
 * claims about a repository.
 */
export async function detectMode(dir, stated) {
  const evidence = [];
  const has = (p) => existsSync(path.join(dir, p));

  if (has("project-policy.yml")) evidence.push("project-policy.yml already exists");
  if (has("artifacts/interpretations")) evidence.push("artifacts/interpretations/ exists");
  if (has("artifacts/fitness-plan.md")) evidence.push("artifacts/fitness-plan.md exists");
  if (has("artifacts/nutrition-plan.md")) evidence.push("artifacts/nutrition-plan.md exists");
  if (has(".git")) evidence.push("git repository");

  const mode = stated ?? (evidence.some((e) => e.includes("project-policy")) ? "adopted" : "greenfield");
  return { mode, evidence, confidence: stated ? "CONFIRMED_BY_OWNER" : "INFERRED" };
}

/**
 * Pure. Returns { actions, conflicts } without touching the filesystem beyond reading.
 *
 * Action kinds:
 *   create    — the target does not exist; it will be written
 *   preserve  — the target exists and is byte-identical to the template; nothing to do
 *   conflict  — the target exists and differs; nothing is written unless explicitly overwritten
 *   overwrite — the target exists, differs, and the exact path was named in forceOverwrite
 *   mkdir     — a directory the standards expect
 */
export async function plan({ dir, forceOverwrite = [], templatesDir = TEMPLATES }) {
  const actions = [];

  for (const rel of DIRECTORIES) {
    const target = path.join(dir, rel);
    if (!existsSync(target)) actions.push({ kind: "mkdir", path: rel });
  }

  for (const artifact of ARTIFACTS) {
    const templatePath = path.join(templatesDir, artifact.template);
    if (!existsSync(templatePath)) {
      actions.push({ kind: "missing-template", path: artifact.target, template: artifact.template });
      continue;
    }
    const content = await readFile(templatePath, "utf8");
    const target = path.join(dir, artifact.target);

    if (!existsSync(target)) {
      actions.push({ kind: "create", path: artifact.target, content });
      continue;
    }
    const existing = await readFile(target, "utf8");
    if (existing === content) {
      actions.push({ kind: "preserve", path: artifact.target });
    } else if (forceOverwrite.includes(artifact.target)) {
      actions.push({ kind: "overwrite", path: artifact.target, content, destructive: true });
    } else {
      actions.push({ kind: "conflict", path: artifact.target });
    }
  }

  const conflicts = actions.filter((a) => a.kind === "conflict");
  return { actions, conflicts };
}

/** The only writer. Executes exactly the actions `plan()` produced. */
export async function apply({ dir, actions }) {
  const done = [];
  for (const action of actions) {
    if (action.kind === "mkdir") {
      await mkdir(path.join(dir, action.path), { recursive: true });
      done.push(action);
      continue;
    }
    if (action.kind === "create" || action.kind === "overwrite") {
      const target = path.join(dir, action.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, action.content, "utf8");
      done.push(action);
    }
    // preserve, conflict, and missing-template write nothing by definition.
  }
  return done;
}

export function render({ mode, actions, conflicts, dryRun }) {
  const out = [];
  out.push(`Mode: ${mode.mode} (${mode.confidence})`);
  if (mode.evidence.length > 0) out.push(`  Evidence: ${mode.evidence.join("; ")}`);
  out.push("");

  const label = {
    mkdir: dryRun ? "would create directory" : "created directory",
    create: dryRun ? "would create" : "created",
    overwrite: dryRun ? "would OVERWRITE" : "OVERWROTE",
    preserve: "already matches, left alone",
    conflict: "exists and differs — NOT written",
    "missing-template": "template missing from this repository",
  };

  for (const action of actions) out.push(`  ${label[action.kind].padEnd(32)} ${action.path}`);
  if (actions.length === 0) out.push("  nothing to do");
  out.push("");

  if (conflicts.length > 0) {
    out.push("Nothing was written, because these files exist and differ from the templates:");
    for (const c of conflicts) out.push(`  ${c.path}`);
    out.push("");
    out.push("Review each, then re-run naming the exact path to replace it:");
    out.push(`  standards init --force-overwrite=${conflicts[0].path}`);
    out.push("Approving one path does not approve another.");
  } else if (dryRun) {
    out.push("Dry run: nothing was written. This is the same action list apply would execute.");
  } else {
    out.push("Next: edit project-policy.yml to declare what applies to this project, then run");
    out.push("`standards check .` — expect NOT_EVALUATED until a human has reviewed the prohibitions.");
  }

  return out.join("\n") + "\n";
}

/** List the domain templates available for an adopter to copy. */
export async function domainTemplates(templatesDir = TEMPLATES) {
  if (!existsSync(templatesDir)) return [];
  return (await readdir(templatesDir)).filter((f) => DOMAIN_TEMPLATES.includes(f)).sort();
}
