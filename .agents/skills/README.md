# Agent skills for this repository

Short, repo-specific instructions an agent should load before working here. Each skill is a folder with `SKILL.md`.

| Skill | Use when |
|-------|----------|
| `run-the-stack` | You need both halves running locally (or in Docker) to test anything |
| `stage-outputs` | You are a stage subagent and need the exact artefact format and ID scheme |
| `ui-gauntlet` | You changed anything a user can see; run and extend `tests/ui` |
| `failure-mode-checks` | You are about to open a PR; run `tools/checks` and explain any ratchet movement |
