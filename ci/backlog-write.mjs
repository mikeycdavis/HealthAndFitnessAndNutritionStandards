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

for (const dir of dirs) {
  const file = path.join(dir, "github-mapping.json");
  if (!existsSync(file)) continue;
  let mapping;
  try { mapping = JSON.parse(readFileSync(file, "utf8")); } catch { continue; } // unreadable is not an authority claim
  if (mapping.authority === "github") {
    const repo = mapping.target ?? mapping.source ?? "<owner/name>";
    console.error(`  ! This backlog is in GitHub Issues (${path.relative(ROOT, file)} says authority "github"), not in files.`);
    console.error(`    Read it at https://github.com/${repo}/issues, or with: gh issue list --repo ${repo}`);
    console.error(`    Refusing to run the file generator: it would create artifacts/backlog/items/ and restore a second source of truth.`);
    process.exit(1);
  }
}

const r = spawnSync(process.execPath, [path.join(PACK, "scripts", "backlog.mjs"), ...args], { stdio: "inherit" });
process.exit(r.status ?? 1);
