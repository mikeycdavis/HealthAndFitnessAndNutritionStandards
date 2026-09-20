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

- **All four entry points are guarded from v1.1.1**: `npm run backlog`, `npm run backlog:check`, and `node scripts/backlog.mjs` run bare, with `--check` or with `--json`. In a repository whose `github-mapping.json` says `authority: "github"` each exits 1, says where the issues are, and creates nothing. File-backed repositories are unchanged.
- **A copy older than v1.1.1 is not guarded** when run directly: `scripts/backlog.mjs` is certified release material and only the v1.1.1 release carries the guard. `npm run backlog` is guarded by `ci/backlog-write.mjs` on either. Check `VERSION` before running the script by hand from an older checkout.
- To read or change work items, use the issues, or the `backlog-validate` skill's `backlog-gh.mjs` commands.
