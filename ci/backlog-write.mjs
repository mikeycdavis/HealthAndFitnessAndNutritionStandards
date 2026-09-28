/**
 * `npm run backlog` entry point: refuse to write a file backlog into a repository whose backlog
 * lives in GitHub Issues, otherwise run scripts/backlog.mjs unchanged.
 *
 * WHY THIS IS A WRAPPER AND NOT A CHANGE TO scripts/backlog.mjs. `scripts/` is inside the certified
 * release material (scripts/release-material.mjs, MATERIAL), so editing the generator, or adding a
 * file beside it, changes bytes a released version is verified against. This file lives in `ci/`,
 * which is outside that boundary, so the guard ships without a release.
 *
 * scripts/backlog.mjs now carries the same refusal itself, so running it directly is guarded too; this wrapper
 * remains as the earlier, identical check at the npm entry point.
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACK = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

// Same root discovery and candidate order as scripts/backlog.mjs.
function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ".git")) || existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}
const ROOT = findRoot(process.cwd());
const dirArg = args.find((a) => a.startsWith("--dir="))?.slice("--dir=".length);
const dirs = dirArg ? [path.resolve(ROOT, dirArg)] : ["artifacts/backlog", "docs/backlog", "backlog"].map((c) => path.resolve(ROOT, c));

// Three cases, not one — kept identical to the check scripts/backlog.mjs runs itself, so this
// pre-check and that later one can never disagree about what "identical" means. See the longer
// comment there for why "unswitched" (a migration recorded, authority not yet "github", items gone)
// is dangerous rather than merely stale: it reads exactly like an empty new project.
function refuseMoved(file, why) {
  const mapping = JSON.parse(readFileSync(file, "utf8"));
  const repo = mapping.target ?? mapping.source ?? "<owner/name>";
  console.error(`  ! ${why}`);
  console.error(`    Read it at https://github.com/${repo}/issues, or with: gh issue list --repo ${repo}`);
  console.error("    Refusing to run the file generator: it would restore a second source of truth.");
  process.exit(1);
}

for (const dir of dirs) {
  const file = path.join(dir, "github-mapping.json");
  if (!existsSync(file)) continue;
  let mapping;
  try { mapping = JSON.parse(readFileSync(file, "utf8")); } catch { continue; } // unreadable is not an authority claim
  const hasItems = existsSync(path.join(dir, "items"));
  const authority = mapping.authority ?? "files";
  const migrated = Object.keys(mapping.items ?? {}).length > 0;

  if (authority === "github" && hasItems) {
    refuseMoved(file, `CONFLICT: ${path.relative(ROOT, file)} says GitHub is authoritative, but item files are present too.`);
  }
  if (authority === "github") {
    refuseMoved(file, `This backlog is in GitHub Issues (${path.relative(ROOT, file)} says authority "github"), not in files.`);
  }
  if (migrated && !hasItems) {
    refuseMoved(
      file,
      `${path.relative(ROOT, file)} records a migration (${Object.keys(mapping.items).length} item(s)) ` +
        'but never recorded authority "github", and the item files are gone. The switch was not finished.',
    );
  }
}

const r = spawnSync(process.execPath, [path.join(PACK, "scripts", "backlog.mjs"), ...args], { stdio: "inherit" });
process.exit(r.status ?? 1);
