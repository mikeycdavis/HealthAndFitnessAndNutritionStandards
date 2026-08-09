# 0002 — Prohibitions are a first-class rule kind

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project-owner

## Context

The design brief states the principle without hedging:

> "Must never be done" rules are first-class standards. They must not be buried in documentation.

The domain content specification supplies 34 of them: 13 health, 11 fitness, 10 nutrition. They are
not a footnote to the requirements — they outnumber the requirements and recommendations combined.

A comparable system in a different domain encoded prohibition as a boolean flag on a requirement
(`nonExemptible: true`), which was proportionate there: two of its twenty-four rules carried it. That
shape does not fit a catalog where prohibitions are the majority. A boolean also says only what
cannot be done *to* the rule (waive it), not what the rule *is*.

There is a second problem a flag cannot solve. "Must not be buried in documentation" is a claim about
visibility, and visibility is not a property of a field value. If the only place a prohibition
appears is a JSON object among sixty others, it is buried in data rather than in prose, which is not
an improvement.

## Decision

`kind` is a first-class catalog field with four values: `requirement`, `recommendation`,
`prohibition`, `invariant`. It replaces the borrowed `level` plus `nonExemptible` pair.

Prohibitions:

- are always `severity: "error"` — enforced by the catalog loader, not by convention;
- are never exemptible. An exception naming a prohibition is not recorded and not quietly dropped:
  it produces `BLOCKED_BY_INVARIANT` and exit code 3 (ADR 0003);
- **may** be declared not-applicable. That is a different claim — a nutrition-only tool has no
  subject for a fitness prohibition — and it requires a reason and a `revisitWhen` trigger like any
  other applicability declaration;
- are `validationType: "manual-review"`, `assurance: "none"` in this release. Nothing mechanical
  establishes that guidance never moralises food. Saying otherwise would be the false green this
  system exists to prevent.

Visibility is satisfied by three surfaces, each independently checkable:

1. **The catalog** — `kind: "prohibition"`, machine-readable, with the source's "Never …" line
   reproduced verbatim as the rule's `description`.
2. **`PROHIBITIONS.md`** at the repository root — a hand-written index of all 34 prohibitions and the
   integrity invariant, grouped by domain, each with its id, its verbatim source line, and a link to
   its parent standard.
3. **A `## Prohibitions` section** in each standard that owns one, where the source line is quoted
   under a verbatim claim that `scripts/fidelity.mjs` checks.

`PROHIBITIONS.md` is **checked, not generated**. A test asserts it lists exactly the catalog's
prohibitions with matching ids and matching verbatim descriptions.

## Alternatives considered

**Keep the boolean flag.** Rejected: it describes a permission on the rule rather than the rule's
nature, forces every prohibition to masquerade as a requirement, and gives the loader nothing to
enforce severity against.

**Give each must-never list its own standard document** ("Standard 43 — Health Prohibitions").
Rejected. Each would be ten to thirteen unrelated requirements sharing a heading, and it would break
the one-standard-per-source-topic traceability that the inventory guard depends on. Prohibitions
belong beside the topic they protect — the prohibition against treating a single reading as a trend
belongs in the Trends standard.

**Generate `PROHIBITIONS.md` from the catalog.** Rejected, and this is the more interesting
rejection. A generated index is only as trustworthy as the last time someone ran the generator, and a
stale generated file looks exactly like a current one. A hand-written file with a test that fails
when it disagrees with the catalog has the opposite failure mode: it breaks loudly. It also means the
index cannot be silently emptied by a change to the generator.

**Use `level: "forbidden"` from the borrowed vocabulary.** Rejected: `level` describes the strength at
which a *project adopts* a rule. "This project adopts the no-crash-dieting rule at forbidden
strength" is a double negative that no reader parses correctly on the first pass.

## Consequences

- The catalog loader enforces two invariants it could not enforce before: prohibitions and invariants
  are `error` severity, and neither may claim better than `none` assurance while it remains
  `manual-review`.
- Per-domain prohibition counts (13 / 11 / 10) become a testable property, because category follows
  the source section. That property is what makes a silently dropped prohibition detectable — see
  ADR 0003.
- Adopting projects gain a real mechanism for honest partial scope: a nutrition-only project declares
  the fitness prohibitions not-applicable with reasons, rather than pretending to satisfy them.
