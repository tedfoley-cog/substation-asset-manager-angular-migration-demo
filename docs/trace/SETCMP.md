# Trace matrix — SETCMP (CR-2031)
Stage: trace
Feature: SETCMP
PR: #1
Branch: devin/SETCMP/cr-2031-settings-compare
Code HEAD: 93f9915 (coding HEAD 28cb6ae; branch forked from `main` at f701f90)
Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16

Every row below was checked against the branch: `git log origin/main..HEAD` (15 stage-artefact commits + 5 coding
commits + 1 documentation commit), the `Refs:` trailers of the five coding commits, the `TST-SETCMP-` tags in
`frontend/src/app-ng/**/*.spec.ts`, `frontend/test/unit/*.spec.js`, `tests/ui/specs/*.spec.ts`, `tools/checks/**`,
`.github/workflows/ci.yml`, and the measured results of the QA stage on `28cb6ae` (CI run
[38918463695](https://github.com/tedfoley-cog/substation-asset-manager-angular-migration-demo/actions/runs/38918463695), all
four jobs green; locally re-run for this matrix: `python3 tools/checks/run_all.py --base origin/main` → FM-01 2 / FM-03 1 /
FM-02 1 removed, 4 added). The Trace stage changed no application code, test, spec or PR state.

## Gate record

| Stage | Gate | Record |
|-------|------|--------|
| Specify | human | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` — `specs/SETCMP/SPEC.md` (0a86a77 → 0b3bc10 → 303a2a2; stage session [0efd33e6](https://devin-gtm.devinenterprise.com/sessions/0efd33e6811b4ac6a69bdeae3a52f96c)) |
| Decompose | none | `specs/SETCMP/WORK_ITEMS.md` (46e4148; `Reviewed-by-agent:` [025982ad](https://devin-gtm.devinenterprise.com/sessions/025982ad1a5746ddbaaf04c1948719cb)) |
| Design | human | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` — `specs/SETCMP/DESIGN.md` (1e1d67c → 33fe256 → 527d8ec; stage session [3dbff086](https://devin-gtm.devinenterprise.com/sessions/3dbff086a3fe40988502e42d42f0f7d5)); OQ-16 yes, OQ-17 prestart, `LOCALE_ID` deviation accepted |
| Architect | human | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` — ADR-001…006 (077c43c → 211e731 → 71d2670; stage session [1352d0dd](https://devin-gtm.devinenterprise.com/sessions/1352d0ddb06e412f9539ab56d098a22d)) |
| Coding | none | b07ae13 (WI-01), 8e01aa6 (WI-02), 649ad38 (WI-03), 41dd1e0 (WI-04), 28cb6ae (WI-05); `Reviewed-by-agent:` [2f3ee33f](https://devin-gtm.devinenterprise.com/sessions/2f3ee33f46aa4bd3972c817be95363d0); draft PR #1, label `ai-generated` |
| QA | none | No commit (nothing to change); results recorded in the PR #1 body — QA session [4783b411](https://devin-gtm.devinenterprise.com/sessions/4783b411b1f14a6bba418928acb942f6) |
| Integrate | human | `Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16` — PR #1 comment, `Stage: integrate`, orchestrator session [94789f20](https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb). Reviewer waiver (verbatim): `review_approvals 0/2 — no eligible reviewers in repo (PR author is the only collaborator, no teams); waived for dry run by Teddy Foley 2026-10-16` |
| Document | none | `docs/ARCHITECTURE.md`, `specs/SETCMP/CHANGELOG.md` (93f9915; `Reviewed-by-agent:` [980a4e33](https://devin-gtm.devinenterprise.com/sessions/980a4e3395cf4921b4256bf6d7294727)) |
| Trace | human | this file — **waiting** (see `## GATE`) |

## QA-stage measured results (commit 28cb6ae) used as evidence below

| Check | Result | Where |
|-------|--------|-------|
| `cd backend && mvn -q -B test` | 53 tests, 0 failures (no backend change) | CI job `backend · unit + contract + architecture tests` |
| `cd frontend && npm run lint` | 0 problems | CI job `frontend · build + lint + karma + ng test` |
| `cd frontend && npm test` (legacy Karma) | 9/9 (14/14 through WI-04; 5 `SettingsCompareController` cases retired in WI-05) | same job |
| `cd frontend && npm run test:ng` (Angular Karma) | 47/47 | same job |
| FM-01 `check_controller_logic.py` | 12 → **2** (baseline lowered to 2 in 649ad38) | CI job `failure-mode checks (FM-01..03)` |
| FM-02 `check_error_handling.py` | 1 removed (legacy controller `.finally`) / 4 added — OK, no justification line needed | same job |
| FM-03 `check_null_coercion.py` | 1 → **1** (glob extended to `frontend/src/app-ng/**/*.html` in 28cb6ae) | same job |
| Gauntlet S1–S6 (`cd tests/ui && npx playwright test`) | 6/6, twice on a fresh H2 seed; CI `ui gauntlet (Playwright)` green | CI job + Coding commit 28cb6ae message |
| S4 timing annotation (non-gating) | `compare-go → compare-table visible: 100 ms` on the CI runner (H2 seed, `CEN01_SGT2_87T` 19 settings) | `playwright-report` artifact of run 38918463695 |
| Live click-through (testing-agent recording) | hybrid boot without console errors; de-DE/en-GB/fr-FR user switch re-renders; breadcrumbs; sticky header, no cloned hooks; CSV + toast | PR #1 comment 6218258284 |

## Matrix — REQ → DES → ADR → commit → TST

Status: **Verified** = at least one automated test or CI check proves the row; **Verified-manual** = covered by the QA-stage
manual audit / testing-agent recording / PR review rather than an automated assertion; **Informational** = no gating test by
gate decision. WI = work item of the commit (b07ae13 WI-01, 8e01aa6 WI-02, 649ad38 WI-03, 41dd1e0 WI-04, 28cb6ae WI-05,
93f9915 Document).

| REQ | DES | ADR | Commit(s) (`Refs:` trailer) | TST | Verification evidence | Status |
|-----|-----|-----|-----------------------------|-----|------------------------|--------|
| REQ-SETCMP-001 | DES-005 | ADR-001 | b07ae13 WI-01, 8e01aa6 WI-02 | TST-028, TST-034 | `frontend/src/app-ng/app.module.spec.ts:7` asserts `UpgradeModule.bootstrap(document.documentElement, ['sam'], { strictDi: true })` is called once (test:ng 47/47); `index.html` has no `ng-app` (8e01aa6); gauntlet S1–S6 6/6 ×2 (TST-028); console scan on the recording — no `$injector`/strict-DI/NG0xxx errors (TST-034, PR comment 6218258284) | Verified |
| REQ-SETCMP-002 | DES-011, DES-014 | ADR-002 | b07ae13 WI-01, 8e01aa6 WI-02, 41dd1e0 WI-04 | TST-027 | `tests/ui/specs/04-settings-compare.spec.ts:18` `toHaveURL(/settings\/compare\?left=\d+&right=\d+/)` against `<sam-settings-compare>` (`app.routes.js`, 41dd1e0; `downgrades.ts`); no `RouterModule` in `app.module.ts`; gauntlet 6/6 | Verified |
| REQ-SETCMP-003 | DES-013, DES-014 | ADR-002 | 8e01aa6 WI-02, 41dd1e0 WI-04 | TST-015, TST-027 | `settings-compare.component.spec.ts:89` (`$state.go('settingsCompare', {id, left, right})` + reload) and `:111` (explicit params win); S4 `:13` `compare-go` → `:18` URL regex; `app.routes.js` url/params unchanged (41dd1e0 diff) | Verified |
| REQ-SETCMP-004 | DES-011 | — | 41dd1e0 WI-04, 28cb6ae WI-05 | TST-017, TST-027 | `settings-compare.component.spec.ts:130` renders every frozen hook, `data-setting`/`data-kind`, `diff-cell-*`, heading texts; S4 `:19–26` (`h1`, `violation-banner`, `87T Slope 2`, `exceeds maximum 90`, `.diff-cell-right` = `95`); gauntlet 6/6 | Verified |
| REQ-SETCMP-005 | DES-011, DES-015 | ADR-003 | 649ad38 WI-03, 41dd1e0 WI-04 | TST-014, TST-027 | `settings-compare.component.spec.ts:76` labels `v<n> · <status> · <samDate>` and `— none —` on the baseline only; S4 `:42–43` reselect via swap updates URL and comparison; recording: version selection + swap (PR comment 6218258284) | Verified |
| REQ-SETCMP-006 | DES-011, DES-013 | ADR-002 | 649ad38 WI-03, 41dd1e0 WI-04 | TST-015, TST-027 | `settings-compare.component.spec.ts:89` swap clears the violation (1 → 0 on the Karma fixture); S4 `:42–43` `compare-swap` → `sum-violations` `0` | Verified |
| REQ-SETCMP-007 | DES-007, DES-011 | — | 649ad38 WI-03 | TST-009 | `settings-compare.logic.spec.ts:193` `defaultSelection`: ACTIVE vs previous, null baseline when nothing lower (all `added`), explicit params win; component `:89` defaults to active vs previous | Verified |
| REQ-SETCMP-008 | DES-007, DES-025 | — | 649ad38 WI-03 | TST-003, TST-006, TST-007 | `settings-compare.logic.spec.ts:52` pairing by `settingGroup\|name` and kinds; `:120` Karma fixture rows; `:151` seed fixture 4 changed / 15 unchanged | Verified |
| REQ-SETCMP-009 | DES-007, DES-025 | — | 649ad38 WI-03 | TST-001, TST-002, TST-006, TST-007 | `settings-compare.logic.spec.ts:18` `EPSILON = 0.0005` (`0.30`/`0.3000` unchanged; `0.3005` changed — accepted deviation, see below), `:27` exact strings; `:34` `toNumber` de `1.234,5`, decimal comma; fixtures `:120`, `:151` | Verified |
| REQ-SETCMP-010 | DES-007, DES-025 | — | 649ad38 WI-03 | TST-004, TST-006, TST-027 | `settings-compare.logic.spec.ts:74` `rangeViolation` texts, null bounds/non-numeric → null, baseline never checked; `:120` `exceeds maximum 50`; S4 `:23–26` `87T Slope 2` `95` > `90` | Verified |
| REQ-SETCMP-011 | DES-007, DES-025 | — | 649ad38 WI-03 | TST-005, TST-006, TST-007 | `settings-compare.logic.spec.ts:96` severity 3/2/1/0 and sort by severity → group → name; `:135` violation first on the Karma fixture; `:159` seed-fixture order; S4 `:24` first row `data-kind="violation"` | Verified |
| REQ-SETCMP-012 | DES-007, DES-008, DES-011, DES-015 | ADR-003 | 649ad38 WI-03, 41dd1e0 WI-04 | TST-007, TST-009 | `settings-compare.logic.spec.ts:143` `+120 %` delta as a number, `:169` signed deltas; component `:130` column/badge rendering; recording shows `0,27` / `+58,3 %` (PR comment 6218258284) | Verified |
| REQ-SETCMP-013 | DES-007, DES-011, DES-019 | ADR-004 | 649ad38 WI-03, 41dd1e0 WI-04, 28cb6ae WI-05 | TST-002, TST-011, TST-018, TST-025 | `settings-compare.logic.spec.ts:43` NaN never 0, `:232` no null coercion; `settings-compare.component.spec.ts:187` `—` / blank bounds / `3-pole` verbatim; FM-03 1 → 1 with `check_null_coercion.py:35` glob now covering `app-ng/**/*.html` (CI checks job) | Verified |
| REQ-SETCMP-014 | DES-007, DES-011 | — | 649ad38 WI-03 | TST-008, TST-027 | `settings-compare.logic.spec.ts:181` unchanged hidden by default / shown when flagged; component `:167`, `:187` empty-state text; S4 `:34–36` row count grows after `show-unchanged` | Verified |
| REQ-SETCMP-015 | DES-007, DES-011 | — | 649ad38 WI-03 | TST-007, TST-008 | `settings-compare.logic.spec.ts:159` `groups` `['Group 1','Group 2']`, `:186` group filter leaves the summary alone; component `:167` group filter drives visible rows; recording: group filter | Verified |
| REQ-SETCMP-016 | DES-007, DES-011, DES-025 | — | 649ad38 WI-03 | TST-006, TST-007, TST-008, TST-027 | `settings-compare.logic.spec.ts:125` summary `{2,1,1,1,1}` over all rows, `:154` `{4,0,0,0,15}`, `:186`; S4 `:29–32` `compare-row` count = changed + added + removed | Verified |
| REQ-SETCMP-017 | DES-011 | — | 41dd1e0 WI-04 | TST-016, TST-027 | `settings-compare.component.spec.ts:117` banner text `… fall outside the permitted range …` and `status-down` only while violations > 0; S4 `:20–21`. Banner only, no activation block (OQ-3) | Verified |
| REQ-SETCMP-018 | DES-007, DES-010, DES-011 | — | 649ad38 WI-03, 41dd1e0 WI-04, 28cb6ae WI-05 | TST-010, TST-019, TST-027 | `settings-compare.logic.spec.ts:212` frozen header, `:220` `-` for a missing side + doubled quotes, `:226` raw wire strings; `settings-compare.component.spec.ts:209` `downloadCsv('<iedName>_compare.csv', …)` + toast `n rows exported` via `CSV_DOWNLOAD`; S4 `:45–47` download `CEN01_SGT2_87T_compare.csv` | Verified |
| REQ-SETCMP-019 | DES-008, DES-015, DES-016 | ADR-003 | 41dd1e0 WI-04, 28cb6ae WI-05 | TST-014, TST-022, TST-027 | `frontend/src/app-ng/core/locale-parity.spec.ts:6` (`:18`, `:25`, `:41`, `:50`, `:63`) pipe output = `samNumber`/`samDate` filter output for en-GB, de-DE, fr-FR incl. mid-test locale switch; component `:76` de-DE/en-GB labels, `:259` re-render on locale switch; S4 `:39–40` `/\d,\d+/`. `LOCALE_ID` unused per ADR-003 (accepted at the Design gate) | Verified |
| REQ-SETCMP-020 | DES-007, DES-009, DES-010, DES-023 | ADR-004 | b07ae13 WI-01, 649ad38 WI-03 | TST-001..011, TST-012, TST-024 | `settings-compare.logic.ts` has no Angular import / decorator (`git show 649ad38`); logic spec `settings-compare.logic.spec.ts:18–246` (47/47 incl. these 11 groups); FM-01 12 → 2, none in `settings-compare.component.ts` (CI checks job, `check_controller_logic.py:29` scans `@Component` files); TST-012 passed 14/14 through WI-04 (649ad38, 41dd1e0 messages) | Verified |
| REQ-SETCMP-021 | DES-009, DES-010, DES-023 | ADR-004 | b07ae13 WI-01, 649ad38 WI-03 | TST-012, TST-024 | `tools/checks/baseline.json` `FM-01.count` 12 → 2 in 649ad38; `run_all.py --base origin/main` → `FM-01: OK — 2 findings (baseline 2)` (remaining: `ied-detail.controller.js:82`, `substations.controller.js:15`, outside CR-2031); CI checks job green | Verified |
| REQ-SETCMP-022 | DES-011, DES-012 | ADR-004 | b07ae13 WI-01, 41dd1e0 WI-04 | TST-032 | `git diff --stat origin/main...HEAD -- backend api` is empty (no endpoint, `api/openapi.yaml` untouched); `OpenApiContractTest` inside mvn 53/53 (CI backend job); component fetches history + two files via the upgraded `ApiClient` (`settings-compare.component.spec.ts:247` uses `settingsHistory`). CR-2031-F1 recorded as follow-up | Verified |
| REQ-SETCMP-023 | DES-016, DES-017 | ADR-003, ADR-006 | 8e01aa6 WI-02, 41dd1e0 WI-04 | TST-020, TST-023 | `settings-compare.component.spec.ts:228` reload on `userChanged$`/`settingsUploaded$`, subscriptions released on destroy; `core/legacy-event-bridge.spec.ts:5` subscribes exactly once per event; `app.module.spec.ts:7` bridge called once with `sam:userChanged`, `sam:settingsUploaded`; `SAM_EVENTS` unchanged (no diff in `app.config.js`) | Verified |
| REQ-SETCMP-024 | DES-012, DES-018 | ADR-006 | 8e01aa6 WI-02, 41dd1e0 WI-04 | TST-021, TST-026 | `settings-compare.component.spec.ts:247` rejected `settingsHistory` → `loading` false, no throw (ApiClient is the upgraded instance, interceptors intact); FM-02 `check_error_handling.py`: 1 removed / 4 added, OK (CI checks job) | Verified |
| REQ-SETCMP-025 | DES-020 | — | 649ad38 WI-03, 41dd1e0 WI-04 | TST-027, TST-035 | `frontend/src/styles/app.css:46` `table.grid.compare-grid thead th { position: sticky; top: 56px }`; S4 `:32` exact `compare-row` count (a cloned header row would break it); recording: sticky header at 56 px, 19 hooks = 19 rows, no `samStickyHeader` on the Angular table (PR comment 6218258284) | Verified |
| REQ-SETCMP-026 | DES-011, DES-013, DES-020 | ADR-002 | 649ad38 WI-03, 41dd1e0 WI-04 | TST-017, TST-035 | `settings-compare.component.spec.ts:130` row/badge classes, legend and heading texts; styling only in `app.css` (41dd1e0 diff); breadcrumbs `#!/ieds` and `#!/ieds/9?tab=settings` and visual parity confirmed on the recording (TST-035) | Verified-manual |
| REQ-SETCMP-027 | DES-001, DES-003, DES-022 | ADR-005 | 41dd1e0 WI-04 (WORK_ITEMS assigned WI-01; see deviations) | TST-013, TST-031 | `.github/workflows/ci.yml:32` `npm test` (Karma 9/9: `frontend/test/unit/{api-client,event-bus,locale.filters,sticky-header.directive}.spec.js`) and `:35` `npm run test:ng` (47/47) in the same `frontend` job; CI green on 28cb6ae | Verified |
| REQ-SETCMP-028 | DES-001, DES-002, DES-003, DES-006 | ADR-005 | 41dd1e0 WI-04 (toolchain itself in b07ae13 WI-01; see deviations) | TST-030 | `ci.yml:28` `npm run build` and `:73` `npm run build && node server/dev-server.js` before the gauntlet (CI `ui` job green → `/ng/*.js` served from `src/`); `package.json` `build = ng build`, `prestart`; two-stage `frontend/Dockerfile` + `.dockerignore` (b07ae13). `docker compose up --build` not exercised by CI — QA-stage manual smoke of the frontend image | Verified-manual |
| REQ-SETCMP-029 | DES-001, DES-004 | ADR-005 | 41dd1e0 WI-04 (ESLint change in b07ae13 WI-01; see deviations) | TST-029 | `frontend/.eslintrc.json:94` `ignorePatterns` += `src/ng/**`, `src/app-ng/**`, `.angular/**`; `ci.yml:30` `npm run lint` → 0 problems; `angular/di` still on `src/app` | Verified |
| REQ-SETCMP-030 | DES-009, DES-010, DES-021, DES-022 | ADR-001, ADR-004 | b07ae13 WI-01, 649ad38 WI-03, 28cb6ae WI-05, 93f9915 Document | TST-012, TST-013, TST-027, TST-028 | Gauntlet specs unchanged except the S4 timing annotation (`git diff origin/main...HEAD -- tests/ui`: 4 lines in `04-settings-compare.spec.ts`); 6/6 after WI-02/03/04 and ×2 after WI-05; CI `ui` job runs on every push (`ci.yml` `on: push`). Karma clause: `SettingsCompareController` spec passed unchanged (14/14) through WI-04, retired with its controller in WI-05 per DES-021 with the agreed CHANGELOG wording; remaining Karma 9/9 | Verified |
| REQ-SETCMP-031 | DES-022 | — | 41dd1e0 WI-04 | TST-028, TST-032 | No diff under `backend/` (audit/permission tests unchanged, mvn 53/53); S5 `tests/ui/specs/05-scl-import-and-audit.spec.ts:9` (denied download → audit trail) green in CI; no `SAM_EVENTS`/audit code touched | Verified |
| REQ-SETCMP-032 | DES-022 | — | 41dd1e0 WI-04 | TST-028, TST-032, TST-036 | No `Role`/`auth/**` change (empty backend diff, mvn 53/53); S5 exercises VIEWER/AUDITOR; recording: live switch to `lchen` (VIEWER, en-GB) and `sdubois` (AUDITOR, fr-FR) on the compare screen re-renders rows (TST-036, PR comment 6218258284) | Verified-manual |
| REQ-SETCMP-033 | DES-024 | — | 41dd1e0 WI-04, 28cb6ae WI-05 | TST-033 | `tests/ui/specs/04-settings-compare.spec.ts:12–16` `performance.now()` annotation, no `expect`; measured on CI run 38918463695: `compare-go → compare-table visible: 100 ms` for the 19-setting `CEN01_SGT2_87T` file. The 200-setting target remains unmeasurable (OQ-4, no fixture) — indicator only | Informational |
| REQ-SETCMP-034 | DES-001, DES-011, DES-021 | ADR-004 | 41dd1e0 WI-04, 28cb6ae WI-05 | TST-037 | `git ls-tree -r HEAD frontend/src/app-ng`: feature code only under `settings/` (component, logic, csv-download, fixtures) and `core/` (pipes, providers, bridge, events); `frontend/src/app/settings/` no longer exists in HEAD; removal happened in WI-05 after the WI-04 gauntlet 6/6 (41dd1e0 message) | Verified-manual |
| REQ-SETCMP-035 | DES-005, DES-012, DES-017 | ADR-001, ADR-006 | 41dd1e0 WI-04, 28cb6ae WI-05 | TST-021, TST-023, TST-028, TST-029, TST-034 | `core/upgrade-providers.spec.ts:4` resolves `ApiClient`, `SessionService`, `EventBus`, `$state` from `$injector` once each; `app.module.spec.ts:7` `strictDi: true`; lint `angular/di` enforced (CI); S1–S6 6/6 boot under strictDi; console scan clean on the recording (TST-034) | Verified |

## Reverse index — TST → test → REQ

| TST | Test / coverage mechanism | Level | Measured | REQ |
|-----|---------------------------|-------|----------|-----|
| TST-SETCMP-001 | `frontend/src/app-ng/settings/settings-compare.logic.spec.ts:18` | unit (ng) | pass (47/47) | 009, 020 |
| TST-SETCMP-002 | `settings-compare.logic.spec.ts:34` | unit (ng) | pass | 009, 013, 020 |
| TST-SETCMP-003 | `settings-compare.logic.spec.ts:52` | unit (ng) | pass | 008, 020 |
| TST-SETCMP-004 | `settings-compare.logic.spec.ts:74` | unit (ng) | pass | 010, 020 |
| TST-SETCMP-005 | `settings-compare.logic.spec.ts:96` | unit (ng) | pass | 011, 020 |
| TST-SETCMP-006 | `settings-compare.logic.spec.ts:120` (Karma fixture NTH01_T1_87T v2→v3, DES-025 i) | unit (ng) | pass | 008, 009, 010, 011, 016, 020 |
| TST-SETCMP-007 | `settings-compare.logic.spec.ts:151` (seed fixture NTH01_T1_87T v2→v3, DES-025 ii) | unit (ng) | pass | 008, 009, 011, 012, 015, 016, 020 |
| TST-SETCMP-008 | `settings-compare.logic.spec.ts:179` | unit (ng) | pass | 014, 015, 016, 020 |
| TST-SETCMP-009 | `settings-compare.logic.spec.ts:193` | unit (ng) | pass | 007, 012, 020 |
| TST-SETCMP-010 | `settings-compare.logic.spec.ts:210` | unit (ng) | pass | 018, 020 |
| TST-SETCMP-011 | `settings-compare.logic.spec.ts:232` | unit (ng) | pass | 013, 020 |
| TST-SETCMP-012 | `frontend/test/unit/settings-compare.controller.spec.js` — ran unchanged through WI-04 (Karma 14/14 at 649ad38 and 41dd1e0), deleted in 28cb6ae with its controller (DES-021); no longer in HEAD | unit (Karma, historical) | pass through WI-04; retired | 020, 021, 030 |
| TST-SETCMP-013 | `frontend/test/unit/api-client.spec.js:1`, `event-bus.spec.js:1`, `locale.filters.spec.js:1`, `sticky-header.directive.spec.js:1` | unit (Karma) | 9/9 | 027, 030 |
| TST-SETCMP-014 | `frontend/src/app-ng/settings/settings-compare.component.spec.ts:76` | unit (ng) | pass | 005, 019 |
| TST-SETCMP-015 | `settings-compare.component.spec.ts:89` (+ `:111` TST-015b explicit params) | unit (ng) | pass | 003, 006 |
| TST-SETCMP-016 | `settings-compare.component.spec.ts:117` (+ `:259` TST-016b locale re-render) | unit (ng) | pass | 017 |
| TST-SETCMP-017 | `settings-compare.component.spec.ts:130` (+ `:167` TST-017b filters never touch the summary) | unit (ng) | pass | 004, 026 |
| TST-SETCMP-018 | `settings-compare.component.spec.ts:187` | unit (ng) | pass | 013 |
| TST-SETCMP-019 | `settings-compare.component.spec.ts:209` (observes the export through `csv-download.token.ts` `CSV_DOWNLOAD`) | unit (ng) | pass | 018 |
| TST-SETCMP-020 | `settings-compare.component.spec.ts:228` | unit (ng) | pass | 023 |
| TST-SETCMP-021 | `settings-compare.component.spec.ts:247` | unit (ng) | pass | 024, 035 |
| TST-SETCMP-022 | `frontend/src/app-ng/core/locale-parity.spec.ts:6` (`:18`, `:25`, `:41`, `:50`, `:63`; mirrors `test/unit/locale.filters.spec.js`) | unit (ng, parity) | pass | 019 |
| TST-SETCMP-023 | `frontend/src/app-ng/core/legacy-event-bridge.spec.ts:5`, `core/upgrade-providers.spec.ts:4` (+ `app.module.spec.ts:7`) | unit (ng) | pass | 023, 035 |
| TST-SETCMP-024 | `tools/checks/check_controller_logic.py` (ratchet, `baseline.json` FM-01 = 2) | FM / CI `checks` job | 12 → 2 | 020, 021 |
| TST-SETCMP-025 | `tools/checks/check_null_coercion.py:35` (glob incl. `frontend/src/app-ng/**/*.html`; ratchet FM-03 = 1) | FM / CI `checks` job | 1 → 1 | 013 |
| TST-SETCMP-026 | `tools/checks/check_error_handling.py` (diff vs `origin/main`) | FM / CI `checks` job | 1 removed / 4 added, OK | 024 |
| TST-SETCMP-027 | `tests/ui/specs/04-settings-compare.spec.ts:5` (assertions `:18–47`) | gauntlet S4 / CI `ui` job | pass, 6/6 ×2 | 002, 003, 004, 005, 006, 010, 014, 016, 017, 018, 019, 025, 030 |
| TST-SETCMP-028 | `tests/ui/specs/01-estate-navigation.spec.ts:5`, `02-ied-inventory-filtering.spec.ts:5`, `03-settings-upload-validation.spec.ts:5`, `05-scl-import-and-audit.spec.ts:9`, `06-records-browser.spec.ts:5` | gauntlet S1/S2/S3/S5/S6 / CI `ui` job | pass, 6/6 ×2 | 001, 030, 031, 032, 035 |
| TST-SETCMP-029 | `.github/workflows/ci.yml:30` `npm run lint` with `frontend/.eslintrc.json:94` `ignorePatterns` | lint / CI `frontend` job | 0 problems | 029, 035 |
| TST-SETCMP-030 | `.github/workflows/ci.yml:28` `npm run build`, `:73` build before `node server/dev-server.js` (served `/ng/*.js` proven by the gauntlet); Docker image: QA-stage manual smoke, not in CI | build / CI `ui` job + manual | pass; Docker manual | 028 |
| TST-SETCMP-031 | `.github/workflows/ci.yml:35` `npm run test:ng` beside `:32` `npm test` | unit (CI) / `frontend` job | 47/47 + 9/9 | 027 |
| TST-SETCMP-032 | `cd backend && mvn -q -B test` (`OpenApiContractTest`, audit/permission tests) — `.github/workflows/ci.yml:13`; branch has no `backend/` or `api/` diff | contract / CI `backend` job | 53/53 | 022, 031, 032 |
| TST-SETCMP-033 | `tests/ui/specs/04-settings-compare.spec.ts:12–16` timing annotation, no `expect` | gauntlet (informational) | 100 ms (CI run 38918463695) | 033 |
| TST-SETCMP-034 | Console scan on S1 + S4 — no automated helper on the branch; covered by the testing-agent recording in the QA stage (PR #1 comment 6218258284: no `$injector`/strict-DI/NG0xxx/unhandled-rejection errors) and by `app.module.spec.ts:7` for the strictDi call shape | manual | clean | 001, 035 |
| TST-SETCMP-035 | Visual parity with day zero — testing-agent recording (breadcrumbs `#!/ieds`, `#!/ieds/9?tab=settings`, legend, badges, sticky header at 56 px without a cloned `data-test` row); live finale pending | manual | confirmed on recording | 025, 026 |
| TST-SETCMP-036 | `lchen` (VIEWER) and `sdubois` (AUDITOR, fr-FR) open the compare screen — testing-agent recording (live user switch, rows re-render) + S5 viewer flow | manual | confirmed on recording | 032 |
| TST-SETCMP-037 | PR review of the tree: `git ls-tree -r HEAD frontend/src/app-ng` → `settings/` + `core/` only; `frontend/src/app/settings/` absent | manual (review, re-checked by Trace) | confirmed | 034 |

## Accepted deviations (recorded at the Integrate gate / Document stage; not defects)

- **TST-SETCMP-001 fixture value** — DESIGN names `0.3004` vs `0.3000` as "changed", but |0.3004 − 0.3000| = 0.0004 < `EPSILON` (0.0005), so the unchanged legacy `< EPSILON` rule classifies it *unchanged*; `settings-compare.logic.spec.ts:19` asserts `0.3005` (and `0.301`) as changed. The rule itself is unchanged (REQ-SETCMP-009, OQ-2).
- **`CSV_DOWNLOAD` injection token** (`frontend/src/app-ng/settings/csv-download.token.ts`, add-on to DES-011/019) so TST-SETCMP-019 can observe exports without DOM side effects; the default provider is the real `downloadCsv`.
- **Temporary `deleteOutputPath: false`** in `frontend/angular.json` during WI-03/WI-04 (kept the esbuild IIFE alive across `ng build`), reverted to `true` in 28cb6ae together with the IIFE, bridge factory, `build:logic`/`pretest` and the `esbuild` devDependency.
- Also recorded in `specs/SETCMP/CHANGELOG.md`: classic `<script>` tags for `ng/*.js` instead of `type="module"` (same execution order — last in the document); `FormsModule` in `AppModule`; `test:ng = ng test`; CI `frontend` job order `build → lint → test → test:ng`.
- **Trailer mapping** — REQ-SETCMP-027/028/029 were assigned to WI-01 by WORK_ITEMS but are carried by the WI-04 `Refs:` trailer (41dd1e0); the implementing changes live in b07ae13. This matrix maps them from 41dd1e0 and names b07ae13 as the implementing commit.

## Follow-ups (not done in this PR; none blocks acceptance)

1. **CR-2031-F1** server-side comparison endpoint (`GET /api/settings/compare?left&right`) — rejected for this increment at the Specify gate (OQ-1); re-open with the mobile-API decision (OQ-6). IC-20 display-only exception documented in `docs/ARCHITECTURE.md`.
2. **UM-21 wording** in `standards/UI_MIGRATION_GUIDELINES.md` ("via `LOCALE_ID`") → align with ADR-003 (session-driven impure pipes, `LOCALE_ID` unused).
3. **`harness.yaml` `review.two_reviewer_paths` proposal — not applied:** add `frontend/src/app/settings/**` and `frontend/src/app-ng/settings/**`. Out of scope for the Document and Trace stages.
4. **WORK_ITEMS wording drift** — WI-02 "import zone.js in main.ts" / "18 app scripts" superseded by DESIGN/ADR-001; WI-01 vs WI-04 REQ assignment (see deviations).
5. **OQ-11** — `docs/HYBRID_SPIKE_NOTES.md` "UM-09" → "UM-03" (one-line edit, not a stage output).
6. **REQ-SETCMP-033** — 200-setting performance stays unmeasurable (OQ-4); the S4 timing annotation is the non-gating indicator (100 ms on CI for 19 settings).
7. `tests/ui/specs/05-scl-import-and-audit.spec.ts` on `main` gained a wait (4e96bff) after this branch forked at f701f90; the branch does not carry it (PR #1 mergeable without conflicts).

## Coverage summary

| | Count |
|---|---|
| REQ-SETCMP ids in SPEC | 35 (001–035; none withdrawn) |
| REQ with ≥ 1 DES, ≥ 1 commit `Refs:` trailer and ≥ 1 TST | 35 / 35 |
| REQ **Verified** (automated test or CI check) | 30 |
| REQ **Verified-manual** (QA audit / testing-agent recording / review) | 4 — REQ-SETCMP-026, 028, 032, 034 (each is "manual" at SPEC verification level) |
| REQ **Informational** | 1 — REQ-SETCMP-033 (OQ-4) |
| DES-SETCMP ids in DESIGN | 25 (001–025), all referenced by ≥ 1 REQ row |
| TST-SETCMP ids in DESIGN | 37 (001–037): 23 automated unit specs on the branch (001–011, 013–023; TST-012 retired after passing through WI-04), 3 FM checks (024–026), 3 gauntlet (027, 028, 033), 3 CI build/lint checks (029–031), 1 backend suite (032), 4 manual (034–037) |
| ADRs | 6 (ADR-001…006), each cited by ≥ 1 REQ row |
| Orphans (REQ without DES/commit/TST, or DES/TST without REQ) | **0** |

Gaps reported honestly: (a) TST-SETCMP-034 has no automated console-scan helper on the branch — the DESIGN said "manual / Playwright
`page.on('console')` helper"; only the manual half exists (recording). (b) TST-SETCMP-030's Docker half (`docker compose up --build`
serving `/ng/main.js`) is not in CI; it rests on the QA-stage manual smoke. (c) REQ-SETCMP-033's target (200 settings < 1 s) is
unmeasured by decision (OQ-4); the recorded 100 ms is for 19 settings. (d) The live finale (`ui_gauntlet.live_finale`) has not yet
been performed; the testing-agent recording from the QA stage is the manual evidence cited above. None of these violates the
traceability rules in `docs/HARNESS_CONTRACT.md`.

## GATE

GATE: trace — status: PASSED (final acceptance). Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16. Orchestrator: https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb
