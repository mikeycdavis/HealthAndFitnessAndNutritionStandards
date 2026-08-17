# R2 rehearsed before the ceremony, with a throwaway key

**What this is.** `ci/certify-release.mjs` is run once, by the custodian, against a signed and
unpublished `v1.1.0`. A mechanism that has never been executed before the one moment it matters is a
mechanism nobody has tested, so it was exercised first against a key created and destroyed for the
purpose. **The custodian's key was not involved and was never present.**

**What this is not.** It is not R2. R2 is the run against the real signed tag, and its evidence is
recorded separately at ceremony time. Nothing here certifies any release: every tag below was created
in a scratch clone under the session's temporary directory, none was pushed, and all were destroyed
along with the keys.

## Runs

All against candidate `67b9c873280255bb74d2ba722cccd91d5ae45e7e`, in a `--no-hardlinks` clone.

| # | Setup | Result | Exit |
| --- | --- | --- | ---: |
| 1 | annotated, **unsigned**, no anchor (`--rehearsal`) | R2 INCOMPLETE | 2 |
| 2 | SSH-signed with throwaway key, that key as anchor | **R2 PASSED** | 0 |
| 3 | SSH-signed with throwaway key, **a different key** as anchor | R2 FAILED — the signature did not verify | 1 |

Run 2's evidence block, as emitted:

```text
candidate commit                      67b9c873280255bb74d2ba722cccd91d5ae45e7e
annotated tag object                  50aeee8ab3ceef47c2f408f1b716c93b58252af6
dereferenced release commit           67b9c873280255bb74d2ba722cccd91d5ae45e7e
signature present on the tag          yes
signer fingerprint                    SHA256:Bw3SiR28Iun10+fGqjEXZ/IkkVcAfhD6qhElkhLUTcw
local external verification result    verified under HFN_TRUSTED_PUBLIC_KEY
R2 result                             PASS — control established identity; modified material refused as material-differs
tag pushed at time of R2              no
```

That fingerprint is a throwaway. It is recorded because a rehearsal whose signer is unnamed is a
rehearsal nobody can tell apart from the real thing later.

## The defect the rehearsal found, which is the reason it was worth doing

The first version of the script printed **`R2 PASSED`** over an evidence line reading
`local external verification result    not checked`. Both halves were true and the headline was not:
the material binding had been established and the signature had not been examined at all, and a
consumer reads the headline.

That is the ST-12 finding — *nothing examined the signature, so nothing may be said about it* — arriving
in the tool built to enforce it. Reasoning about the script would not have surfaced it, because the
evidence block was already honest; only running it with the anchor absent showed the two lines
disagreeing.

Corrected: a run without a trust anchor is **R2 INCOMPLETE** and exits 2, so it cannot be mistaken for
certification; signature *presence* is now checked independently of anchor availability, because "this
tag is not signed" is a fact about the candidate rather than about the verifier; and `--rehearsal`
cannot reach exit 0 by construction.

Run 3 is the control that keeps run 2 meaningful. Without it, "verified" could mean the verifier
approves of everything it is shown.
