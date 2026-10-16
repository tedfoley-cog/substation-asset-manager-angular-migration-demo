# CHANGELOG — SETCMP (CR-2031)
Stage: document
Feature: SETCMP
PR: #1
Base: main
Branch: `devin/SETCMP/cr-2031-settings-compare` (forked from `main` at `f701f90`; HEAD at documentation time `28cb6ae`)

Every statement below was checked against `git show <sha> --stat` and the files on the branch. Where the code differs
from `specs/SETCMP/DESIGN.md`, the code is described and the DES id cited.

## WI-SETCMP-01 — Angular 16 CLI toolchain beside the AngularJS shell — `b07ae13`
**Added**
- `frontend/angular.json` (project `sam-ng`, `sourceRoot: src/app-ng`, browser builder, `outputPath: src/ng`, `outputHashing: none`, `vendorChunk: false`, stub `index`), `frontend/tsconfig.json` / `tsconfig.app.json` / `tsconfig.spec.json` (`strict`, `strictTemplates`).
- `frontend/src/app-ng/main.ts`, `app.module.ts` (empty hybrid root module, nothing bootstrapped yet), `app.module.spec.ts`, `index.stub.html`, `karma.conf.js`.
- `frontend/.dockerignore` (`node_modules`, `src/ng`, `.angular`, `coverage`) — closes the ADR-005 open question.
- `.gitignore`: `frontend/.angular/`, `frontend/src/ng/`.
**Changed**
- `frontend/package.json`: Angular 16.2.12 runtime packages, `@angular/cli` / `build-angular` 16.2.16, `typescript` 5.1.6, `zone.js` 0.13.3, `rxjs` 7.8.1; scripts `build`, `build:dev`, `watch`, `test:ng`, `prestart` (OQ-17). `package-lock.json` regenerated.
- `frontend/.eslintrc.json`: `ignorePatterns` += `src/ng/**`, `src/app-ng/**`, `.angular/**`.
- `frontend/Dockerfile`: two-stage build (DES-SETCMP-006).
- `.github/workflows/ci.yml`: `frontend` job adds `npm run build` and `npm run test:ng`; `ui` job runs `npm run build` before starting the dev server.
- `docs/RUNBOOK.md`: `prestart`/build note, `/ng/main.js` smoke check, `test:ng` in the check line.
**Removed** — nothing.
**REQ ids (commit trailer)** — REQ-SETCMP-001, 002, 020, 021, 022, 030. *(WORK_ITEMS assigned REQ-027/028/029 to WI-01; those ids are carried by the WI-04 trailer, `41dd1e0`.)*

## WI-SETCMP-02 — Hybrid bootstrap handed to Angular `UpgradeModule` — `8e01aa6`
**Added** — nothing new on disk.
**Changed**
- `frontend/src/index.html`: `ng-app="sam"` removed from `<html>`; `ng/runtime.js`, `ng/polyfills.js`, `ng/main.js` appended after every legacy script as classic `<script>` tags (DES-SETCMP-005 specified `type="module"`; execution order is the same because they are last).
- `frontend/src/app-ng/app.module.ts`: imports `BrowserModule`, `UpgradeModule`; `ngDoBootstrap()` → `UpgradeModule.bootstrap(document.documentElement, ['sam'], { strictDi: true })` (ADR-001). No `RouterModule` (ADR-002).
- `frontend/src/app-ng/main.ts`: `platformBrowserDynamic().bootstrapModule(AppModule).catch(...)`; zone.js not imported (CLI polyfills only).
- `app.module.spec.ts`: asserts the bootstrap call shape.
**Removed** — `ng-app` attribute.
**REQ ids** — REQ-SETCMP-001, 002, 003, 023, 024.

## WI-SETCMP-03 — Comparison engine extracted to `settings-compare.logic.ts` — `649ad38`
**Added**
- `frontend/src/app-ng/settings/settings-compare.logic.ts` (250 lines; `EPSILON`, `toNumber`, `classify`, `rangeViolation`, `deltaPercent`, `severity`, `compare`, `visibleRows`, `defaultSelection`, `csvText`; DES-SETCMP-007), `settings-compare.logic.spec.ts` (TST-SETCMP-001..011), `fixtures/nth01-t1-87t.fixture.ts` (Karma-derived and seed-derived `NTH01_T1_87T` v2→v3, DES-SETCMP-025), `csv-download.ts`.
- Temporary bridge (DES-SETCMP-009): `settings-compare.global.ts` (esbuild IIFE entry → `src/ng/settings-compare.logic.js`, global `samCompareLogic`), `frontend/src/app/settings/settings-compare.logic-bridge.js` (`SettingsCompareLogic` factory), `build:logic` / `pretest` scripts, `esbuild` devDependency, Karma `files` entry, `index.html` classic script tag.
**Changed**
- `frontend/src/app/settings/settings-compare.controller.js` made thin (DES-SETCMP-010): keeps the `$scope` members its unchanged Karma spec touches, delegates to `SettingsCompareLogic`.
- `frontend/angular.json`: `deleteOutputPath: false` so `ng build` does not wipe the IIFE (temporary — reverted in WI-05).
- `tools/checks/baseline.json`: `FM-01.count` **12 → 2** (remaining: `ied-detail.controller.js`, `substations.controller.js`).
**Removed** — the comparison logic from the controller (the 10 FM-01 findings).
**REQ ids** — REQ-SETCMP-005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 018, 020, 021, 025, 026, 030.

## WI-SETCMP-04 — `SettingsCompareComponent` downgraded into state `settingsCompare` — `41dd1e0`
**Added**
- `frontend/src/app-ng/settings/settings-compare.component.ts` / `.html` / `.spec.ts` (DES-SETCMP-011; 1:1 transcription of the legacy template, every `data-test` hook preserved; TST-SETCMP-014..021), `csv-download.token.ts` (`CSV_DOWNLOAD` injection token — add-on to DES-SETCMP-011/019, see deviations).
- `frontend/src/app-ng/core/upgrade-providers.ts` (+ spec; `API_CLIENT`, `SESSION_SERVICE`, `EVENT_BUS`, `UI_ROUTER_STATE`; DES-SETCMP-012, ADR-006), `legacy-types.ts`, `sam-events.service.ts`, `legacy-event-bridge.ts` (+ spec; DES-SETCMP-017), `sam-number.pipe.ts`, `sam-date.pipe.ts` (impure, session-driven locale; DES-SETCMP-015, ADR-003).
- `frontend/src/app-ng/downgrades.ts` (`downgradeComponent` registration on the page-global `sam` module; DES-SETCMP-014).
**Changed**
- `frontend/src/app/app.routes.js`: `settingsCompare` → `template: '<sam-settings-compare></sam-settings-compare>'`; url/params/name unchanged (ADR-002).
- `frontend/src/app-ng/app.module.ts`: declares the component and pipes, imports `FormsModule`, registers `upgradedProviders`, calls `bridgeLegacyEvents` after bootstrap; `main.ts` imports `./downgrades` first.
- `frontend/src/styles/app.css`: `table.grid.compare-grid` sticky header rule (DES-SETCMP-020, UM-22).
- `frontend/package.json`: `build:dev`, `watch`, `test:watch` run `build:logic` first (temporary; removed in WI-05).
**Removed** — nothing (legacy controller/template/spec stay loadable until WI-05, DES-SETCMP-021).
**REQ ids** — REQ-SETCMP-002, 003, 004, 005, 006, 012, 013, 017, 018, 019, 022, 023, 024, 025, 026, 027, 028, 029, 031, 032, 033, 034, 035.

## WI-SETCMP-05 — Legacy retirement and parity sweep — `28cb6ae`
**Added**
- `frontend/src/app-ng/core/locale-parity.spec.ts` (TST-SETCMP-022: `SamNumberPipe`/`SamDatePipe` vs `samNumber`/`samDate` for en-GB, de-DE, fr-FR, null → `—`, `3-pole` pass-through, mid-test locale switch).
- `tests/ui/specs/04-settings-compare.spec.ts`: non-gating `performance.now()` timing annotation from `compare-go` click to `compare-table` visible (TST-SETCMP-033, DES-SETCMP-024). No `expect`, no threshold, no other gauntlet change.
**Changed**
- `tools/checks/check_null_coercion.py`: glob extended with `frontend/src/app-ng/**/*.html` (OQ-16, DES-SETCMP-019); FM-03 stays 1.
- `frontend/angular.json`: `deleteOutputPath` back to `true`; `frontend/package.json`: `build` is plain `ng build` again, `test:ng = ng test`; `frontend/karma.conf.js`: IIFE entry removed; `docs/RUNBOOK.md`: `npm run watch` + `npm start` dev loop (OQ-17).
**Removed** (REQ-SETCMP-030, REQ-SETCMP-034; DES-SETCMP-021, DES-SETCMP-009)
- `frontend/src/app/settings/settings-compare.controller.js`, `frontend/src/app/settings/settings-compare.html`, `frontend/test/unit/settings-compare.controller.spec.js`, the temporary IIFE bridge (`frontend/src/app/settings/settings-compare.logic-bridge.js`, `frontend/src/app-ng/settings/settings-compare.global.ts`, `build:logic` / `pretest` / `pretest:watch`, the `esbuild` devDependency) and the three legacy `index.html` script tags. `frontend/src/app/settings/` no longer exists.
- *The SettingsCompareController Karma spec passed unchanged through WI-04 and was retired with its controller in WI-05; its five cases are covered by TST-SETCMP-001..011 (logic) and TST-SETCMP-014..021 (component).* The remaining Karma specs (api-client, event-bus, locale.filters, sticky-header) keep running.
**REQ ids** — REQ-SETCMP-004, 013, 018, 019, 030, 033, 034, 035.

## Verification recorded on the final commit (`28cb6ae`, from the commit message and PR #1)
`ng build` OK; `npm run lint` clean; legacy Karma 9/9; `ng test` 47/47; `mvn -q -B test` green (no contract drift — `api/openapi.yaml` untouched);
FM-01 2 (baseline 2, down from 12), FM-02 0 removed / 4 added, FM-03 1 (baseline 1, extended glob); Playwright gauntlet S1–S6 6/6 twice on a fresh H2 seed.

## Gate record
| Gate | Record |
|------|--------|
| Specify | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` |
| Design | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` |
| Architect | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` (covers ADR-001…006) |
| Integrate | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` |
| Integrate — reviewers | `review_approvals 0/2 — no eligible reviewers in repo (PR author is the only collaborator, no teams); waived for dry run by Teddy Foley 2026-10-16` |
| Document | `gate: none` (this file) |
| Trace | pending (human gate) |

Decompose, Coding, QA and Document are `gate: none`. PR #1 is a draft labelled `ai-generated`, mergeable without conflicts; a human merges.

## Accepted deviations from DESIGN.md
- **TST-SETCMP-001 fixture value.** DESIGN names `0.3004` vs `0.3000` as a "changed" case, but |0.3004 − 0.3000| = 0.0004 < `EPSILON` (0.0005), so under the unchanged legacy `< EPSILON` rule it is *unchanged*. The spec asserts `0.3005` (and `0.301`) as changed instead; the rule itself is unchanged (REQ-SETCMP-009, OQ-2).
- **`CSV_DOWNLOAD` injection token** (`settings/csv-download.token.ts`, add-on to DES-SETCMP-011/019): `downloadCsv` is injected rather than imported so the component spec can observe exports (TST-SETCMP-019) without touching the DOM.
- **Temporary `deleteOutputPath: false`** in `angular.json` during WI-03/WI-04 (keeps the esbuild IIFE alive across `ng build`), reverted to `true` in WI-05 together with the IIFE.
- **Classic `<script>` tags** for `ng/*.js` in `index.html` instead of DES-SETCMP-005's `type="module"`; they are the last scripts in the document, so the ordering guarantee DES-005 relied on still holds.
- **`AppModule` imports `FormsModule`** (needed for `[(ngModel)]`/`[ngValue]` on the selects and checkbox) and the component declares `providers: [SamNumberPipe, SamDatePipe]`; neither is listed in DES-SETCMP-005/011.
- **`test:ng` is `ng test`** (Angular Karma config and polyfills come from `angular.json`) rather than the long flag form in DES-SETCMP-003; CI `frontend` job order is `build → lint → test → test:ng` (DES-SETCMP-022 listed `lint → build`).
- **WI-01 `Refs:` trailer** cites REQ-SETCMP-001/002/020/021/022/030 rather than the REQ-027/028/029 WORK_ITEMS assigned to WI-01; REQ-027/028/029 appear in the WI-04 trailer. The Trace stage should map them from `41dd1e0`.

## Follow-ups (not done in this PR)
1. **CR-2031-F1 server-side comparison endpoint** (`GET /api/settings/compare?left&right`) — rejected for this increment at the Specify gate (OQ-1); re-open with the mobile-API decision (OQ-6). Until then the IC-20 display-only exception applies (see `docs/ARCHITECTURE.md` → Known exceptions).
2. **UM-21 wording** in `standards/UI_MIGRATION_GUIDELINES.md` ("via `LOCALE_ID`") → align with ADR-003 (session-driven impure pipes, `LOCALE_ID` unused).
3. **`harness.yaml` `review.two_reviewer_paths` proposal (not applied):** add `frontend/src/app/settings/**` and `frontend/src/app-ng/settings/**`.
4. **WORK_ITEMS wording drift:** WI-02 "import zone.js in main.ts" and "18 app scripts" superseded by DESIGN/ADR-001.
5. **OQ-11:** `docs/HYBRID_SPIKE_NOTES.md` "UM-09" → "UM-03" (not a Document-stage output; one-line edit).
6. **REQ-SETCMP-033** (200-setting performance) remains unmeasurable for this increment (OQ-4); the S4 timing annotation is the non-gating indicator.
