---
name: failure-mode-checks
description: Run tools/checks before opening a PR; interpret ratchet baselines (FM-01 controller logic, FM-03 null coercion) and the diff check (FM-02 removed error handling).
---
`python3 tools/checks/run_all.py --base origin/main`. FM-01/FM-03 compare counts to `tools/checks/baseline.json`:
lower is good, higher fails. FM-02 fails if your diff deletes a `catch`/error handler unless the PR body contains a
line starting `Error-handling-removed:` explaining why. Update the baseline only when the count went *down*.
