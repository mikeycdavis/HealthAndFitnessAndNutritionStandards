<!--
COPILOT INSTRUCTIONS TEMPLATE — copy to .github/copilot-instructions.md.

The shortest of the three agent files, and the one most likely to be read in fragments. It carries
only the stop rule, because that is the part that must survive being skimmed.
-->

# Copilot instructions

This project produces health, fitness, or nutrition guidance. It is evaluated against a published
set of standards. Read [`AGENTS.md`](../AGENTS.md) before changing anything that affects guidance.

**Stop rule.** If a task would require giving guidance that a prohibition forbids, waiving a
prohibition, lowering a rule's strength, recording a review that did not happen, or declaring a rule
out of scope because the behavior is wanted rather than impossible — stop and say so. Do not work
around it.

**You may always say you do not know.** Insufficient evidence is a valid conclusion here, and it is
better than a confident wrong answer about someone's health.

Run `standards check .` before considering guidance work complete. Exit code 4 means the evidence
does not establish compliance; exit code 3 means the evaluation itself was manipulated and must be
reported rather than fixed.
