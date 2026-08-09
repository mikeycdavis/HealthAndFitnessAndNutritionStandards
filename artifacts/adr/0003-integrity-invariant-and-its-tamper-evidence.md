# 0003 — The integrity invariant and its tamper evidence

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** project-owner

## Context

The design brief asks for a global rule:

> A human or AI must never bypass, weaken, remove, reclassify, reinterpret, falsify evidence for, or
> manipulate a standard, test, applicability determination, evidence requirement, or verification
> mechanism solely because it prevents the desired implementation or conclusion.

and then asks the harder question: *"Determine how this invariant can itself be protected and
tested."*

A rule that only exists as prose is protected by nobody. The failure mode is specific and worth
naming: an agent — human or AI — is trying to reach a conclusion, a standard is in the way, and the
cheapest path is to adjust the standard. Every step of that path is individually defensible. The rule
"didn't really apply here". The severity "was too high". The attestation "reflects a review that
happened". Nothing in a document stops any of it, because the document is what is being edited.

The invariant is also unusual in what it binds. Every other rule in this repository is about an
adopting project's guidance behaviour. This one binds the maintainers of this repository as much as
it binds any adopter.

## Decision

**The invariant is a catalog rule.** `integrity.no-standards-manipulation`, `kind: "invariant"`,
Standard 42, severity `error`, `validationType: "manual-review"`, `assurance: "none"`. Its
`description` reproduces the brief's paragraph verbatim, so `scripts/fidelity.mjs` checks the wording
against the committed source.

**It cannot be neutralised through the ordinary mechanisms.** Specifically, and each is tested:

- `attestable: false` — the invariant is the one rule where attestation is refused outright.
  Attesting "a human reviewed this and we are not manipulating standards" is self-certification of
  exactly the thing under suspicion.
- It may never be declared not-applicable. "This project is exempt from integrity" is not a scope
  claim.
- It may never be excepted. Neither may any prohibition.

**Manipulation produces a distinct outcome, not a failed rule.** A new verdict,
`BLOCKED_BY_INVARIANT`, and a distinct exit code, `3`. It fires when:

1. an exception names a prohibition or the invariant;
2. a policy entry attempts to change the kind or strength of a prohibition or the invariant;
3. an attestation contradicts an automated finding;
4. an attestation's `reviewedAgainst` digest is presented as current but does not match the files;
5. the invariant is declared not-applicable or attested.

When it fires, evaluation stops and no other rule is reported. This is deliberate: a partially
evaluated run alongside evidence of tampering invites the reader to salvage the parts that look fine.
There is no score to partially satisfy and no verdict to negotiate. For an AI operator this is the
mechanical form of the brief's "refuse or stop work that would violate an invariant".

**A false not-applicable declaration is manipulation, not scope.** Prohibitions may be declared
not-applicable (ADR 0002) but never excepted, which leaves one escape hatch: declaring a prohibition
out of scope in order to avoid satisfying it. The two claims are distinguished by what the reason
must establish — an exception says "the rule applies, but we are permitted not to satisfy it"; a
not-applicable says "the prohibited behavior cannot occur within the evaluated scope." A reason that
asserts the behaviour is desired, tolerated, or requested by users is a waiver wearing a scope
claim's clothing, and falls under this invariant's "reclassify" and "reinterpret". Standard 42 states
the rule; `docs/design/architecture.md` §4.1 and the adoption guide carry the worked example
(`nutrition.no-crash-dieting` is legitimately not-applicable to a recipe-search application, and is
an integrity violation when a weight-loss coaching application declares it out of scope "because some
users want rapid weight loss"). No new rule was added for this — it is the semantics of applicability
under an invariant that already covers it.

**Tamper evidence for the catalog itself.** `artifacts/rule-inventory.json` is a committed,
human-reviewed enumeration: every rule id with its kind and severity, plus expected counts (13 health
/ 11 fitness / 10 nutrition prohibitions, 1 invariant). `scripts/rules.mjs` loads the catalog, derives
the same enumeration, and compares against the reviewed file. A missing id, an unknown id, a changed
kind, a changed severity, or a changed count exits 1.

The file is never regenerated from a run. That is the whole mechanism: deleting a prohibition or
downgrading it to a recommendation cannot pass CI unless the reviewed inventory is edited in the same
change — and that edit is a visible line in a diff, in a file whose stated purpose is to prevent
exactly this. The guard does not make manipulation impossible. It makes it *loud*.

**Mutation tests.** Every guard is tested by reintroducing the defect it exists to catch: drop a
prohibition from a scratch catalog and assert `rules.mjs` fails; skip a standard number and assert
`inventory.mjs` fails; paraphrase a verbatim quote and assert `fidelity.mjs` fails. A guard that has
never been observed failing is a guard nobody knows works — a comparable system shipped a freshness
checker that compared only first lines and therefore reported clean on the exact edit it existed to
catch.

## Alternatives considered

**Prose only, in a standard.** Rejected — it is the failure mode described above.

**Cryptographically sign the catalog.** Rejected for this release. Signing raises the cost of
tampering for someone without commit access, but everyone who can edit the catalog can also re-sign
it; it would add key management and an install-time dependency in exchange for protection against a
threat model (an outsider editing files) that git already addresses better.

**Treat manipulation as an ordinary rule failure.** Rejected. `NON_COMPLIANT` invites remediation of
the failing rule. The correct response to a forged attestation is not to fix the rule it covers — it
is to stop, because the evaluation's inputs are no longer trustworthy. A different verdict and a
different exit code are what make that distinction actionable in CI.

**Let the invariant be attestable, like every other manual-review rule.** Rejected — see above; it is
self-certification.

## Consequences

- Exit code 3 must be handled by adopters' CI. The adoption guide states it explicitly: 3 is not a
  worse 1.
- The two reviewed inventories (standards series, rule catalog) are load-bearing files with a stated
  contract: human-reviewed, never regenerated. Both carry that contract in a `$comment`.
- A limitation stated plainly rather than papered over: someone with commit access can edit the
  guards themselves. What the design guarantees is that doing so is a visible, reviewable change to a
  file that exists to prevent it — not an invisible edit to a rule buried in prose.
