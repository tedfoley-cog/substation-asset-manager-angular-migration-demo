# Harness Contract

This repository is the **target** of an agentic SDLC mechanism. The mechanism is not a feature of the app; it is a set
of rules that any orchestrator (here: a Devin session acting as main agent, spawning one child session per stage)
must follow when turning a customer requirement into merged, traced code. `harness.yaml` is the machine-readable
version; this page explains the intent.

## Roles

| Role | Who | What it may do |
|------|-----|----------------|
| Orchestrator | Devin main session | Reads `requirements/customer/`, runs stages in order, stops at every `gate: human`, never merges |
| Stage subagent | Devin child session | Produces exactly the stage output, cites IDs, pushes to a `devin/<FEATURE>/…` branch |
| Reviewer | Human (two for `two_reviewer_paths`) | Approves gates, reviews draft PRs, merges |

## Stage flow

```
Specify ─▶ Decompose ─▶ Design ─▶ Architect ─▶ Coding ─▶ QA ─▶ Integrate ─▶ Document ─▶ Trace
   ▲gate                  ▲gate      ▲gate                         ▲gate                    ▲gate
```

* **Specify** turns the incomplete customer request into `specs/<FEATURE>/SPEC.md` with `REQ-<FEATURE>-nnn` IDs. Every
  ambiguity, contradiction or missing fact becomes an *Open question* — the agent must not resolve it by guessing.
* **Decompose** lists ordered work items; each names the REQ IDs it satisfies and the gauntlet scenario it protects.
* **Design / Architect** produce the design and ADRs (`DES-…`). For the Angular migration the ADRs that must exist are:
  who bootstraps (UpgradeModule), routing during hybrid (ui-router stays), locale source, where comparison logic lives.
* **Coding** happens on `devin/<FEATURE>/<work-item>` branches, opens **draft** PRs labelled `ai-generated`, with the
  commit trailers in `harness.yaml`.
* **QA** runs lint, unit, contract, failure-mode checks and the UI gauntlet. Nothing is "done" until `tests/ui` is green.
* **Integrate** is human-only: agents never merge, never force-push, never change branch protection.
* **Document / Trace** update `docs/ARCHITECTURE.md` and the requirement→design→code→test matrix in `docs/trace/`.

## Traceability rules

1. Every REQ ID appears in at least one DES ID, one code change (commit trailer `Refs:`) and one test (`TST-`).
2. Orphans in either direction fail the Trace stage.
3. IDs are never reused or renumbered; retired IDs are marked `withdrawn` with a reason.

## Failure modes the harness must catch

| ID | Smell | Why it matters here | How it is checked |
|----|-------|---------------------|-------------------|
| FM-01 | Business logic in UI controllers | Settings comparison currently *is* this smell; the pilot must reduce it | `check_controller_logic.py`, ratchet |
| FM-02 | Error handlers removed in a diff | A relay settings upload that fails silently is a safety issue | `check_error_handling.py` on the PR diff |
| FM-03 | `null`/`undefined` shown as `0` / `''` | An unset pickup is not a zero pickup | `check_null_coercion.py`, ratchet |

Day-zero counts are recorded in `tools/checks/baseline.json`. A PR may lower them, never raise them.

## Human gates

A gate is passed only by an explicit human approval recorded in the PR or in the stage artefact's header
(`Approved-by: <name> <date>`). The orchestrator must stop and wait; it must not self-approve or infer approval.

## Non-negotiables

* No customer identifiers in this repository.
* Draft PRs only; `ai-generated` label on every agent PR.
* `main` is the day-zero state until a human merges.
* The demo ends with a human watching Devin click through the running application (`ui_gauntlet.live_finale`).
