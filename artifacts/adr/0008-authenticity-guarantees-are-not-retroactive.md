# 0008 — A pack cannot bootstrap authenticity guarantees for releases that predate them

- **Status:** Accepted
- **Date:** 2026-08-16
- **Deciders:** project owner, on evidence produced while implementing FE-13 stage 3

## Context

FE-13 gave `check` the ability to prove that the standards bytes producing a verdict are the
immutable release an adopter declared. The feature was specified with four falsifiers, committed
failing before any remedy was designed. Three of them now pass unchanged. The fourth cannot pass, and
finding out why produced a fact about this system that is worth more than the test.

The fourth falsifier is the control case: correct tag, correct `VERSION`, one standards file modified.
Every label agrees and the bytes do not, which is the row that separates artifact identity from
labels. It builds its fixture like this:

```js
git clone --local REPO dir; git -C dir checkout v1.0.0
check(dir, adopter)   // spawns dir/scripts/standards.mjs
```

The pack it evaluates with is a checkout of `v1.0.0`. So the evaluator it exercises is `v1.0.0`'s —
code released before the release-identity mechanism was written. Reproduced directly: that CLI reports
`standardVersion: "1.0.0"` and carries no `releaseIdentity` at all, which is exactly what the falsifier
forbids. No change to `main` alters this, because no change to `main` is present in `v1.0.0`.

Two environmental accidents had hidden it. On Windows `git clone --local` hardlinks the object store,
hardlinks do not cross volumes, and a repository on `F:` with a temp directory on `C:` therefore took
the fallback branch and copied the *current* pack instead. On the hosted runner the shallow checkout
had no tags, so `checkout v1.0.0` failed and took the same fallback. `fetch-depth: 0` removes the
second, and forcing a same-volume temp directory removes the first; with either removed, the falsifier
fails.

## Decision

**Record as an architectural property of this system, not a defect in it:**

> A pack cannot bootstrap stronger authenticity guarantees for releases that predate those guarantees.

`v1.0.0` remains a valid certified standards release. It cannot truthfully claim the FE-13
self-verification property, because it does not contain it, and no later work can put it there. The
first later release that contains the mechanism establishes the floor from which adopters can demand
it.

**`1.0.0` is not retroactively relabelled** as providing a mechanism it never contained. Its entry in
the changelog, its certification record, and its tag stay exactly as they are.

### FE-13's completion rule is revised, and the falsifier is not

The original rule read: this item cannot complete while any of its four falsifiers is still marked
`todo`, and they may not be deleted, weakened, rewritten to assert something easier, or moved out of
the default test run. That rule is kept in full, with one distinction added that it did not
anticipate — between a falsifier whose subject is *the current evaluator* and one whose subject is *a
release that cannot be changed*:

1. **Falsifiers whose subject is the current evaluator must become unchanged, ordinary regression
   tests before FE-13 can complete.** Three have, each mutation-checked first.
2. **The retroactive-release falsifier remains unchanged and `todo` until there exists an immutable
   release containing the release-identity mechanism.** It must then be exercised against that release
   and converted unchanged before FE-13 is fully closed.

FE-13 therefore stays `IN_PROGRESS` past the completion of stage 3. Its remaining acceptance condition
is release-bound rather than implementation-bound, and saying so is different from meeting it.

## Alternatives considered

### Rejected: rewrite the falsifier's fixture so it passes

Construct a pack whose material is `v1.0.0`'s and whose evaluator is the one under test. No checkout
is that — a checkout is all of one commit or none of it — so it would mean assembling a pack that
never existed and asserting a property of it.

Rejected on Standard 42 grounds, and the reasoning is the point of the rule rather than a formality:
changing a falsifier so that the implementation satisfies it is indistinguishable, in the diff and six
months later, from having satisfied it. The rule about *what may complete an item* is a decision the
owner makes in the open; the test that reproduces the defect is not the place to record it.

### Rejected: declare the falsifier obsolete and delete it

It is not obsolete. Its requirement — labels agreeing while bytes differ must be rejected — is exactly
right, is the row that distinguishes a real remedy from a version-string comparison, and will be
satisfiable against the first release containing the mechanism. Deleting it would discard a valid
acceptance condition because it is currently inconvenient to meet.

The property it asserts is not left uncovered in the meantime: the same shape is tested at the level
where the mechanism lives, against a real `v1.0.0` checkout, in `test/release-verification.test.mjs`
("one changed byte in one standard is enough to lose release identity"). What that test cannot do is
run the *released* evaluator, which is the whole of what the falsifier is still waiting for.

### Rejected: backport the mechanism and re-tag `v1.0.0`

Would make the falsifier pass immediately. Rejected because a re-tagged release is a moving reference
wearing an immutable one's name, which is the precise thing FE-13 exists to detect. It would also
falsify the certification record, which attests a specific tree.

## Consequences

- FE-13 stays open through the pull request that completes stage 3. Stage 3 is complete; the feature
  is not.
- Adopters may demand the self-verification property from the first release that contains it, and not
  before. Documentation must not describe it as a property of 1.0.0.
- The falsifier stays in the default test run, `todo`, printing what it asserts on every run — which
  is what keeps the outstanding condition visible rather than remembered.
- A general caution this repository should apply beyond FE-13: a test that constructs its fixture by
  checking out a release is testing that release's code, not the working tree's. That is sometimes
  exactly what is wanted. It should never be by accident.
