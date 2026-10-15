---
name: stage-outputs
description: Exact artefact paths, ID formats, gate markers and commit trailers for each harness stage (Specify … Trace).
---
Read `harness.yaml` first. Write only your stage's `output`. Use `REQ-<FEATURE>-nnn` / `DES-…` / `TST-…` IDs
(FEATURE = SETCMP for the settings-comparison migration). List every unresolved point under `## Open questions`;
never invent an answer to a customer gap. Stop at `gate: human` and leave `Approved-by:` empty for a human to fill.
Commits carry `Refs:` and `Stage:` trailers. PRs are draft and labelled `ai-generated`.
