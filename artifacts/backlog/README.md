# This backlog now lives in GitHub Issues

The item files that were here were migrated into GitHub Issues on 2026-09-19 and removed. Issues are
now the only home for this repository's work items; nothing here is maintained.

- **The work:** https://github.com/mikeycdavis/HealthAndFitnessAndNutritionStandards/issues
- **The mapping:** [`github-mapping.json`](./github-mapping.json) records every legacy item id
  against the issue number and id it became, so `ST-01` and friends still resolve.

## Reading it

| The old way | Now |
| --- | --- |
| `status:` frontmatter | The issue's open/closed state, plus a `status:` label |
| `parent:` frontmatter | A GitHub sub-issue link |
| `type:` frontmatter | A `level:` label |
| `evidence:` frontmatter | Links in the issue body, and `Closes #N` from a pull request |
| The generated tracker | GitHub's own issue views |

**An open issue does not mean actionable.** `BLOCKED`, `DEFERRED` and `IN_REVIEW` are all open, so
the `status:` label is what separates open work from executable work.

The full contract is in the ClaudeSkills repository, as `GITHUB-SCHEMA.md`.

## Entry points, and one to avoid

- **Supported:** `npm run backlog` and `npm run backlog:check`. Both refuse to create or check a file backlog here and say where the issues are.
- **Do not run `node scripts/backlog.mjs` directly.** That file is certified release material and still predates the GitHub-authority guard, so run bare it would create an empty `artifacts/backlog/items/` and restore a second source of truth. The `npm` entry points route around it. Closing this properly needs a scoped release that re-certifies a guarded copy of the script.
- To read or change work items, use the issues, or the `backlog-validate` skill's `backlog-gh.mjs` commands.
