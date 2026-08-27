# Changelog

Three versions travel independently and are not the same number:

| | Where | Changes when |
| --- | --- | --- |
| Framework version | `VERSION` | A standard or rule is added, changed, or retired |
| Package version | `package.json` | The tooling is released |
| Output schema version | `schemaVersion` in JSON output | The output format changes |

**Semantic versioning applied to standards.** A new requirement or prohibition is a **major** change,
because it can make a compliant project non-compliant — that is the intended behaviour rather than a
regression. A new recommendation is **minor**. Documentation, detector fixes, and clarifications that
do not change what a rule means are **patch**.

## Unreleased

**No standard, rule, or prohibition changed**, and nothing an adopter is evaluated on moved. The
corpus is still 42 standards, 59 rules, 34 prohibitions and the integrity invariant. `VERSION` and
the output `schemaVersion` are untouched, because neither what a rule means nor what the tooling
emits has changed.

### Changed

- **Hosted CI runs the whole declared Node range** (ST-11). `engines` says `>=18`; the workflow ran
  one pinned version, so everything between the two was asserted rather than demonstrated. The
  `verify` job is now a `fail-fast: false` matrix over Node 18, 20, 22, 24 and 26 — contiguous even
  majors from the declared floor — and `actions/checkout` and `actions/setup-node` move to `v5`,
  which also retires the Node 20 action-runtime deprecation warning on every run.

  That gap was not theoretical. `npm test` was `node --test "test/*.test.mjs"` for the whole life of
  the repository; glob expansion inside `--test` arrived in Node 21, so on the pinned Node 20 — and
  on every other version in the declared range — the suite matched a literal path, found nothing and
  exited 1. It ran only on the maintainer's Node 24. `test/guards.test.mjs` closed that specific
  hole; the matrix closes the class.

  The job stays a single parameterised job invoking `ci/run-checks.sh`, so there is still exactly one
  definition of what CI passing means. `test/local-ci.test.mjs` now asserts that the matrix contains
  the declared floor, skips no major in between, selects the version through `matrix.node-version`
  rather than a literal, keeps `fail-fast` off and the checkout unshallow, and that the workflow does
  not restate a pipeline stage. Those assertions read the `jobs:` section with comments stripped: the
  first draft matched the file as a whole and a shallow checkout passed it, because the explanatory
  comment above the step still contained the words `fetch-depth: 0`.

## 1.1.0 — released 2026-08-26

**No standard, rule, or prohibition changed. The corpus is identical to 1.0.0** — still 42 standards,
59 rules, 34 prohibitions and the integrity invariant. What moved is integration capability and
release authenticity machinery, which is a **minor** change under the policy above: nothing here can
make a compliant project non-compliant.

**Released 2026-08-26**, and the first release signed under the regime ADR 0010 established: tag
object `6c8d8935d2fbe842c09569f4530fd0c16dc91446` over release commit
`91c870087c32d8b728249aa91cc1659b7eadf979`, certified by R2 while still unpublished and pushed only
afterwards. The trust anchor is the operator store outside every pack ([ADR 0013](artifacts/adr/0013-the-trust-anchor-lives-in-an-operator-store-outside-every-pack.md)),
and the full ceremony record — including the blocker that held it and a near-miss during setup — is in
[`artifacts/evidence/2026-08-26-v1.1.0-release-ceremony.md`](artifacts/evidence/2026-08-26-v1.1.0-release-ceremony.md).

The output schema version stays at `1.1`, moved earlier in this cycle when the output format changed.
Nothing here changes it again: the adapter is a new file, not a new field in the envelope.

### Added

- **This pack publishes an adapter contract** (ST-14). `standards-adapter.json` at the repository root
  declares how StandardsEnforcer invokes this pack and how to read the answer: `check {target} --json`
  against `scripts/standards.mjs`, under adapter schema `1.0.0`. The enforcer had recorded this pack
  as blocked since 2026-08-09 for one reason — *"no tag, `1.0.0-dev`"* — and `v1.0.0` removed it, but
  no declaration existed to read. `1.0.0` rather than `1.1.0`: the `{policy}` placeholder exists for
  packs that do not read the policy from the target, and this one does.
- **The backlog tracker is generated rather than asserted to be.**
  `artifacts/backlog/README.md` has carried "GENERATED FILE - do not edit by hand" since
  2026-08-09 with no generator in the repository, and drifted four ways while it said so: the
  headline read 12 of 25 (48%) against items giving 13 of 26 (50%), the status table summed to 38
  across 39 items, the story count omitted ST-14, and FE-17 rendered as active over DEFERRED
  frontmatter. `scripts/backlog.mjs` (`npm run backlog`, `npm run backlog:check`) derives the page
  from item frontmatter, and `test/backlog-tracker.test.mjs` fails when the committed tracker is not
  what the items derive. The legacy `DONE` status alias is normalised in one documented place and
  tested explicitly, because dropping it is how the arithmetic broke.
- **The declaration is pinned to the CLI in both directions** (ST-14).
  `test/adapter-contract.test.mjs` derives the status vocabulary from `scripts/compliance.mjs` and
  `scripts/standards.mjs` independently of the adapter, and goes red on a new CLI status that was not
  declared as well as on a declared status the CLI cannot produce. `result.passing` is pinned
  separately, against the exit-code mapping rather than the vocabulary, because *what can be emitted*
  and *what authorises proceeding* are different claims. This was not theoretical: FE-13 added
  `UNIDENTIFIED_RELEASE` and `SELF_MAINTENANCE` after the enforcer's inventory was taken, so a status
  list copied from any sibling pack would have been false on the day it shipped.
- **R1 — a release whose labels agree and whose bytes differ cannot obtain a verdict**
  (`test/release-material-binding.test.mjs`), asserted against an immutable release the test
  constructs rather than borrows.
- **R2 — release certification** (`ci/certify-release.mjs`), run once during the ceremony against the
  signed tag while it is still unpublished, emitting the evidence block `docs/release-signing.md`
  step 5b requires. It never holds a key.
- **R2 has its own guards** (`test/release-certification.test.mjs`). Independent review found that a
  run whose `origin` could not be queried recorded the tag as `unknown` and then printed **R2 PASSED**
  and exited 0 — authorising a push without establishing the unpublished precondition R2 exists to
  check, and capable of certifying an already-public tag. Unavailable evidence is not confirming
  evidence; the script applied that rule to a missing trust anchor one check later and not here. Now
  three-valued, and the fixture signs its own tag so the remote is the only variable and the case
  cannot pass for the wrong reason.

### Changed

- **FE-13's fourth falsifier is retired, on evidence** (ADR 0012). It could never pass: its fixture
  checks out `v1.0.0` and executes *that* evaluator, which predates the release-identity mechanism and
  by ADR 0008 can never contain it — so the completion rule written on 2026-08-16 named a condition no
  release could reach. Worse, where `git clone --local` cannot hardlink across volumes its fallback
  copied the working tree without `.git` and it passed without exercising either half of its subject,
  which `todo` hid. It is preserved byte for byte at `test/retired/fe-13-falsifier-4.retired.mjs`,
  digest-pinned and out of the test command, and its subject is now covered by R1 and R2. ADR 0012
  records the rule this is permitted under: **a falsifier may be retired only on evidence that its
  fixture cannot express its subject, never because it is merely red.**
- The suite runs 300 tests with **no `todo`** for the first time.

- **A pull request body no longer keeps asserting the first commit it was verified against**
  (ST-13). `ci/submit-pr.*` wrote the local-CI evidence block when it created a request and never
  again, so every later push left a table headed **Verified commit** naming a commit the branch had
  moved past — PR #2 carried `f56c7e1` under a table naming `b70d798`, two commits and one
  remediation earlier. Not a false green: a true one pinned to the wrong object, on the surface a
  reviewer reads first. `ci/pr-evidence.mjs` now composes and replaces the block for both wrappers,
  locating it by markers rather than by its heading, keeping superseded runs beneath the current one,
  and **refusing** when the region cannot be identified — a body edited by hand is reported and left
  alone, because guessing which `## Local CI` heading is the real one is how prose gets destroyed.
  Found in review, then corrected by hand three times before it was fixed, which is the sound a
  mechanism makes when it is missing.

  The update path fails closed. A body that cannot be read is not treated as an empty one — that
  `|| true` turned a transient GitHub read failure into a `pr edit` replacing somebody's whole
  description with a CI table, which is worse than the staleness the item was opened for. And the
  block offered for manual repair is the complete machine region, markers included; slicing it from
  the heading down dropped the opening marker, so following the instruction produced a body no later
  run could identify.

- **The output schema version is `1.1`.** It should have moved with FE-13 and did not. Every verdict
  gained `releaseIdentity`, `check` gained a refusal envelope, and `maintain` introduced a third
  shape — three output-format changes under a field still announcing `1.0`, which the table at the
  top of this file says changes when the format changes. Minor rather than major: nothing was removed
  or renamed, and the new envelopes arrive only with exit codes that did not previously exist. One
  constant now feeds all four envelopes, including `audit`, whose own shape did not change — the
  number names the contract the output belongs to, not the history of one envelope.

- **Release identity is established before the pack's schema may judge the adopter's policy.**
  `check` validated the whole policy through `schemas/project-policy.schema.json` first. That schema
  is pack material, inside the verified boundary, so an altered pack could reject a perfectly valid
  adopter policy as a configuration error — the adopter's fault, exit 2 — before anything established
  that the schema making the judgement belonged to the release the adopter asked for. Found by
  independent review of PR #2, which named it precisely: unverified pack material influencing the
  evaluation before identity is established. `check` and `maintain` now read only the fields needed to
  learn which release is requested, establish identity, and validate the full contract afterwards.
  Not claimed: that the evaluator running the check is any less pack material than the schema is.

### Added

- **A genuine signature can no longer be relabelled onto a release it did not authorise.**
  `readSignedTag` trusted the ref name it was handed and never read the signed tag object's own
  `tag <name>` header, so pointing `refs/tags/v9.9.9` at the custodian's real signed `v1.1.0` tag
  object passed every check — matching commit, matching tree, correct signer, valid signature, all of
  it authentically the custodian's work. Comparing oids cannot catch that: they are identical by
  construction, and a ref is an alias nobody signs. Reported as `release-name-mismatch`, contradicted
  rather than missing, because somebody built that ref. Found by independent review of PR #7, and the
  external-verifier contract now states the name binding so a host implementing it does not inherit
  the same gap.

- **A verifier that cannot run is `verification-unavailable`, not `invalid-signature`.** A missing,
  unspawnable, or too-old `ssh-keygen` exits non-zero exactly as a refused signature does, and the
  reference mechanism collapsed the two — asserting that a signature had been examined and found
  wanting when nothing examined it, which is a claim nobody performed and a false accusation against
  whoever signed. Verifiers now answer in three states. `verification-unavailable` is kept distinct
  from `verification-unimplemented` because the operator actions differ: repair the tool, versus this
  capability was never built. The falsifiers are paired deliberately — mapping every cryptographic
  failure to *unavailable* would satisfy the missing-tool test on its own, so a tampered-payload
  control sits beside it.

- **The release-signing procedure, frozen separately from its first execution.**
  [`docs/release-signing.md`](docs/release-signing.md) is a human ceremony with machine assistance
  rather than a pipeline with a human in it: a dedicated key the custodian holds outside the
  repository and outside CI, a public key registered with the trusted host independently, a release
  candidate identified before signing rather than repaired by it, independent inspection of the tag
  before the push, **no unsigned fallback tag if signing or verification fails**, public facts
  recorded and nothing derived from the private key, and rotation as an explicit governance event.
  The prohibition that shapes the rest: **no release automation may possess the signing private key
  merely to make the ceremony convenient** — the build prepares and verifies a candidate, an agent
  prepares the command and inspects public evidence, the human performs the signing act. Freezing the
  procedure and executing it are separate, so ST-12 completes without manufacturing a release to
  satisfy process; the first new signed release is the production proof, not a prerequisite. Step 1 is
  a guard rather than a promise: a test asserts no tracked file in this repository contains private
  key material.

- **The external verifier contract, and conformance vectors for somebody else's implementation.**
  [`docs/design/external-verifier-contract.md`](docs/design/external-verifier-contract.md) freezes
  what a trusted host must do to establish canonical origin: acquire trust independently, resolve the
  release itself, verify authorization itself, resolve the signed object, materialise and bind the
  exact bytes, and only then execute pack code — plus the negative contract, which is where the
  erosion would otherwise start. **This repository owns the specification and the test vectors;
  StandardsEnforcer owns the authoritative implementation**, because a specification can be published
  by the thing being authenticated without weakening anything and a verdict cannot.
  `test/host-verifier-conformance.test.mjs` implements a host from that document alone — importing
  neither reference module, since a conformance test that reuses the implementation proves only that
  it agrees with itself — and runs both required vectors: a hostile fork with a patched judge, a
  patched verifier, malicious Git configuration and its own signed tag is rejected with none of its
  nominated code executed, and a genuine signed release is accepted with the authenticated tree
  materialised and bound.

- **The boundary the cryptography does not reach.**
  [ADR 0011](artifacts/adr/0011-canonical-origin-cannot-be-asserted-by-the-pack.md) records what
  review of the SSH slice found: the anchor is external, and the judge is not. `pack-origin.mjs` and
  `ssh-tag-verifier.mjs` live inside the pack whose origin they authenticate, so a hostile fork
  rewrites either and reports `ESTABLISHED` without going near `ssh-keygen` — and supplying the real
  public key changes nothing, because the key is external and the code interpreting the evidence is
  not. **Canonical-origin establishment therefore requires a verifier whose implementation is outside
  the evaluated pack's control.** The pack may provide the signed tag, the standards bytes, a
  reference implementation, and diagnostics; it may not pronounce on its own origin. The overclaiming
  sentence in `pack-origin.mjs` is narrowed in place with its correction beside it rather than
  rewritten, and `test/trusted-execution-boundary.test.mjs` makes the difference observable: the same
  tag and anchor, answered once by the module loaded from the evaluated pack and once by the module
  the host already had, disagreeing. What ST-12 can close here is the protocol and the
  external-verifier contract; full-fork exclusivity cannot be closed by this repository, because the
  trusted execution boundary necessarily lives outside it.

- **Release signatures are verified, and not through `git verify-tag`.**
  `scripts/ssh-tag-verifier.mjs` reads the signature out of the annotated tag and reports who signed;
  the trust comparison stays in `pack-origin.mjs`, so there is one place where trust is decided and
  the mechanism can be replaced without moving it. SSH signing was chosen against ST-12's falsifier:
  the anchor is an argument rather than the invoking user's keyring, the signature is on the release
  object itself, and `ssh-keygen` is already in the CI image — which matters because `ci/Dockerfile`
  has no `RUN` instruction and a mechanism requiring an install would have had to change that.
  Git's own verification resolves the allowed-signers file through `gpg.ssh.allowedSignersFile`,
  configuration the *evaluated repository* controls, which would let a pack nominate the file that
  decides whether to believe it. Tested with real keys: a fork generates its own key, signs a genuine
  release, ships its public key as in-repo trust configuration, satisfies `git verify-tag` on its own
  terms — and is refused, while the same release under the fork's own anchor is accepted, so the test
  cannot pass by the fork being incompetent.

- **The canonical-origin contract, without the cryptography.** `scripts/pack-origin.mjs` holds the
  origin states, the five reasons a claim can fail, and `assertCanonicalOrigin` — the single door
  every origin-dependent assertion goes through. `maintain` reports origin and does not require it,
  because it answers whether this working tree satisfies the standards it publishes, and putting that
  behind release-owner credentials would make ordinary development depend on trust configuration
  contributors correctly should not hold. Anything that *claims* canonical origin fails closed. The
  state is named rather than boolean: `originVerified: false` would let a caller collapse "checked and
  rejected", "could not check", and "no anchor was supplied" into one branch, and those three are the
  distinction the mechanism exists to make. The verifier is injected and no mechanism is chosen yet
  (ST-12), so origin is `NOT_ESTABLISHED / verification-unimplemented` — which is what fail-closed
  means before a thing is built. The module imports no filesystem access, asserted structurally,
  because the rejected in-pack-anchor design would pass every behavioural test by making the happy
  path easier.

- **A recorded custody decision for release signing, and the constraint that makes it worth
  anything.** [ADR 0010](artifacts/adr/0010-release-signing-custody-and-an-external-trust-anchor.md)
  names the accountable human release owner as custodian of the private key — never committed, never
  generated by the pack, never available to ordinary CI — and freezes, before implementation, that
  **the trust anchor cannot come from the pack being authenticated.** A `trusted-key.json` shipped
  inside this repository is replaced by a fork along with everything else, after which the fork signs
  its own release and verifies successfully: cryptographic proof of internal consistency, presented as
  proof of origin. That is the FE-13 defect rebuilt one layer up under a stronger-sounding name, and
  it is the design a reasonable implementer arrives at by default, so it is recorded as rejected
  rather than left absent. No mechanism is implemented and nothing yet verifies a signature; ST-12
  carries the falsifier any candidate must be measured against — a competent fork that substitutes its
  own key, signs correctly, and must still be rejected.

- **`standards maintain`, and the removal of the one bypass that could be mistaken for a green.**
  Independent review of the FE-13 gate requested changes on both properties the `packSelfMaintenance`
  exemption was claimed to have, and both rejections held.

  Eligibility was `path.resolve(root) === ROOT`, and `ROOT` comes from the evaluator module's own
  location — so it asserted "this directory is wherever the evaluator happens to be", which anyone
  who copies the evaluator into a directory they control satisfies for free. Reproduced before the
  remedy: a copy of this repository with its history deleted was granted the exemption and exited 0.
  Eligibility is now membership in the certified release lineage recorded in
  `scripts/certified-releases.json` — the tag resolving to exactly the recorded commit oid, with HEAD
  descending from it.

  Self-maintenance also ran the ordinary evaluator and emitted the ordinary envelope, so it could
  report `COMPLIANT` with exit 0 while `releaseIdentity.established: false` sat beside it as
  metadata. A consumer reading the exit code or the status was told an adoption had been verified
  when none had. It is now a separate command whose status is `SELF_MAINTENANCE` and never
  `COMPLIANT`, with the working tree's compliance result under `workingTreeStatus`; `check` refuses
  the pack with exit **6**. The property that buys: **`COMPLIANT` from `check` means the release
  identity was established**, with no field anyone has to remember to consult. This repository's own
  gate is now `npm run maintain`. See ADR 0009, which also names the residual it does not close.

  **Re-review narrowed the criterion, and the narrowing is recorded as a decision rather than
  absorbed.** The remedy closed the copied-evaluator escape; it did not make the criterion it was
  reviewed against true, because a fork of the certified lineage still satisfies eligibility. The
  owner retired that criterion on 2026-08-16 and approved a narrower boundary: an adopter cannot
  obtain a compliance verdict through self-maintenance, copying the evaluator is insufficient for
  eligibility, and exclusivity against a full fork is explicitly deferred to ST-12. The reason is
  that the property adoption actually needs — self-maintenance cannot manufacture `COMPLIANT` — is
  preserved, and the residual needs a cryptographic origin mechanism rather than another path or
  lineage heuristic. Recorded in ADR 0009 and FE-13, with the original criterion kept and marked
  retired rather than reported as passed.

- **`check` establishes which standards bytes produced its verdict, and refuses when it cannot**
  (FE-13, stage 3 of 3). `standardVersion` in a policy is the release an adopter *requests*; it was
  also what the tool reported back, with the catalog loaded from wherever the CLI happened to live
  and no identity check anywhere in the path. A pack whose `VERSION` said `0.0.0-substituted`, with a
  prohibition's verbatim source line reworded, still produced a report stating the project had been
  evaluated against 1.0.0.

  Identity is now established before the catalog is read, in three stages that stay in three files
  because collapsing them is where the defect came from: resolve the tag to an immutable object
  (`scripts/release-identity.mjs`), enumerate the bytes about to be evaluated
  (`scripts/release-material.mjs`), and compare the two within the reviewed material boundary
  (`scripts/release-verify.mjs`). A verdict now carries a `releaseIdentity`; a run that cannot
  establish one exits **5** and produces no verdict at all.

  The comparison is symmetric on purpose. A file the pack has and the release does not is a rejection
  as much as a file that changed — that is the vendored patch and the extra local rule, material that
  changes verdicts while every released byte still agrees.

- **Containerised CI and verified pull requests.** The whole pipeline runs in an ephemeral Docker
  container (`ci/ci.ps1`, `ci/ci.sh`) and `ci/submit-pr.*` will only push a commit that has passed
  it — resolving `HEAD` before and after verification and refusing if it moved. See
  [`docs/local-ci.md`](docs/local-ci.md).

### Changed

- **The pipeline has one definition.** The stages moved out of `.github/workflows/ci.yml` into
  [`ci/run-checks.sh`](ci/run-checks.sh), which the workflow now invokes. The workflow was kept and
  still runs on its own; it is a second opinion rather than a prerequisite. Two definitions of a
  pipeline agree until the day they matter, and this one had already drifted once.

- **The build is isolated, not only the run.** `network_mode: none` governed the container and was
  documented as though it governed CI. The build beside it took the whole repository as its context
  and had a network, so a branch-controlled Dockerfile could bake the checkout into a layer and a
  `RUN` could send it somewhere. The context is now `ci/` alone, narrowed further by a deny-by-default
  `ci/.dockerignore`; the build has `network: none`; and `ci/Dockerfile` has no `RUN` at all, which is
  what makes that free — git comes from `node:20-bookworm` instead of an `apt-get` onto `-slim`, at
  about 800MB. A test asserts each of those and then builds a probe image to read back what Docker
  actually hands the build.
- **Every name a run writes is run-scoped.** The unique Compose project covered containers and
  networks and did nothing for the image tag, so two overlapping runs both wrote
  `hfn-local-ci:node20` and the second build could move it between the first run's build and its run.
  The tag now carries the run id, and so does the log the stage markers are parsed out of.
- **A pass has to be evidenced.** `run-checks.sh` prints `::ci-complete:: stages=N` only after every
  stage passed; the wrappers refuse to record a pass unless that matches the markers they saw, and
  `submit-pr.*` refuses evidence recording a pass over no stages. A container that exits 0 without
  running the pipeline previously produced `result: passed` with an empty stage list.

### Fixed

- **`ci/ci.ps1` could mask a build failure with an error of its own.** Its `finally` read `$status`
  before any assignment reached it, which under `Set-StrictMode` raises a second error and skips the
  cleanup it exists to run. Visible only on the `-KeepOnFailure` path, because `-and` short-circuits
  past the unset variable otherwise — which is why the regression test passes the switch.

### Found while building this

- **`MATERIAL` is versioned with the release, and widening it retroactively breaks the past.** The
  new lineage record was first placed under `artifacts/` and added to the material boundary, because
  authority the evaluator consults to decide an outcome belongs inside the bytes that get verified —
  a repository guard says exactly that and caught its absence. Four tests then went red: `materialise`
  requires every declared path to be present, so a boundary that names a file no earlier release
  contains makes every earlier release unmaterialisable, and the real `v1.0.0` checkout stopped
  verifying. The record lives beside the evaluator instead. This is ADR 0008's fact wearing different
  clothes: a boundary is a property of the release that declared it.
- **A mutation restore destroyed an hour of uncommitted work.** `git checkout -- <file>` restores
  from HEAD, not from the working state a mutation was applied to, so the discipline "reintroduce the
  defect, watch the test redden, restore byte-for-byte" silently means "and discard everything not yet
  committed". Commit first, then mutate. Recorded because the procedure is written down in three
  places in this repository and none of them said so.
- The container is given no network at all, which turned the zero-dependency policy from a comment
  in a workflow file into a property of the environment. The policy had never been enforced by
  anything but attention.
- The hosted workflow earned its keep the first time it was able to run. The new `ci/ci.ps1` tests
  guarded on "is PowerShell present" rather than "is this Windows"; the CI container has no
  PowerShell and skipped them, and the Linux runner has PowerShell and ran them against a Windows
  `.cmd` shim. Local CI passed and GitHub failed. It is stronger about tags and weaker about anything
  the container does not have, and "second opinion" turned out to be the literal description.
- Three of the four defects above came from review of the pull request rather than from building it,
  and the fourth from running a deliberately failing build. None was visible to reading the code with
  the intent behind it in mind. The enforcement mechanism finding defects in itself before adoption
  makes it infrastructure is the mechanism working, and it is the reason PR #1 did not merge on the
  strength of its own description.
- One of FE-13's four falsifiers cannot be satisfied by any change to `main`, and finding out why was
  the most useful thing in that slice. It builds its fixture by checking out `v1.0.0` and running
  `check` from it — so the evaluator it exercises is `v1.0.0`'s, which predates the mechanism under
  test and cannot contain it. A pack cannot bootstrap stronger authenticity guarantees for releases
  that predate those guarantees (ADR 0008). `1.0.0` is not relabelled as providing a mechanism it
  never contained; the first later release containing FE-13 is the floor adopters can demand it from.
- Mutation-checking the three falsifiers before promoting them found two things their names did not
  say. Falsifier 2 requires the output to record which release evaluated the project, and is today
  satisfied by the *refusal* envelope — removing the field from a successful verdict leaves it green,
  and two other tests catch that instead. Falsifiers 1 and 3 no longer separate under any mutation,
  because the code path that used to distinguish them now sits behind a gate that refuses first. Both
  are written down in the test file rather than left as an impression of coverage.
- That falsifier had been passing on Windows for a reason that has nothing to do with the standards:
  `git clone --local` hardlinks the object store, hardlinks do not cross volumes, and a repository on
  `F:` with a temp directory on `C:` silently took the fallback path and copied the current pack
  instead. Two environments, two different tests, one name. The tests added in this slice use
  `--no-hardlinks` and say why in the code.

## 1.0.0

The first release. Built in ten milestones, each with a gate that had to be green before the next
began.

### Added

- **42 standards.** Three foundations (the wellness/medical boundary, the trend-over-event principle,
  the four escalation tiers), twelve health, sixteen fitness, ten nutrition, and one governing the
  integrity of the standards system itself.
- **59 rules** across six categories: 34 prohibitions, 17 requirements, 7 recommendations, and 1
  invariant. `kind` is a first-class catalog field rather than a boolean flag on a requirement,
  because prohibitions are the majority here (ADR 0002).
- **`PROHIBITIONS.md`** — the prohibition index, hand-written and checked against the catalog rather
  than generated, so that it breaks loudly instead of going stale quietly.
- **The integrity invariant** (Standard 42), with `BLOCKED_BY_INVARIANT` and exit code 3. An attempt
  to waive a prohibition, lower a strength, attest past a finding, or exempt the invariant stops the
  evaluation rather than failing a rule.
- **Five CLI subcommands** — `init`, `audit`, `check`, `explain`, `status` — chosen for the loop an
  operator works in rather than copied from a list. `init`'s dry run is `plan()` without `apply()`,
  so it cannot describe something different from what apply does.
- **`NOT_EVALUATED` with exit code 4.** Insufficient evidence is a first-class outcome, and in this
  domain it is the expected first result.
- **Five guards** — the standards series inventory, the rule inventory, source fidelity, policy
  validation, and diagram freshness — each with a mutation test.
- **161 tests**, including a fire and do-not-fire pair for every detector.
- **Templates, worked examples, and fixtures**, with the fixtures built from the examples so an
  example that stopped satisfying the standards fails the build.

### Found while building

Things the guards, the tests, or dogfooding caught, kept here because a changelog that only lists
features implies the process was smoother than it was.

- **Running the tool against this repository found a design bug in the integrity screen.** It treated
  any finding bound to a not-applicable rule as a contradicted scope claim. But most findings report
  an *absence* — "no fitness plan" — which is evidence *for* a declaration that this project plans no
  training. As written, every correctly scoped project would have been reported as committing an
  integrity violation. Findings now declare `subjectExists`, and only a finding that presupposes the
  artifact exists can contradict a scope claim.
- **Writing the policy exposed a false green in the verdict logic.** With 34 prohibitions that no
  machine evaluates, a project where nothing failed would have been reported `COMPLIANT`. Nothing
  failing is not evidence that anything passed. An applicable required rule that nothing established
  now yields `NOT_EVALUATED`.
- **The use/mention trap was hit twice while writing test fixtures**, in two different detectors: a
  document that names the thing it claims is absent satisfies a substring scan. Both fixtures were
  fixed and both `$assuranceNote`s now state the limit plainly.
- **A test asserted the wrong thing.** "This repository produces no findings" was written against
  `audit`, which reads no policy and therefore reports that this repository has no fitness plan —
  true, and irrelevant. Asserting on it would have forced this repository to fabricate a training
  plan for a person who does not exist. It now asserts on `check`.
- **An anchor check disagreed with every anchor that works in a browser**, because it collapsed
  whitespace runs where GitHub replaces each space individually.

### Found during release certification

The release review found two things by running `standards status` and reading the output rather than
trusting the prose. Both are the reason a release review exists.

- **`COMPLIANT` was unreachable by any project, forever.** Four individually correct decisions — the
  integrity invariant applies to everyone, is human-evaluated, is never attestable, and any
  applicable required rule that nothing established yields `NOT_EVALUATED` — composed into an
  impossible state. Verified against the most favourable possible policy. No test caught it because
  every test asserted behaviour that was locally correct; it was reachable only by asking whether the
  system can emit a verdict it defines. Fixed by [ADR 0007](artifacts/adr/0007-screened-as-a-distinct-invariant-state.md)'s
  `screened` state, and a regression test now asks that question.
- **A hand-maintained count had drifted.** `PROJECT.md`, `CHANGELOG.md`, and the CI comment each said
  four rules awaited human review while the tool reported five —
  `nutrition.no-single-food-disease-claims` had been made applicable and the prose never updated.
  Nothing compared the two. A test now does, and it caught the prose being wrong a second time when
  ADR 0007 moved the invariant out of that set and the count became four again. Derived operational
  state now comes from `standards status`, not from a copy in prose.

### Found by independent content review

`health.no-fabricated-medical-facts` applies to this repository, because every standard and every
rule rationale here makes claims about physiology. An independent reviewer — who did not write the
prose — read all 191 extracted claims against external evidence and returned **DEFECTIVE**.

No invented physiology was found. Every defect was a real finding stated past its evidence, which is
precisely the failure [Standard 14](standards/14-evidence-quality.md) R2 names as the most common
one. It was written that way by an author who had read R2 while writing it, which is the argument for
external review rather than for a longer checklist.

Six blocking findings and eight wording issues were remediated in
[pack 03b](artifacts/release-review/03b-remediation-diff.md). The load-bearing ones:

- **A precise number that was not universal.** Age-predicted maximum heart rate was given "an
  individual error of roughly ±10–12 beats per minute". The figure is real, but it varies with the
  equation and the population and no equation or population was named. Now stated qualitatively, with
  the operational conclusion — that zones drawn from a prediction are not precise thresholds —
  preserved.
- **A table that read as a diagnostic instrument.** Standard 24's discomfort-versus-injury table had
  a column headed *Injury pain*, which turned a list of reasons to stop into a differential. It is
  now framed around the behavioural decision, and the claim that "sharp pain signals that something
  is being damaged" is gone: pain and tissue damage do not correspond one-to-one, and the rule never
  needed them to.
- **A rationale that silently strengthened its standard.** Standard 37 said shame is "a documented
  component of disordered eating **patterns**"; the JSON rationale dropped the qualifier. Both are
  now one sentence, at association strength, pinned by `test/claim-strength.test.mjs` with a mutation
  test that reintroduces the exact drift. The rationale fields had been flagged in advance as the
  least-scrutinised surface in the repository, and this is the evidence that the flag was right.
- **Findings generalised past their population.** The low-intensity training distribution is
  supported for trained endurance athletes and was stated for "most people and most goals"; it is now
  scoped, with the wider application labelled a practical default rather than an established finding.

The rule was not weakened, the evaluator was not touched, no numeric target was introduced to make
the standards appear better-evidenced, and `check` still exits 4. The repository failed its own
release criterion and nobody changed the criterion.

### The tier-four record under-escalated

The second independent review, of `escalation.tier-language-calibrated`, returned **DEFECTIVE** on
the highest-consequence document in this repository.

`docs/examples/interpretation-potentially-urgent.md` handles new exertional chest discomfort with
disproportionate breathlessness. It said *"Please arrange it today"*, and reserved emergency services
for the symptom recurring at rest or acquiring further features. [Standard 3](standards/03-safety-and-escalation-tiers.md)
R1 defines tier four as asking the reader to seek evaluation **now** rather than at the next
convenient time. "Today" is weaker than now, so the record failed the tier definition it was written
to illustrate.

The mechanism is the part worth recording. R4 says escalation language must not create alarmism. The
record removed the alarm correctly and removed some of the temporal urgency along with it, because
**nothing in the standard distinguished tone from timeframe.** The reviewer's formulation is the
distinction that was missing: *calm is constant across the tiers; urgency is not.* That now sits in
R4 itself, in `docs/escalation-tiers.md`, and in the example's own note, so an adopting project
imitating this repository inherits the correction rather than the defect.

The record now directs emergency services immediately and unconditionally, keeps its calm register,
and places its reassurance after the instruction rather than in a closing footnote — reassurance
ahead of an instruction competes with it. A second correction decoupled tier two's professional
contact from the completion of a one-to-two-week measurement series.

**No test was added, and none could be.** The tier detector checks that exactly one canonical label
appears in a record. The label here was always correct — *potentially urgent*. The entire defect was
in what the record then told the reader to do. That is what `assurance: none` means on this rule, and
it is the clearest demonstration in this repository of why a mechanical green would have been worse
than no check at all.

Before and after: [pack 01b](artifacts/release-review/01b-remediation-diff.md).

### Dogfooded

This repository carries its own `project-policy.yml` and is evaluated by its own CI.

Its status is **`COMPLIANT`**. It reported `NOT_EVALUATED` for most of this repository's life, because
four of its rules can only be established by a human and none had been; recording an attestation to
make CI green would have been the "falsify evidence for" clause of the invariant being attested. The
four attestations now recorded were decided by a named reviewer, not manufactured to reach a verdict.
The CI step that runs `check` accepted exit 4 for most of that time, with the reason written into the
workflow rather than hidden in a flag. That allowance was removed as part of the 1.0.0 release
mechanics; the gate is now `npm run check` and nothing else.

Two real failures surfaced during the build and were fixed rather than declared out of scope: the
README carried no wellness-scope disclosure, and `docs/escalation-tiers.md` did not exist.

### Known limitations

Stated because a limitation that is not written down reads as a claim.

- Detectors establish presence, never correctness. All 21 carry `assurance: partial` and a note.
- No rule claims `full` assurance, and the loader refuses one that would.
- Nothing evaluates a prohibition. All 34 report not-evaluated without a recorded human review.
- The allergen check of Standard 41 R2 is deliberately unbuilt: the detectors read documents, not
  runtime data, and a check that appeared to verify allergen safety without that access would be the
  most dangerous false green this system could produce.
- The guards make manipulation loud, not impossible. Anyone with commit access can edit them.
- No `.svg` renders are committed. The `.mmd` sources are canonical and the absence is declared
  (ADR 0006).
- `health.evidence-quality-noted` — a recommendation — applies here and has no evidence. Because it
  is a recommendation it does not force `NOT_EVALUATED` and does not enter the score, so this
  repository's `COMPLIANT` verdict is reached with one applicable rule carrying no evidence at all.
  Designed behaviour, disclosed rather than left to be discovered.
- Deferred work is in [BACKLOG.md](BACKLOG.md) with the reason for each deferral, so that a decision
  not to do something is distinguishable later from having forgotten it.

### Independent review completed

All four human-review rules carry an independent content-review disposition — **all four
ESTABLISHABLE**, two of them only after real defects were found and remediated. Recorded with their
evidence chains in [artifacts/release-review/dispositions.md](artifacts/release-review/dispositions.md).

A disposition is not an attestation. None carries a human `reviewedBy` identity, and the decision to
record an attestation belonged to a human reviewer and to nobody else. That decision was made
separately, and is recorded below.

A dry run in a scratch copy — deleted afterwards, the repository's own policy untouched — established
the release condition the reviewer set: with exactly those four attestations and nothing else
changed, `check` reports `COMPLIANT` at exit 0, the integrity invariant reports `screened` rather
than passed or attested, and every mechanical gate stays green. The full output is in the
dispositions record.

### An attestation was recorded and withdrawn

Four attestations were recorded at `ad6bdcb` and withdrawn in the commit immediately after. The
repository was `COMPLIANT` at exit 0 in between, and returned to `NOT_EVALUATED` at exit 4 — where it
stayed until the valid attestations recorded below.

Nothing about the content was wrong. The dispositions were sound, the per-rule states matched the
prediction frozen before any attestation existed — exactly four rules attested, the invariant
`screened`, `health.evidence-quality-noted` still not-evaluated — and all five guards and the whole
suite stayed green.

**The defect was provenance.** The `reviewedBy` identity was written on the authority of a draft
supplied by the reviewing agent, which cannot confer human authority on anything. The record
therefore asserted a human judgement whose author could not be established. The correction was
applied to the input: the attestations were withdrawn, and no disposition, standard, or line of
evaluator was changed in either direction.

**Why it is worth a changelog entry rather than a quiet revert.** This is the demonstration that
matching the predicted per-rule states is not sufficient. Every mechanical gate was green and the
verdict was exactly the one predicted, and it was still wrong — because provenance is not a property
any gate can read. The full account, including the withdrawn text preserved unedited, is in
[artifacts/release-review/attestation-2026-08-11.md](artifacts/release-review/attestation-2026-08-11.md).

### The four attestations were then recorded validly

The reviewer stated the four decisions themselves. All four **approved**, recorded under their own
identity on 2026-08-11, each with a `reviewedAgainst` digest fixing exactly the material read — so an
edit to any of those files returns the rule to not-evaluated rather than leaving an approval standing
over text nobody reviewed.

Two of the four approve **remediated** material rather than the versions first reviewed: the tier
corpus and the medical-claims corpus each returned `DEFECTIVE` on first review, and both were fixed in
the content. Neither rule, nor the evaluator, nor the policy's strengths were touched to obtain a
disposition.

The verdict moved to `COMPLIANT` at exit 0 — the same verdict `ad6bdcb` reached and was refused. What
changed is not the machinery and not the content. It is that the identity in `reviewedBy` is the
person who made the decision, because they made it.

### The certification pass found a defect the diff could not

An independent certification pass ran from the immutable baseline `7f59f8b` against candidate
`eb9a0f8`. It stopped before comparing per-rule states, on a defect in `.github/workflows/ci.yml`.

The comment above the release gate said this repository was `NOT_EVALUATED`, and said the exit-4
allowance could never be removed by recording reviews, because the integrity invariant permanently
prevents any project from reaching `COMPLIANT`. The second claim stopped being true at ADR 0007,
whose entire purpose was to make `COMPLIANT` reachable via `screened`. It sat directly above the line
the release mechanics exist to remove, and it said not to remove it.

**It was not findable by diffing.** The workflow had not changed since the baseline. It was found by
reading the surface an operator acts on and asking whether it was *true*, rather than whether it had
*moved*. Corrected at `9809afc`, comments only, gate line byte-identical. The limit it exposes is now
written into the certification procedure itself: diff-first protects against unexamined change; it
cannot establish that unchanged baseline content was ever correct.

### 1.0.0 release mechanics

Certification passed against `9809afc`. The mechanics then ran as a separate change, which is the
distinction this repository has kept throughout: authorization to perform release mechanics is not
evidence that they succeeded.

- `VERSION`, `package.json`, and the policy's `standardVersion` move from `1.0.0-dev` to `1.0.0`.
- CI's `|| [ $? -eq 4 ]` allowance and its transitional comment are removed. The gate is now
  `npm run check`, and exit codes 1, 2, 3, and 4 all fail the build.
- Derived surfaces updated: this file, `PROJECT.md`, the release-review ledger, and the backlog.

**No tag is cut here.** GitHub Actions cannot currently execute — the account's Actions billing or
spending limit blocks every run before a runner is acquired, so the workflow reports failure having
run zero steps. That is infrastructure not executed, not evidence about this repository. Because CI is
treated here as an enforcement surface rather than a formality, `v1.0.0` waits for an actual green
Actions run on the release commit.

### The first real CI run found that CI had never run the tests

GitHub Actions had been unable to acquire a runner for the whole life of this repository — an account
billing limit — so all thirteen workflow runs failed in about four seconds having executed zero
steps. When that cleared, the run on the release commit `83d799b` executed for real and failed at the
**Tests** step:

```
Could not find '/home/runner/work/.../test/*.test.mjs'
```

`npm test` was `node --test "test/*.test.mjs"`. Glob expansion inside `--test` arrived in Node 21, and
the quotes stop the shell expanding the pattern first. On the maintainer's Node 24 it ran all 160
tests. On CI's Node 20 — and on every Node in the declared `engines: ">=18"` range — it resolved the
pattern as a literal filename, found nothing, and exited 1.

**So the suite had never executed anywhere except one developer's machine.** Every guarantee this
repository makes about itself through its tests was, remotely, unverified. Nothing detected it,
because everything that could have detected it was one of the tests that never ran.

The fix is version-independent rather than a bump of CI's Node to match the bug: `npm test` now names
its nine test files explicitly. A new guard asserts that the set named in `package.json` equals the
set of `test/*.test.mjs` on disk and that the command contains no glob, so a test file that would
never run fails the suite. It has a mutation test, like every other guard.

**The lesson is the one this release keeps relearning.** The CI comment corrected at `9809afc` was
wrong for months and no diff could find it. The test invocation was broken from the first commit and
no local run could find it. An actionable surface is only verified by executing it, in the environment
that will execute it.
