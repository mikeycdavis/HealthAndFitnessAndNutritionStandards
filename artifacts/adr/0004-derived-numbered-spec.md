# 0004 — A derived numbered specification, with the sources preserved verbatim

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project-owner

## Context

Two source documents govern this repository: `artifacts/prompts/original-prompt.md` (what the
standards must cover) and `artifacts/prompts/design-brief.md` (what kind of system this must be).

The inventory guard needs a numbered series to extract: it re-derives "which standards exist and what
they are called" from a source document and compares that against a human-reviewed enumeration, which
is what makes "did I cover everything" mechanical rather than a memory exercise. The fidelity guard
needs a stable document to check verbatim quotations against.

Neither source is numbered. `original-prompt.md` is organised as bulleted "Cover:" lists under three
domain headings, plus three must-never lists, a trend-over-event section, and a safety and escalation
section. Two of its bullets are the bare word "hydration" — one in the fitness list, one in the
nutrition list — which are different topics with identical text.

The obvious move is to edit the prompt into numbered form. That destroys the thing the guards exist
to protect: once the source is edited, "the standards match the source" is a statement about a
document that was adjusted to make it true.

## Decision

Keep both sources byte-verbatim, forever. Derive a third document.

`artifacts/prompts/health-fitness-nutrition-standards-spec.md` opens with an HTML provenance comment
declaring, in the document itself:

1. it is derived from `original-prompt.md` and `design-brief.md`, which are the higher-fidelity
   copies and win any disagreement;
2. every "Cover:" bullet is promoted to a bare `N. Title` line, title-cased, order preserved within
   each section;
3. items 1–3 are **hoisted** from the prompt's cross-cutting sections — the wellness-versus-medical
   sentence, the trend-over-event principle, and the safety and escalation section — which appear
   after the domain bullets in the prompt but are the foundations every other standard depends on.
   The hoist is documented rather than silent;
4. the two `hydration` bullets are disambiguated as `Hydration (Fitness)` and `Hydration
   (Nutrition)`;
5. item 42, Standards Integrity, is sourced from the design brief's integrity-invariant blockquote.

The three must-never lists, the trend-over-event blockquote, and the integrity-invariant paragraph are
carried into the derived spec **byte-verbatim and unnumbered**. Unnumbered is not incidental:
must-never lines are prohibitions, which are rules rather than standards, and numbering them would put
34 spurious entries into the extracted series and corrupt the inventory comparison.

`scripts/fidelity.mjs` reads its source path from the inventory file's `source` field rather than
hard-coding it, so the inventory guard and the fidelity guard cannot disagree about which document is
the source.

## Alternatives considered

**Number the original prompt in place.** Rejected: it makes the source mutable, and a source that can
be adjusted to match the standards guarantees agreement while proving nothing.

**Extract the enumeration from the prompt's bullets directly, with a bullet-aware parser.** Rejected.
It requires a more permissive extractor — one that must decide which bullets are topics and which are
prohibitions — and the ambiguity would live in code where nobody reviews it. Worse, the two identical
`hydration` bullets have no in-band disambiguation, so the parser would have to invent one.

**Skip the numbered series; identify standards by slug.** Rejected: the guard's value is detecting a
*gap*, and gaps are only visible in a contiguous ordered series. A comparable system silently skipped
one of its standards and found out much later, which is why the guard exists at all.

**Treat the derived spec as the only source.** Rejected: then nothing checks the derivation, and the
hoist and the hydration disambiguation become invisible editorial decisions.

## Consequences

- Three documents in `artifacts/prompts/`, with an explicit precedence order stated in each derived
  artifact's header. Readers must know which is authoritative; the provenance comment tells them.
- The derived spec is itself a reviewed artifact. If a bullet is mis-promoted, the inventory guard
  will not catch it — the guard compares extraction against the reviewed enumeration, and both would
  be wrong together. The defence is that the derivation is small, mechanical, and reviewable side by
  side with the original.
- Standards cite `Source: item N of …` against the derived spec, and every verbatim quotation is
  checked against it, so a prohibition cannot be softened by rewording the text a standard quotes.
