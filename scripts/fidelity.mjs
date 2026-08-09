#!/usr/bin/env node
/**
 * Verify that everything claiming to be source text actually is source text.
 *
 * WHY THIS EXISTS. A document that says "reproduced verbatim from the source" is making a
 * falsifiable claim, and nothing falsifies it. In a comparable system, quoted source text was twice
 * rendered with formatting added — backticks around an identifier, a changed dash — while the
 * document still claimed it was verbatim. Both were caught by a human who happened to look. Twice is
 * a failure mode rather than a mistake, so this makes it mechanical.
 *
 * In this repository the stakes are higher than formatting. The 34 prohibitions are the reason the
 * pack exists, and every one of them is a sentence. "Never recommend crash dieting" and "Avoid
 * recommending crash dieting where practical" are different rules, and the second one is what the
 * first becomes if nothing is watching. Rewording a prohibition to make it satisfiable is precisely
 * the manipulation Standard 42 forbids (ADR 0003), so this guard checks two things:
 *
 *   1. STANDARDS. Any block preceded by an explicit verbatim claim must appear in the specification.
 *      Authored prose makes no such claim and is not checked — the point is to hold a document to
 *      its own word, not to forbid original writing.
 *
 *   2. THE CATALOG. Every rule of kind `prohibition` must carry the source's own line in its
 *      `description`. The convention is `Never <source bullet>`, so the check strips a leading
 *      "Never" and asserts the remainder appears in the specification verbatim. This means the
 *      wording of a prohibition cannot be softened in the one place a machine reads it.
 *
 * NORMALIZATION. Line wrapping differs between a document and its source, so both sides collapse to
 * single-spaced text before comparison. Backticks, punctuation, and wording are NOT normalized away
 * — those are exactly what this exists to catch.
 *
 * The source path is read from `artifacts/standards-source-inventory.json` rather than hard-coded,
 * so this guard and the inventory guard cannot disagree about which document is the source.
 *
 * Usage:
 *   node scripts/fidelity.mjs           report, exit 1 on any unverified claim
 *   node scripts/fidelity.mjs --json    machine-readable
 *
 * Exit: 0 clean · 1 an unverified claim was found · 2 could not evaluate.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A sentence asserting that what follows is source text. */
const CLAIM_RE =
  /reproduced\s+(?:verbatim\s+)?from\s+the\s+source|verbatim\s+from\s+the\s+source|from\s+the\s+source[,:]?\s*$|^From the source[,:]/i;

export const normalize = (s) =>
  s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/^\s*>\s?/, "").replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Collect the block immediately following a claim: a fenced block, a blockquote run, or a bullet
 * list. Prose paragraphs are skipped — a claim followed by explanation rather than a quotation is
 * not making a checkable assertion about a specific block.
 */
export function blockAfter(lines, start) {
  let i = start;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i >= lines.length) return null;

  if (lines[i].trim().startsWith("```")) {
    const body = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith("```")) body.push(lines[i++]);
    return { kind: "fence", text: body.join("\n"), line: start + 1 };
  }
  if (lines[i].trim().startsWith(">")) {
    const body = [];
    while (i < lines.length && (lines[i].trim().startsWith(">") || lines[i].trim() === "")) {
      if (lines[i].trim() === "" && !(lines[i + 1] ?? "").trim().startsWith(">")) break;
      body.push(lines[i++]);
    }
    return { kind: "quote", text: body.join("\n"), line: start + 1 };
  }
  if (/^\s*[-*]\s+/.test(lines[i])) {
    const body = [];
    while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) body.push(lines[i++]);
    return { kind: "list", text: body.join("\n"), line: start + 1 };
  }
  return null;
}

/** Point at the actual edit: the longest leading fragment that IS in the source, then what follows. */
function divergence(norm, sourceNorm) {
  const words = norm.split(" ");
  let longest = "";
  for (let a = 0; a < words.length; a++) {
    for (let b = words.length; b > a; b--) {
      const frag = words.slice(a, b).join(" ");
      if (frag.length > longest.length && sourceNorm.includes(frag)) longest = frag;
    }
  }
  const cut = longest ? norm.indexOf(longest) + longest.length : 0;
  return norm.slice(cut, cut + 120).trim() || norm.slice(0, 120);
}

/**
 * Pure. `documents` is `[{ path, text }]` for the standards; `rules` is the flattened catalog
 * entries (may be empty before the catalog exists).
 */
export function analyse({ sourceText, documents, rules }) {
  const sourceNorm = normalize(sourceText);
  const failures = [];
  let claims = 0;

  for (const doc of documents) {
    const lines = doc.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!CLAIM_RE.test(lines[i])) continue;
      const block = blockAfter(lines, i + 1);
      if (!block) continue;
      claims++;
      const norm = normalize(block.text);
      if (!norm || sourceNorm.includes(norm)) continue;
      failures.push({
        where: `${doc.path}:${block.line}`,
        kind: block.kind,
        claimed: norm.slice(0, 160),
        diverges: divergence(norm, sourceNorm),
      });
    }
  }

  let prohibitions = 0;
  for (const rule of rules) {
    if (rule.kind !== "prohibition") continue;
    prohibitions++;
    claims++;
    // Convention: `Never <source bullet>`. Strip the lead-in and require the rest verbatim.
    const quoted = normalize(String(rule.description ?? "").replace(/^\s*never\s*/i, ""));
    if (quoted && sourceNorm.includes(quoted)) continue;
    failures.push({
      where: `rules · ${rule.id}`,
      kind: "prohibition-description",
      claimed: quoted.slice(0, 160),
      diverges: divergence(quoted, sourceNorm),
    });
  }

  return { claims, prohibitions, failures, ok: failures.length === 0 };
}

export function render(r) {
  const out = [
    `Verbatim claims checked:   ${r.claims}`,
    `Prohibitions checked:      ${r.prohibitions}`,
    `Unverified claims:         ${r.failures.length}`,
    "",
  ];
  for (const f of r.failures) {
    out.push(`! ${f.where} (${f.kind})`);
    out.push(`    claimed verbatim: ${f.claimed}${f.claimed.length >= 160 ? "..." : ""}`);
    out.push(`    diverges at:      ${f.diverges}`);
    out.push("");
  }
  if (r.failures.length > 0) {
    out.push("Something claimed as source text does not appear in the source. The usual cause is");
    out.push("formatting added to a quotation — backticks around an identifier, a changed dash, a");
    out.push("reworded line. Reproduce the source exactly, or drop the verbatim claim.");
    out.push("");
    out.push("If the divergence is in a prohibition's description, treat it as an integrity question");
    out.push("before treating it as a typo: a reworded prohibition is a different rule (Standard 42).");
  } else {
    out.push("Everything claimed as source text appears in the source.");
  }
  return out.join("\n") + "\n";
}

async function main() {
  const jsonOut = process.argv.includes("--json");
  const fail = (message) => {
    process.stderr.write(`fidelity: ${message}\n`);
    process.exit(2);
  };

  let inventory;
  try {
    inventory = JSON.parse(await readFile(path.join(ROOT, "artifacts/standards-source-inventory.json"), "utf8"));
  } catch (err) {
    fail(`cannot read the inventory to locate the source: ${err.message}`);
  }
  const sourcePath = path.join(ROOT, inventory.source);
  if (!existsSync(sourcePath)) fail(`source not found: ${inventory.source}`);

  const standardsDir = path.join(ROOT, "standards");
  const documents = [];
  if (existsSync(standardsDir)) {
    for (const f of (await readdir(standardsDir)).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()) {
      documents.push({ path: `standards/${f}`, text: await readFile(path.join(standardsDir, f), "utf8") });
    }
  }

  const rulesDir = path.join(ROOT, "rules");
  const rules = [];
  if (existsSync(rulesDir)) {
    for (const f of (await readdir(rulesDir)).filter((f) => f.endsWith(".json")).sort()) {
      const parsed = JSON.parse(await readFile(path.join(rulesDir, f), "utf8"));
      rules.push(...(parsed.rules ?? []));
    }
  }

  const report = analyse({ sourceText: await readFile(sourcePath, "utf8"), documents, rules });
  process.stdout.write(jsonOut ? JSON.stringify(report, null, 2) + "\n" : render(report));
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
