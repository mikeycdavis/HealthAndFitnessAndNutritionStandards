# 0001 — Canonical rule identity

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project-owner

## Context

Every rule in this repository is referenced from at least four places: the catalog that defines it,
the policy file where a project declares its applicability or waives it, the evaluator output that
reports its state, and the standards prose that explains it. If those places can spell the same rule
differently, they are not referring to the same rule — they are referring to four things that
usually coincide.

A comparable system decided this late. Its source specification used one spelling convention and its
catalog another; both got written, and reconciling them cost an architecture decision record and a
permanent alias-resolution mechanism that every reader since has had to understand. The cost was not
the rename. The cost was that "which spelling is real" became a question the system had to keep
answering.

This decision is therefore taken before any rule exists.

## Decision

A rule id is `category.kebab-case-name`: dot-separated, lower-case throughout, matching

```text
^[a-z][a-z0-9]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$
```

The pattern appears in three places and is enforced in all of them: the catalog loader
(`scripts/catalog.mjs`), the policy schema's `propertyNames` (`schemas/project-policy.schema.json`),
and Standard 42, which governs the integrity of the standards system.

One id, one rule, everywhere. There is no separate namespace for policy keys, output keys, or
document anchors — the id in the catalog is the id a project writes in its policy and the id the
evaluator prints.

Lifecycle rules:

1. A retired id is never reused for a different meaning.
2. Renaming a rule's title does not change its id.
3. Moving a rule between documents does not change its id.
4. A material semantic change requires a new id. The test for "material" is whether an existing
   exception written against the rule would still mean what its author intended.
5. `aliases` is present on every rule from the first release, empty by default. An alias is a
   one-directional legacy spelling: accepted on read with a warning, resolved to canonical, never
   emitted.
6. `deprecatedIn`, `supersededBy`, and `removedIn` are present on every rule from the first release,
   `null` where they do not apply, so a rule never has to gain fields to be retired.

## Alternatives considered

**camelCase ids.** Rejected. Nothing recommends it here, and the mixed-case boundary is exactly
where two authors' spellings diverge.

**Ids derived from the standard number (`std-14.r2`).** Rejected. It couples identity to position in
the series, so moving a requirement between standards would rename it — violating lifecycle rule 3
and invalidating every exception written against it.

**Free-form ids validated only by uniqueness.** Rejected. Uniqueness makes collisions impossible but
does nothing about a policy file that misspells a rule; without a pattern, a typo becomes a new rule
rather than an error.

**Accepting both spellings and normalising.** Rejected — this is precisely the outcome observed
elsewhere. Once both spellings work, both get written.

## Consequences

- A policy that misspells a rule id fails schema validation with a message pointing at the key,
  rather than being silently treated as a declaration about a rule that does not exist.
- The alias mechanism exists but is unused in 1.0.0. It is present so that a future rename does not
  require a schema change under time pressure.
- Standard 42 can state the identity rule normatively, because the pattern that enforces it is the
  same string the code uses.
