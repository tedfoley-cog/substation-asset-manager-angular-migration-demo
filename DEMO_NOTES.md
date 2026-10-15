# Demo notes — Angular-migration pilot

**One-liner:** the customer wants a *mechanism*, not a feature: an agentic SDLC that takes an incomplete requirement through Specify → … → Trace, stops at human gates, and ends in a reviewed, traced, merge-ready draft PR. This repo is the day-zero system the mechanism operates on.

## Demo flow (talk track: "show X, say Y")

- **Show `main` running (Substations → IEDs → CEN01_SGT2_87T → Compare).** *Say:* "This is the before-state: a real AngularJS 1.8 protection-asset app. The red row is an 87T slope outside its permitted range — the comparison logic that finds it lives in a `$scope` controller, which is exactly what the migration has to move."
- **Show `requirements/customer/angular-migration-requirement.md`.** *Say:* "The only input. It's incomplete and contradicts itself — server-side comparison vs 'no API changes', exact equality vs tolerance, an unmeasurable 1-second target. Specify must surface these, not paper over them."
- **Show `harness.yaml` + `docs/HARNESS_CONTRACT.md`.** *Say:* "Nine stages, five human gates, stable REQ/DES/TST ids, draft PRs only, `ai-generated` label, two reviewers on auth/audit/migration paths. Devin is both the orchestrator and every stage agent — child sessions."
- **Kick off the orchestrator; stop at the Specify gate.** *Say:* "It wrote SPEC.md with REQ ids and an open-questions list, and it is waiting for a human. Nothing moves without approval."
- **Approve; fast-forward to QA.** *Say:* "Three failure-mode checks run on every push: logic in controllers (ratcheted — day zero has findings, the count may only go down), removed error handling, and null-to-zero coercion. Plus Karma, JUnit, OpenAPI contract, ArchUnit and the Playwright gauntlet."
- **Open the draft PR.** *Say:* "Trace matrix REQ → DES → TST → commit, governance trailers, two reviewers requested, `ai-generated` label, screenshots and recording attached. It is not merged — agents never merge."
- **Finale — live UI test.** Devin clicks through the migrated screens in a visible browser: switch to L. Chen (VIEWER) → Disturbance Records → download refused → Audit trail shows the DENIED row; then CEN01_SGT2_87T compare → range violation first, de-DE decimal commas intact → Export CSV. *Say:* "Same gauntlet CI ran headless, now live, on the migrated code."

## Gotchas

- Backend first (`:8080`), then frontend (`:3000`); Playwright counts assume a freshly seeded backend — restart it (or `docker compose down -v`) before the finale.
- Maven Central may answer HTTP 429 on shared runners: `MAVEN_MIRROR=https://maven-central.storage-download.googleapis.com/maven2/`.
- `lchen` must remain a VIEWER for S5 to show a DENIED download; don't "fix" that.
- Keep `main` at day zero; dry-run output stays on branches / draft PRs.
