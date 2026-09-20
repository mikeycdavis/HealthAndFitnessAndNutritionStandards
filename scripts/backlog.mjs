/**
 * Validate a backlog of Extended Agile Hierarchy items and regenerate its master
 * tracking document.
 *
 * Each item is a markdown file whose YAML frontmatter carries the tracking
 * metadata. The frontmatter is the single source of truth: the tracker is
 * derived from it and never hand-edited, so the two cannot drift.
 *
 * Repository-agnostic — paths resolve from the working directory, so the same
 * script runs in any project.
 *
 * Usage:
 *   node scripts/backlog.mjs                  # validate + rewrite the tracker
 *   node scripts/backlog.mjs --check          # fail if invalid or the tracker is stale
 *   node scripts/backlog.mjs --json           # emit the interchange contract on stdout
 *   node scripts/backlog.mjs --dir=docs/work  # use a different backlog directory
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import path from "node:path";

const CHECK_ONLY = process.argv.includes("--check");
const JSON_MODE = process.argv.includes("--json");

/**
 * Modes that may not touch the working tree. `--check` earned this rule first; `--json` inherits
 * it for the same reason and one more — a query that scaffolds a directory as a side effect is
 * not a query, and a consumer reading stdout would never see that it happened.
 */
const READ_ONLY = CHECK_ONLY || JSON_MODE;

/**
 * Walk up from the working directory to the project root.
 *
 * Without this, running from a subdirectory would resolve a backlog path
 * relative to that subdirectory and scaffold a stray one there.
 */
function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ".git")) || existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

const ROOT = findRoot(process.cwd());

/**
 * Where the backlog lives. An explicit --dir wins; otherwise take the first
 * conventional location that already exists, and fall back to creating
 * artifacts/backlog for a project that has none yet.
 */
const CANDIDATES = ["artifacts/backlog", "docs/backlog", "backlog"];
const dirArg = process.argv.find((a) => a.startsWith("--dir="))?.slice("--dir=".length);
const BACKLOG_DIR = dirArg
  ? path.resolve(ROOT, dirArg)
  : path.resolve(
      ROOT,
      CANDIDATES.find((c) => existsSync(path.join(ROOT, c, "items"))) ?? CANDIDATES[0],
    );

const ITEMS_DIR = path.join(BACKLOG_DIR, "items");
const TRACKER = path.join(BACKLOG_DIR, "README.md");

/**
 * A backlog that lives in GitHub Issues must not be recreated as files. The mapping's `authority` is
 * the record of where the backlog lives; when it says "github" this generator refuses in every mode,
 * before anything is read or written. Without an explicit --dir every conventional location is
 * checked, because the default above falls back to artifacts/backlog when no items directory exists,
 * which is exactly the state of a repository that has moved. An unreadable mapping is not an
 * authority claim and is ignored.
 */
for (const dir of dirArg ? [BACKLOG_DIR] : CANDIDATES.map((c) => path.resolve(ROOT, c))) {
  const file = path.join(dir, "github-mapping.json");
  if (!existsSync(file)) continue;
  let mapping;
  try { mapping = JSON.parse(readFileSync(file, "utf8")); } catch { continue; }
  if (mapping.authority === "github") {
    const repo = mapping.target ?? mapping.source ?? "<owner/name>";
    console.error(`  ! This backlog is in GitHub Issues (${path.relative(ROOT, file)} says authority "github"), not in files.`);
    console.error(`    Read it at https://github.com/${repo}/issues, or with: gh issue list --repo ${repo}`);
    console.error("    This script will not run: it would create item files and restore a second source of truth.");
    process.exit(1);
  }
}

/**
 * This script exists twice: once inside the `backlog-validate` skill, so it runs
 * in any repository, and once inside a project that wants CI to fail on a stale
 * tracker — CI has no access to a developer's skills directory, so the copy is
 * unavoidable.
 *
 * Two copies drift. Nothing else would notice, so whichever copy is running
 * looks for its twin and says so when they differ. A warning rather than an
 * error: a project's CI must not fail because someone's local skill is a
 * version behind.
 */
function warnIfCopiesDiffer() {
  const self = fileURLToPath(import.meta.url);
  const twins = [
    path.join(ROOT, "scripts", "backlog.mjs"),
    path.join(homedir(), ".claude", "skills", "backlog-validate", "scripts", "backlog.mjs"),
  ];

  for (const twin of twins) {
    if (path.resolve(twin) === path.resolve(self) || !existsSync(twin)) continue;
    try {
      const norm = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
      if (norm(twin) !== norm(self)) {
        console.warn(
          `  ! This script and ${path.relative(ROOT, twin).replace(/\\/g, "/") || twin} have diverged.\n` +
            "    They are meant to be identical copies. Reconcile them before trusting either.",
        );
      }
    } catch {
      // Unreadable twin is not worth failing over.
    }
  }
}

/**
 * The Extended Agile Hierarchy, outermost first. `parent` must always be the
 * level immediately above, which is what keeps the tree from growing shortcuts
 * that make roll-ups meaningless.
 */
const LEVELS = [
  { type: "theme", prefix: "TH", label: "Theme" },
  { type: "initiative", prefix: "IN", label: "Initiative" },
  { type: "epic", prefix: "EP", label: "Epic" },
  { type: "feature", prefix: "FE", label: "Feature" },
  { type: "story", prefix: "ST", label: "Story" },
  { type: "task", prefix: "TA", label: "Task" },
];
const LEVEL_BY_TYPE = new Map(LEVELS.map((l, i) => [l.type, { ...l, depth: i }]));
const LEVEL_BY_PREFIX = new Map(LEVELS.map((l, i) => [l.prefix, { ...l, depth: i }]));

// The canonical lifecycle vocabulary — Standard 8 of the engineering standards, decided in
// ADR 0001. These eight tokens mean the same thing here as in a project plan or any other repository.
const STATUSES = [
  "NOT_STARTED", "READY", "IN_PROGRESS", "BLOCKED",
  "IN_REVIEW", "COMPLETE", "DEFERRED", "CANCELLED",
];
const STATUS_LABEL = {
  NOT_STARTED: "Not started",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  IN_REVIEW: "In review",
  COMPLETE: "Complete",
  DEFERRED: "Deferred",
  CANCELLED: "Cancelled",
};

// Legacy tokens are accepted during migration (Standard 8 R6) so existing backlogs keep validating.
// Everything downstream sees the canonical form, and the generated tracker always emits canonical.
// Remove this map once the repositories this script serves have migrated.
const STATUS_ALIASES = {
  backlog: "NOT_STARTED",
  "not-started": "NOT_STARTED",
  ready: "READY",
  "in-progress": "IN_PROGRESS",
  blocked: "BLOCKED",
  "ready-for-review": "IN_REVIEW",
  "in-review": "IN_REVIEW",
  done: "COMPLETE",
  complete: "COMPLETE",
  deferred: "DEFERRED",
  dropped: "CANCELLED",
  declined: "CANCELLED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
};

/** Map a status to its canonical form. Unknown values pass through so validation can report them. */
function canonicalStatus(raw) {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  if (STATUSES.includes(trimmed)) return trimmed;
  return STATUS_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
/** Status marker. Deliberately not a traffic light — see the tone rules. */
const STATUS_MARK = {
  NOT_STARTED: "○",
  READY: "◔",
  IN_PROGRESS: "◑",
  BLOCKED: "◒",
  IN_REVIEW: "◕",
  COMPLETE: "●",
  DEFERRED: "◌",
  CANCELLED: "—",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Minimal frontmatter parser: `key: value`, plus `[a, b]` inline arrays,
 * `- item` block arrays, and block scalars (`>`, `>-`, `|`, `|-`). The schema
 * here is flat by design, so pulling in a YAML dependency for it would not earn
 * its keep — but block scalars had to be supported, because a `rationale` long
 * enough to be worth writing is long enough to want wrapping.
 */
function parseFrontmatter(raw, file) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: no YAML frontmatter block`);

  const data = {};
  let currentKey = null;
  const lines = match[1].split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      (data[currentKey] ||= []).push(unquote(listItem[1]));
      continue;
    }

    // Block scalar: consume the indented lines that follow. Folded (`>`) joins
    // them with spaces, literal (`|`) keeps the newlines.
    const block = line.match(/^([a-zA-Z][\w-]*):\s*([>|])([-+]?)\s*$/);
    if (block) {
      const [, key, style] = block;
      const collected = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === "" || /^\s+\S/.test(lines[i + 1]))) {
        collected.push(lines[++i].trim());
      }
      currentKey = key;
      data[key] = (style === ">" ? collected.join(" ") : collected.join("\n")).trim();
      continue;
    }

    const pair = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (!pair) throw new Error(`${file}: cannot parse frontmatter line: ${line}`);

    const [, key, rawValue] = pair;
    currentKey = key;
    const value = rawValue.trim();

    if (value === "") data[key] = [];
    else if (value.startsWith("[")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => unquote(v))
        .filter(Boolean);
    } else data[key] = unquote(value);
  }

  return { data, body: match[2].trim() };
}

const unquote = (v) => v.trim().replace(/^["']|["']$/g, "");

async function loadItems() {
  if (!existsSync(ITEMS_DIR)) {
    // A read-only mode must never write. A missing backlog is a reportable state, not
    // something to silently create underneath someone — and it is deliberately not the same
    // state as a backlog that exists and is empty, so --json reports it rather than emitting
    // an empty document that would read as "this project has no items".
    if (READ_ONLY) {
      console.error(`  ! No backlog found at ${rel(ITEMS_DIR)}`);
      process.exit(1);
    }
    await mkdir(ITEMS_DIR, { recursive: true });
    console.log(`Created ${rel(ITEMS_DIR)}. Add item files there, then run this again.`);
    process.exit(0);
  }
  const files = (await readdir(ITEMS_DIR)).filter((f) => f.endsWith(".md")).sort();
  const items = [];
  for (const file of files) {
    const raw = await readFile(path.join(ITEMS_DIR, file), "utf8");
    const { data, body } = parseFrontmatter(raw, file);
    // Normalize status once, here, so every rule and the tracker see canonical values.
    items.push({ ...data, status: canonicalStatus(data.status), file, body });
  }
  return items;
}

/** Every rule that must hold for the backlog to be trustworthy. */
function validate(items) {
  const errors = [];
  const byId = new Map();

  for (const item of items) {
    const where = `items/${item.file}`;

    for (const field of ["id", "type", "title", "status"]) {
      if (!item[field]) errors.push(`${where}: missing required field "${field}"`);
    }
    if (!item.id || !item.type || !item.status) continue;

    if (byId.has(item.id)) {
      errors.push(`${where}: duplicate id ${item.id} (also ${byId.get(item.id).file})`);
    }
    byId.set(item.id, item);

    const level = LEVEL_BY_TYPE.get(item.type);
    if (!level) {
      errors.push(`${where}: unknown type "${item.type}"`);
      continue;
    }

    // The id encodes the level, so a mistyped type cannot hide.
    const prefix = item.id.split("-")[0];
    if (prefix !== level.prefix) {
      errors.push(`${where}: id ${item.id} does not match type "${item.type}" (expected ${level.prefix}-…)`);
    }

    const expectedFile = `${item.id}.md`;
    if (item.file !== expectedFile) {
      errors.push(`${where}: filename should be ${expectedFile} to match its id`);
    }

    if (!STATUSES.includes(item.status)) {
      errors.push(`${where}: unknown status "${item.status}" (use one of ${STATUSES.join(", ")})`);
    }

    for (const [field, required] of [["opened", true], ["closed", item.status === "COMPLETE"]]) {
      const value = item[field];
      if (required && !value) errors.push(`${where}: "${field}" is required here`);
      if (value && !DATE_RE.test(value)) {
        errors.push(`${where}: "${field}" must be an absolute YYYY-MM-DD date, got "${value}"`);
      }
    }
    if (item.status !== "COMPLETE" && item.closed) {
      errors.push(`${where}: has a "closed" date but status is "${item.status}"`);
    }

    // Done work must point at what proves it — a PR, a commit, or a document.
    if (item.status === "COMPLETE" && level.depth >= LEVEL_BY_TYPE.get("story").depth) {
      if (!item.evidence || item.evidence.length === 0) {
        errors.push(`${where}: a COMPLETE ${item.type} needs at least one "evidence" entry`);
      }
    }
    if (item.status === "CANCELLED" && !item.rationale) {
      errors.push(`${where}: a CANCELLED item needs a "rationale" explaining the decision`);
    }
  }

  // Parent links: present, resolvable, and exactly one level up.
  for (const item of items) {
    const level = LEVEL_BY_TYPE.get(item.type);
    if (!level) continue;
    const where = `items/${item.file}`;

    if (level.depth === 0) {
      if (item.parent) errors.push(`${where}: a theme is the root and must not have a parent`);
      continue;
    }
    if (!item.parent) {
      errors.push(`${where}: ${item.type} requires a "parent"`);
      continue;
    }
    const parent = byId.get(item.parent);
    if (!parent) {
      errors.push(`${where}: parent ${item.parent} does not exist`);
      continue;
    }
    const parentLevel = LEVEL_BY_PREFIX.get(item.parent.split("-")[0]);
    if (!parentLevel || parentLevel.depth !== level.depth - 1) {
      errors.push(
        `${where}: parent must be a ${LEVELS[level.depth - 1].label.toLowerCase()}, got ${item.parent}`,
      );
    }
  }

  // A parent cannot be finished while its children are not.
  const childrenOf = groupChildren(items);
  for (const item of items) {
    if (item.status !== "COMPLETE") continue;
    const open = (childrenOf.get(item.id) ?? []).filter(
      (c) => c.status !== "COMPLETE" && c.status !== "CANCELLED",
    );
    if (open.length > 0) {
      errors.push(
        `items/${item.file}: marked COMPLETE but ${open.length} child item(s) are not: ${open
          .map((c) => c.id)
          .join(", ")}`,
      );
    }
  }

  return { errors, byId, childrenOf };
}

function groupChildren(items) {
  const map = new Map();
  for (const item of items) {
    if (!item.parent) continue;
    if (!map.has(item.parent)) map.set(item.parent, []);
    map.get(item.parent).push(item);
  }
  for (const list of map.values()) list.sort((a, b) => a.id.localeCompare(b.id));
  return map;
}

/**
 * Progress for an item, counting only its leaf descendants.
 *
 * Leaves are what actually get done; counting parents too would let a deep
 * branch inflate the number simply by being deep.
 */
function progressOf(item, childrenOf) {
  const leaves = [];
  const walk = (node) => {
    const kids = childrenOf.get(node.id) ?? [];
    if (kids.length === 0) leaves.push(node);
    else kids.forEach(walk);
  };
  walk(item);

  const counted = leaves.filter((l) => l.status !== "CANCELLED");
  const done = counted.filter((l) => l.status === "COMPLETE").length;
  return {
    done,
    total: counted.length,
    declined: leaves.length - counted.length,
    percent: counted.length === 0 ? 0 : Math.round((done / counted.length) * 100),
  };
}

const bar = (percent, width = 20) => {
  const filled = Math.round((percent / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

function renderTracker(items, childrenOf) {
  const themes = items.filter((i) => i.type === "theme").sort((a, b) => a.id.localeCompare(b.id));
  const overall = {
    done: 0,
    total: 0,
  };
  for (const theme of themes) {
    const p = progressOf(theme, childrenOf);
    overall.done += p.done;
    overall.total += p.total;
  }
  const overallPercent = overall.total === 0 ? 0 : Math.round((overall.done / overall.total) * 100);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const item of items) counts[item.status] = (counts[item.status] ?? 0) + 1;

  const lines = [];
  lines.push("# Backlog");
  lines.push("");
  lines.push(
    "<!-- GENERATED FILE - do not edit by hand. Re-run the backlog script after changing anything in items/. -->",
  );
  lines.push("");
  lines.push(
    "Work on this project classified with the Extended Agile Hierarchy. Every item is a file in",
  );
  lines.push(
    "[`items/`](./items/); its YAML frontmatter is the source of truth and this page is derived from it.",
  );
  lines.push("");
  lines.push(`**${overall.done} of ${overall.total} leaf items complete — ${overallPercent}%**`);
  lines.push("");
  lines.push("```");
  lines.push(`${bar(overallPercent, 40)}  ${overallPercent}%`);
  lines.push("```");
  lines.push("");

  // Status summary
  lines.push("## Status");
  lines.push("");
  lines.push("| Status | Items |");
  lines.push("| --- | ---: |");
  for (const s of STATUSES) {
    if (!counts[s]) continue;
    lines.push(`| ${STATUS_MARK[s]} ${STATUS_LABEL[s]} | ${counts[s]} |`);
  }
  lines.push(`| **Total** | **${items.length}** |`);
  lines.push("");

  // Level summary
  lines.push("## The hierarchy");
  lines.push("");
  lines.push("| Level | Prefix | Count | Answers |");
  lines.push("| --- | --- | ---: | --- |");
  const QUESTION = {
    theme: "Which enduring area of value is this?",
    initiative: "What outcome are we pursuing there?",
    epic: "What large body of work delivers it?",
    feature: "What shippable slice of that epic?",
    story: "What user-visible change, roughly one PR?",
    task: "What technical step inside a story?",
  };
  for (const level of LEVELS) {
    const count = items.filter((i) => i.type === level.type).length;
    lines.push(`| ${level.label} | \`${level.prefix}-\` | ${count} | ${QUESTION[level.type]} |`);
  }
  lines.push("");

  // Theme roll-up
  lines.push("## Progress by theme");
  lines.push("");
  lines.push("| Theme | Progress | Done | Remaining |");
  lines.push("| --- | --- | ---: | ---: |");
  for (const theme of themes) {
    const p = progressOf(theme, childrenOf);
    lines.push(
      `| [${theme.id} ${theme.title}](./items/${theme.file}) | \`${bar(p.percent, 14)}\` ${p.percent}% | ${p.done} | ${p.total - p.done} |`,
    );
  }
  lines.push("");

  // In flight / next up — the two questions a tracker gets opened for.
  const inFlight = items.filter((i) => i.status === "IN_PROGRESS" || i.status === "BLOCKED" || i.status === "IN_REVIEW");
  const nextUp = items.filter((i) => i.status === "READY");

  lines.push("## In flight");
  lines.push("");
  if (inFlight.length === 0) lines.push("_Nothing in progress._");
  else {
    for (const i of inFlight) {
      lines.push(`- ${STATUS_MARK[i.status]} [${i.id}](./items/${i.file}) — ${i.title}`);
    }
  }
  lines.push("");

  lines.push("## Ready to pick up");
  lines.push("");
  if (nextUp.length === 0) lines.push("_Nothing marked ready._");
  else {
    for (const i of nextUp) {
      lines.push(`- ${STATUS_MARK[i.status]} [${i.id}](./items/${i.file}) — ${i.title}`);
    }
  }
  lines.push("");

  // Full tree
  lines.push("## Everything");
  lines.push("");
  const renderNode = (item, depth) => {
    const indent = "  ".repeat(depth);
    const p = progressOf(item, childrenOf);
    const kids = childrenOf.get(item.id) ?? [];
    const suffix = kids.length > 0 ? ` _(${p.done}/${p.total})_` : "";
    lines.push(
      `${indent}- ${STATUS_MARK[item.status]} **[${item.id}](./items/${item.file})** ${item.title}${suffix}`,
    );
    kids.forEach((k) => renderNode(k, depth + 1));
  };
  themes.forEach((t) => renderNode(t, 0));
  lines.push("");

  const declined = items.filter((i) => i.status === "CANCELLED");
  if (declined.length > 0) {
    lines.push("## Decided against");
    lines.push("");
    lines.push("Kept rather than deleted: the reasoning is the useful part.");
    lines.push("");
    for (const i of declined) {
      lines.push(`- [${i.id}](./items/${i.file}) — ${i.title}. ${i.rationale}`);
    }
    lines.push("");
  }

  return lines.join("\n") + "\n";
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

/** Versions the envelope and its field set — not the status tokens, which are not ours to version. */
const SCHEMA_VERSION = "1.0.0";

/**
 * The stable identifier of the lifecycle vocabulary, and only that. If EngineeringStandards ever
 * gives it an explicit version, that belongs in a separate field added compatibly; inventing one
 * here would assert a fact about another repository that nobody has established.
 */
const STATUS_VOCABULARY = "engineering-standards-standard-8";

/**
 * The interchange contract: what another system may consume without re-parsing this markdown.
 *
 * Deliberately narrower than the frontmatter. `tags`, `depends_on` and `blocked_by` all parse,
 * and no rule anywhere in this file reads any of them — publishing them would promote an
 * unenforced convention into a contract a consumer could build relationships on. `evidence` is
 * excluded for a different reason: it is free text, and a consumer assembling a provenance graph
 * would be invited to treat a markdown string as deterministic evidence.
 *
 * Everything omitted is still authoritative in the item file. This is an index, not a
 * replacement.
 *
 * No timestamp and no counts, so the document is a pure function of the backlog and two runs over
 * an unchanged tree are byte-identical.
 */
function renderJson(items) {
  const byId = [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      statusVocabulary: STATUS_VOCABULARY,
      items: byId.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title ?? null,
        status: i.status,
        // Explicitly null for a theme rather than absent: a key that sometimes disappears makes
        // every consumer write a presence check.
        parent: i.parent ?? null,
        // Repo-relative and POSIX-formed. `item.file` is only a basename, and an absolute path
        // would encode the emitting machine, so the same tree would emit different documents on
        // Windows and in a Linux container.
        file: rel(path.join(ITEMS_DIR, i.file)),
      })),
    },
    null,
    2,
  );
}

// --- run ---------------------------------------------------------------

warnIfCopiesDiffer();

const items = await loadItems();
if (items.length === 0) {
  // A backlog directory that exists and holds nothing is a valid project state, so under --json
  // it is a valid document. Prose on stdout would corrupt the contract for whoever is parsing it.
  if (JSON_MODE) {
    console.log(renderJson(items));
    process.exit(0);
  }
  console.log(`No backlog items in ${rel(ITEMS_DIR)}.`);
  process.exit(0);
}

const { errors, childrenOf } = validate(items);
if (errors.length > 0) {
  for (const e of errors) console.error(`  ! ${e}`);
  console.error(`\n${errors.length} backlog problem(s).`);
  process.exit(1);
}

if (JSON_MODE) {
  // Emit before anything below runs. The tracker comparison reads a generated artifact and the
  // default path rewrites it, so a query would mutate the tree. Staleness of that artifact is
  // deliberately *not* a JSON failure: the frontmatter is the authority here, and no consumer
  // should be locked out of canonical backlog state because a derived document is behind.
  console.log(renderJson(items));
  process.exit(0);
}

const tracker = renderTracker(items, childrenOf);

/**
 * Compare with line endings normalised. Git's autocrlf rewrites the checked-out
 * file on Windows, so a byte comparison would pass on Linux CI and fail on a
 * Windows clone of the same commit.
 */
const normalize = (s) => s.replace(/\r\n/g, "\n");
const existing = existsSync(TRACKER) ? await readFile(TRACKER, "utf8") : null;
const upToDate = existing !== null && normalize(existing) === normalize(tracker);

if (CHECK_ONLY) {
  if (!upToDate) {
    console.error(
      `  ! ${rel(TRACKER)} is out of date. Re-run this script without --check to regenerate it.`,
    );
    process.exit(1);
  }
  console.log(`Backlog valid — ${items.length} items, tracker up to date.`);
  process.exit(0);
}

if (upToDate) {
  console.log(`Backlog valid — ${items.length} items, tracker already up to date.`);
} else {
  await writeFile(TRACKER, tracker, "utf8");
  console.log(`Backlog valid — ${items.length} items. Rewrote ${rel(TRACKER)}.`);
}
