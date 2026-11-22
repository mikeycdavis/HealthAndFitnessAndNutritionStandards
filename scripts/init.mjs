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
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseYaml } from "./yaml.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = path.join(ROOT, "templates");

/** The release this pack is. `init` pins an adopter to it; there is no second copy to drift. */
export function packVersion() {
  return readFileSync(path.join(ROOT, "VERSION"), "utf8").trim();
}

/**
 * Templates are static text except for the version pin. The policy template keeps a schema-valid
 * placeholder value (so it validates as shipped) and `init` rewrites that one line; the CI workflow
 * template carries a {{STANDARD_VERSION}} token for the tag it fetches. Nothing else is substituted.
 */
export function pinTemplate(text, version) {
  return text.replace(/^standardVersion: ".*"$/m, () => `standardVersion: "${version}"`).replaceAll("{{STANDARD_VERSION}}", version);
}

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
  { template: "standards-ci.yml", target: ".github/workflows/standards.yml" },
];

/**
 * Attestations are not a directory: they are entries in project-policy.yml, next to the rule they
 * review. Evidence a review or attestation cites lands in artifacts/evidence.
 */
export const DIRECTORIES = ["artifacts/interpretations", "artifacts/evidence", "artifacts/adr", "docs"];

/** Where things live once installed; init reports this so the adopter does not have to infer it. */
export const LOCATIONS = [
  ["policy, applicability, exceptions, attestations", "project-policy.yml"],
  ["health interpretation records", "artifacts/interpretations/"],
  ["evidence cited by a review or attestation", "artifacts/evidence/"],
  ["agent instructions", "AGENTS.md, CLAUDE.md, .github/copilot-instructions.md"],
  ["CI check at the pinned release", ".github/workflows/standards.yml"],
];

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
export async function plan({ dir, forceOverwrite = [], templatesDir = TEMPLATES, version = packVersion() }) {
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
    const content = pinTemplate(await readFile(templatePath, "utf8"), version);
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
  return { actions, conflicts, pin: await pinStatus(dir, version) };
}

/** The release this project declares versus the one this pack would pin. Never edits the policy. */
async function pinStatus(dir, version) {
  const file = path.join(dir, "project-policy.yml");
  if (!existsSync(file)) return { expected: version, declared: null };
  try {
    const declared = parseYaml(await readFile(file, "utf8"))?.standardVersion;
    return { expected: version, declared: typeof declared === "string" ? declared : null };
  } catch {
    return { expected: version, declared: null, unreadable: true };
  }
}

/**
 * Pure read. What the adopter must still do before a verdict can be anything but NOT_EVALUATED, and
 * which prohibitions bind before implementation. It reports what the catalog and the project's own
 * policy say; it does not decide which standards apply (that is the adopter's declaration, with a
 * reason, in project-policy.yml) and it does not compute the verdict (`standards check` does).
 */
export async function briefing({ dir, catalog }) {
  const prohibitions = [...(catalog.byKind.get("prohibition") ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  let policy = {};
  let unreadable = false;
  const file = path.join(dir, "project-policy.yml");
  if (existsSync(file)) {
    try {
      policy = parseYaml(await readFile(file, "utf8")) ?? {};
    } catch {
      unreadable = true;
    }
  }
  const has = (section, id) => Object.hasOwn(policy[section] ?? {}, id);
  const excepted = (id) => Array.isArray(policy.exceptions) && policy.exceptions.some((e) => e?.rule === id);
  const unreviewed = prohibitions.filter((r) => policy.attestations?.[r.id]?.status !== "approved" && !has("applicability", r.id));
  const undeclared = [...catalog.rules.keys()].filter((id) => !["rules", "applicability", "attestations"].some((s) => has(s, id)) && !excepted(id));
  const categories = [...catalog.byCategory.entries()].map(([name, rules]) => [name, rules.length]).sort((a, b) => a[0].localeCompare(b[0]));
  return { total: catalog.rules.size, categories, prohibitions, unreviewed, undeclared, unreadable };
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

export function render({ mode, actions, conflicts, dryRun, pin, briefing: brief }) {
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
    out.push("These files exist and differ from the templates. They were left exactly as they are:");
    for (const c of conflicts) out.push(`  ${c.path}`);
    out.push("Everything else above was reconciled; nothing you wrote was touched.");
    out.push("To replace one, review it, then re-run naming the exact path:");
    out.push(`  standards init --force-overwrite=${conflicts[0].path}`);
    out.push("Approving one path does not approve another.");
    out.push("");
  }
  if (pin?.declared && pin.declared !== pin.expected) {
    out.push(`Version pin: project-policy.yml declares ${pin.declared}; this pack is ${pin.expected}. Not changed.`);
    out.push("  Re-pin deliberately, and re-review what changed: init never edits an existing policy.");
    out.push("");
  } else if (pin?.unreadable) {
    out.push("Version pin: project-policy.yml could not be parsed, so its pin was not compared.");
    out.push("");
  }
  if (dryRun) {
    out.push("Dry run: nothing was written. This is the same action list apply would execute.");
    out.push("");
  }

  if (brief) {
    out.push("Where things live:");
    for (const [what, where] of LOCATIONS) out.push(`  ${what.padEnd(44)} ${where}`);
    out.push("");
    out.push(`Standards in this release (${pin?.expected ?? "?"}): ${brief.total} rules — ${brief.categories.map(([n, c]) => `${n} ${c}`).join(", ")}.`);
    out.push("Which of them apply to YOUR project is your declaration, with a reason, in project-policy.yml.");
    out.push("init does not decide that; the detection above is evidence about the repository, not a judgement.");
    out.push("");
    out.push(`Prohibitions that bind before any implementation (${brief.prohibitions.length}; none may be waived):`);
    for (const r of brief.prohibitions) out.push(`  ${r.id}`);
    out.push("  Read one with: standards explain <rule-id> .   The full list: PROHIBITIONS.md.");
    out.push("");
    if (brief.unreadable) {
      out.push("Initial status not established: project-policy.yml could not be parsed, so what is missing could not be counted.");
    } else if (brief.unreviewed.length > 0) {
      out.push("Initial status: expect NOT_EVALUATED (exit 4) from `standards check .`. init does not compute it. Missing:");
      out.push(`  - ${brief.unreviewed.length} of ${brief.prohibitions.length} prohibitions have no recorded human review and no not-applicable declaration;`);
      out.push("    review each, then record an attestation (or a not-applicable reason that the behavior cannot occur).");
      out.push(`  - ${brief.undeclared.length} of ${brief.total} rules are not mentioned in the policy at all.`);
      out.push("  That is the honest answer, not a failure: nothing failing is not evidence that anything passed.");
    } else {
      out.push("Every prohibition has a recorded review or declaration. Run `standards check .` for the verdict; init does not compute it.");
    }
  }

  return out.join("\n") + "\n";
}

/** List the domain templates available for an adopter to copy. */
export async function domainTemplates(templatesDir = TEMPLATES) {
  if (!existsSync(templatesDir)) return [];
  return (await readdir(templatesDir)).filter((f) => DOMAIN_TEMPLATES.includes(f)).sort();
}
