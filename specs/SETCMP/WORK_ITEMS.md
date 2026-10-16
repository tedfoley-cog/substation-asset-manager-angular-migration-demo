# WORK ITEMS — SETCMP: Settings Comparison migration to Angular (CR-2031)
Stage: decompose
Upstream: specs/SETCMP/SPEC.md (Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16)

## How to read this file

Six ordered work items. Each one must leave the repository independently green (lint, Karma, backend tests, FM checks,
gauntlet S1–S6) so the integration branch is always demoable. Branch per item: `devin/SETCMP/<slug>`; every item
merges into the integration branch `devin/SETCMP/cr-2031-settings-compare`, which is the **one** draft PR
(label `ai-generated`). Nothing lands on `main` without a human. Decisions already taken at the Specify gate are
binding (client-side comparison, 0.0005 tolerance, banner only, no perf fixture, all roles, Angular **16**, acceptance =
S4 on `CEN01_SGT2_87T` + unit tests on the `NTH01_T1_87T` v2→v3 fixture). Points left to Design/Architect are listed at
the end and are **not** decided here.

Grounding facts from the code that shape the sequence:
- `frontend/src/index.html` has `ng-app="sam"` and loads 4 vendor + 18 app scripts; `server/dev-server.js` serves
  `frontend/src` as the static root and maps `/vendor/*` to `node_modules`; `Dockerfile` runs `npm ci --omit=dev` and
  copies `src/` + `server/` only — a build step needs devDependencies (multi-stage image).
- `karma.conf.js` loads `src/app/**/*.js` — anything emitted under `src/app/` would be picked up by Karma.
- `.eslintrc.json` is ESLint 8 + `eslint-plugin-angular` (`angular/di: array`), `lint` = `eslint src test`.
- `tools/checks/check_controller_logic.py` scans a file when it contains `.controller(`/`.component(` **or** is a `.ts`
  file containing `@Component`; patterns include `Math.abs(`, `n < Number(`, `.localeCompare(..||`, `severity(`,
  `'text/csv'`, `/PDIF|PTOC`, `/Pickup|Setting`. The 10 compare findings are lines 34–114 of
  `settings-compare.controller.js`; the other 2 (ied-detail, substations) stay. A `*.logic.ts` without `@Component` is
  never scanned; the `'text/csv'` literal must therefore leave the controller file too.
- CI `frontend` job = `npm ci && npm run lint && npm test`; `ui` job starts the backend, `npm ci` + `node server/dev-server.js`,
  then Playwright — it has no build step today.
- S4 (`tests/ui/specs/04-settings-compare.spec.ts`) asserts the hooks/texts frozen in SPEC §Gauntlet protection; S1/S3
  cross the IED-detail page that owns `compare-go`; S5 exercises viewer/auditor roles.

## Work items

### WI-SETCMP-01 — Angular 16 CLI toolchain inside `frontend/` (AOT build, one `npm run build`, lint exclusion, CI)
| | |
|---|---|
| Depends on | — |
| Satisfies | REQ-SETCMP-027, REQ-SETCMP-028, REQ-SETCMP-029 |
| Keeps green | S1–S6 (served bundle must not disturb the AngularJS app; nothing is bootstrapped by Angular yet) |
| Touches | `frontend/package.json` (+`@angular/{core,common,platform-browser,platform-browser-dynamic,upgrade,compiler,compiler-cli,cli,build-angular}@16.2.x`, `zone.js`, `rxjs`, `typescript ~5.1`, `build`/`test:ng` scripts), `package-lock.json`, `frontend/angular.json`, `frontend/tsconfig*.json`, `frontend/src/app-ng/main.ts` + `app.module.ts` (empty `NgModule`, no bootstrap yet), `frontend/.eslintrc.json` (`ignorePatterns`: `src/app-ng/**`, Angular output dir), `frontend/Dockerfile` (multi-stage: build with devDeps, run with `--omit=dev`), `.github/workflows/ci.yml` (`frontend` job: `npm run build` + Angular test runner; `ui` job: build before `dev-server.js`), `docs/RUNBOOK.md` (one line) |
| Verification | `npm run lint` green with Angular sources excluded; `npm test` (Karma) unchanged; `npm run build` emits the AOT bundle into a directory served by `dev-server.js` **outside** `src/app/` (location is OQ-14, Design); `ng test` runs an empty suite in CI; `docker compose up --build` still serves `/`; gauntlet S1–S6 |
| Branch | `devin/SETCMP/ng16-toolchain` |

Notes: Angular CLI/AOT only — the esbuild+JIT path of the spike is explicitly out (NG0202, UM-30). Node 20 in CI is
supported by Angular 16. `npm install && npm run build` must remain the single frontend build (UM-30); `npm start`
stays `node server/dev-server.js` and must serve a freshly built bundle (whether `start` triggers a build is OQ-14).

### WI-SETCMP-02 — Hybrid bootstrap: Angular owns bootstrap, AngularJS app unchanged
| | |
|---|---|
| Depends on | WI-SETCMP-01 |
| Satisfies | REQ-SETCMP-001, REQ-SETCMP-030, REQ-SETCMP-035 (strictDi part) |
| Keeps green | **S1–S6 unchanged** (bootstrap touches every screen), zero console errors |
| Touches | `frontend/src/index.html` (remove `ng-app="sam"`, load Angular bundle **after** the AngularJS scripts, keep `ng-controller="ShellController"`), `frontend/src/app-ng/main.ts` (`import 'zone.js'` once, `platformBrowserDynamic().bootstrapModule(AppModule)`), `frontend/src/app-ng/app.module.ts` (`UpgradeModule`, `ngDoBootstrap() { upgrade.bootstrap(document.documentElement, ['sam'], { strictDi: true }); }`, **no** `RouterModule`), `docs/HYBRID_SPIKE_NOTES.md` (link only) |
| Verification | gauntlet S1–S6 against H2 **and** the Compose/PostgreSQL stack; Karma unchanged (it uses `angular-mocks`, not `index.html`); `npm run lint` (`angular/di` guards strictDi); FM-01 = 12, FM-03 = 1, FM-02 clean; manual: `#!/substations` default route, user switch in top bar, no `[$injector:modulerr]`/double-bootstrap error in the console |
| Branch | `devin/SETCMP/hybrid-bootstrap` |

Notes: no `angular.bootstrap` call anywhere (UM-01). `$locationProvider.hashPrefix('!')` and ui-router keep the URL
(UM-03/04). Nothing is downgraded yet; this item exists so a bootstrap regression is isolated from the feature work.

### WI-SETCMP-03 — Extract the comparison engine to `settings-compare.logic.ts`; controller becomes a thin shell
| | |
|---|---|
| Depends on | WI-SETCMP-01, WI-SETCMP-02 |
| Satisfies | REQ-SETCMP-007, REQ-SETCMP-008, REQ-SETCMP-009, REQ-SETCMP-010, REQ-SETCMP-011, REQ-SETCMP-012 (delta text), REQ-SETCMP-013 (no coercion in logic), REQ-SETCMP-014/015/016 (visible-row filter, groups, whole-set summary), REQ-SETCMP-018 (CSV text assembly), REQ-SETCMP-020, REQ-SETCMP-021 |
| Keeps green | **S4** (screen still AngularJS, behaviour identical), S1–S6 overall |
| Touches | new `frontend/src/app-ng/settings/settings-compare.logic.ts` (pure functions: `toNumber(raw, locale)`, `classify`, `rangeViolation`, `deltaPercent`, `severity`, `compare(leftFile, rightFile)` → `{rows, summary, groups}`, `visibleRows(rows, showUnchanged, group)`, `defaultSelection(history, left, right)`, `csvLines(left, right, rows)`; `EPSILON = 0.0005`; no `@Component`, no Angular imports), new `frontend/src/app-ng/settings/settings-compare.logic.spec.ts` (fixture = the Karma `NTH01_T1_87T` v2→v3 history/files copied verbatim), `frontend/src/app/settings/settings-compare.controller.js` (keeps `$scope` API `rows/summary/selection/visibleRows()/swap()/reselect()/exportCsv()/versionLabel()/rowClass()` so `test/unit/settings-compare.controller.spec.js` passes unchanged; delegates everything else; the `text/csv` Blob/anchor download moves to a small helper outside the controller file), plus the bridge that makes the TS module reachable from the AngularJS controller (OQ-12) and the matching `karma.conf.js` `files` entry |
| Verification | `ng test`: `TST-` cases for `0.30` vs `0.3000` → `unchanged`; `0.3004` vs `0.3000` → `changed`; de-locale `1.234,5` grouping; `55 > max 50` → `exceeds maximum 50`; non-numeric/`null` bounds → no violation; severity order (violation, PDIF removed / Pickup changed, other, unchanged); summary `{changed:2, added:1, removed:1, violations:1, unchanged:1}` over **all** rows; default selection (active vs previous; none when no lower version → all `added`); `+120 %` delta and blank delta when baseline 0/non-numeric; CSV header `group,ln,setting,unit,v2,v3,kind,violation`, `-` for a missing side, quoting of inner `"`. Karma suite unchanged and green. **FM-01 drops from 12 to 2** (`run_all.py` then `--update-baseline`, lower only); FM-03 stays 1; FM-02 clean (`.finally` on load kept). Gauntlet S1–S6. |
| Branch | `devin/SETCMP/compare-logic-extract` |

Notes: `samNumber`/`samDate` formatting stays out of the logic module (it is presentation, CS-12); `deltaPercent`
returns a number or `null` and the shell formats it. Values stay strings until `toNumber` (CS-13).

### WI-SETCMP-04 — Angular `SettingsCompareComponent`, downgraded into the existing `settingsCompare` state
| | |
|---|---|
| Depends on | WI-SETCMP-02, WI-SETCMP-03 |
| Satisfies | REQ-SETCMP-002, REQ-SETCMP-003, REQ-SETCMP-004, REQ-SETCMP-005, REQ-SETCMP-006, REQ-SETCMP-007, REQ-SETCMP-012, REQ-SETCMP-013, REQ-SETCMP-014, REQ-SETCMP-015, REQ-SETCMP-016, REQ-SETCMP-017, REQ-SETCMP-018 (download + toast), REQ-SETCMP-019 (pipes), REQ-SETCMP-022, REQ-SETCMP-023, REQ-SETCMP-024, REQ-SETCMP-025, REQ-SETCMP-026, REQ-SETCMP-032, REQ-SETCMP-034, REQ-SETCMP-035 |
| Keeps green | **S4 mandatory**, S1 and S3 (IED-detail `compare-go` → state), S5 (viewer/auditor still open the screen), S2/S6 unchanged |
| Touches | new `frontend/src/app-ng/settings/settings-compare.component.ts|.html` (template transcribed 1:1 from `settings-compare.html`: same `data-test` hooks, `data-setting`/`data-kind`, `diff-cell-left/right`, `diff-row-*`, `badge-*`, legend, breadcrumb, `h1`, banner and empty-state texts; `*ngIf`/`*ngFor trackBy key`), new `frontend/src/app-ng/core/sam-number.pipe.ts`, `sam-date.pipe.ts` (locale source per OQ-8), new `frontend/src/app-ng/core/sam-events.service.ts` (RxJS `Subject`s for `sam:userChanged`/`sam:settingsUploaded`, bridged from `EventBus.subscribe` in **exactly one** place; no new `SAM_EVENTS`), new `frontend/src/app-ng/core/upgrade-providers.ts` (`ApiClient`, `SessionService`, `EventBus`, `$state` exposed once via `$injector` factory providers), `frontend/src/app-ng/app.module.ts` (declare + `entryComponents`/`downgradeComponent`), `frontend/src/app/app.routes.js` (`settingsCompare`: `template: '<sam-settings-compare></sam-settings-compare>'`, same `url`/`params`; `templateUrl`/`controller` dropped), `frontend/src/app/app.module.js` or `index.html` (register `angular.module('sam').directive('samSettingsCompare', downgradeComponent(...))` before bootstrap), `frontend/src/styles/app.css` (`position: sticky` rule for the compare table header; no restyle) |
| Verification | gauntlet S4 unchanged: URL regex, `h1`, `sum-violations` `1`→`0` after swap, first row `87T Slope 2`/`violation`/`exceeds maximum 90`/`95`, row count = changed+added+removed, grows after `show-unchanged`, de-DE `/\d,\d+/`, download `CEN01_SGT2_87T_compare.csv`; component unit tests (`ng test`): select labels `v<n> · <status> · <date>` + `— none —`, swap/reselect update `$state` params and reload, banner text and `status-down` class, `—` for null values, toast `Export — <n> rows exported`, reload on bridged events, loading cleared on API failure (error path still reaches the shell toast via `apiErrorInterceptor`); FM-01 ≤ 2, FM-03 = 1, FM-02 justified if any `.catch` moves; manual: sticky header without a cloned `data-test` row, breadcrumb links, visual parity with day zero |
| Branch | `devin/SETCMP/compare-component` |

Notes: `samStickyHeader` is **not** applied to the Angular table (UM-22). No `$rootScope` import in Angular (UM-12).
All HTTP stays on the upgraded `ApiClient` so `X-SAM-User` and the error interceptor are untouched (REQ-024);
`api/openapi.yaml` unchanged (REQ-022). The AngularJS controller/template remain in the tree (unused by the state) until
WI-05 confirms the gauntlet (REQ-034).

### WI-SETCMP-05 — Parity tests, QA sweep, legacy removal
| | |
|---|---|
| Depends on | WI-SETCMP-04 |
| Satisfies | REQ-SETCMP-013, REQ-SETCMP-019 (parity test), REQ-SETCMP-021, REQ-SETCMP-024, REQ-SETCMP-027, REQ-SETCMP-030, REQ-SETCMP-031, REQ-SETCMP-032, REQ-SETCMP-033, REQ-SETCMP-034 |
| Keeps green | S1–S6 (full run, H2 and Compose), S4 live replay |
| Touches | new `frontend/src/app-ng/core/locale-parity.spec.ts` (Angular pipes vs `samNumber`/`samDate` filter output for `de-DE` and `en-GB`: `0.30`→`0,3`/`0.3`, `1234.5`, `null`→`—`, `2024-06-10T09:00:00Z` date style), `tests/ui/specs/04-settings-compare.spec.ts` (**optional, non-gating** timing log from `compare-go` click to `compare-table` visible — console annotation only, no `expect`), `tools/checks/baseline.json` (FM-01 lowered — only if not already done in WI-03), `frontend/src/app/settings/settings-compare.controller.js` + `.html` and `frontend/test/unit/settings-compare.controller.spec.js` (removal per OQ-13; `index.html` script tag removed), `docs/RUNBOOK.md` (gauntlet/build line) |
| Verification | `npm run lint`, Karma, `ng test`, `mvn -q -B test` (audit/contract tests prove REQ-031/032: no backend change), `run_all.py --base origin/main` (FM-01 2 ≤ 12, FM-03 1, FM-02 clean), gauntlet S1–S6 twice (reset data between runs), console-error scan on S4, manual viewer (`lchen`) and auditor (`sdubois`) can open `#!/ieds/:id/settings/compare` |
| Branch | `devin/SETCMP/parity-qa` |

### WI-SETCMP-06 — Document and Trace hand-off
| | |
|---|---|
| Depends on | WI-SETCMP-05 |
| Satisfies | REQ-SETCMP-022 (F1 follow-up recorded), REQ-SETCMP-033 (unmeasurable, indicator documented); supplies the inputs the Document/Trace stages need for every other REQ |
| Keeps green | n/a (docs only) — CI still runs S1–S6 on push |
| Touches | `docs/ARCHITECTURE.md` (frontend section: hybrid bootstrap, `app-ng/`, logic module, build), `specs/SETCMP/CHANGELOG.md`, `docs/trace/SETCMP.md` (REQ → DES → commit `Refs:` → TST matrix, no orphans), `docs/HYBRID_SPIKE_NOTES.md` (UM-09 → UM-03, OQ-11), `requirements/`-side follow-up note for CR-2031-F1 (server-side endpoint deferred with OQ-1/OQ-6), `tools/checks/baseline.json` comment-free (baseline change explained in CHANGELOG) |
| Verification | manual review; Trace gate (human) |
| Branch | `devin/SETCMP/docs-trace` |

## REQ → WI coverage check

| REQ | WI | REQ | WI | REQ | WI |
|-----|----|-----|----|-----|----|
| 001 | 02 | 013 | 03, 04, 05 | 025 | 04 |
| 002 | 04 | 014 | 03, 04 | 026 | 04 |
| 003 | 04 | 015 | 03, 04 | 027 | 01, 05 |
| 004 | 04 | 016 | 03, 04 | 028 | 01 |
| 005 | 04 | 017 | 04 | 029 | 01 |
| 006 | 04 | 018 | 03, 04 | 030 | 02, 05 |
| 007 | 03, 04 | 019 | 04, 05 | 031 | 05 |
| 008 | 03 | 020 | 03 | 032 | 04, 05 |
| 009 | 03 | 021 | 03, 05 | 033 | 05, 06 |
| 010 | 03 | 022 | 04, 06 | 034 | 04, 05 |
| 011 | 03 | 023 | 04 | 035 | 02, 04 |
| 012 | 03, 04 | 024 | 04, 05 | | |

All 35 REQ-SETCMP ids are covered by at least one work item; none is withdrawn.

## Open points for Design (not decided here)

- **OQ-8 — `LOCALE_ID` source (REQ-SETCMP-019, WI-04).** `SessionService.locale()` is `'en-GB'` until `/api/me`
  resolves and changes on `sam:userChanged` without reload; `LOCALE_ID` is static. Options in SPEC (delay bootstrap /
  stateful pipes reading the upgraded `SessionService` / re-bootstrap). Must keep S4's de-DE `/\d,\d+/` assertion.
- **OQ-10 — `ui-sref` and `$state.go('.', …)` inside the downgraded component (REQ-SETCMP-003/026, WI-04).** Upgraded
  `$state` provider vs plain `#!/ieds/:id?tab=settings` hrefs; visible text and URL must not change.
- **OQ-11 — UM-09 → UM-03 cross-reference drift** in `docs/HYBRID_SPIKE_NOTES.md` (WI-06, Document stage).
- **OQ-12 (new) — How the thin AngularJS controller reaches `settings-compare.logic.ts` (WI-03).** The module lives
  in the Angular bundle; the controller runs in AngularJS and the Karma `files` list does not load that bundle. Options:
  (a) an Angular `@Injectable` wrapper downgraded with `downgradeInjectable` and registered as `SettingsCompareLogic`
  on module `sam` — Karma then needs the built bundle (or a second small UMD build of the logic) in `karma.conf.js`
  and `npm test` depends on `npm run build`; (b) a tiny `.js` factory in `src/app/settings/` that reads a global set by
  the bundle — simplest for Karma, but a global; (c) leave the controller untouched in WI-03 and let FM-01 drop only
  when WI-05 removes it — loses the "incremental FM-01 drop" step. Design decides; this file assumes (a) or (b).
- **OQ-13 (new) — When the AngularJS controller, template and Karma spec are deleted (REQ-SETCMP-030 vs 034).** 030
  says the existing Karma tests "pass unchanged"; 034 says the controller is removed after the gauntlet is green on the
  downgraded component. Proposed: keep both through WI-04, delete in WI-05 with a `Refs:` trailer and a CHANGELOG line
  ("Karma spec retired with its controller; behaviour covered by TST-SETCMP logic/component specs"). Design/Architect
  to confirm, or mark 030's Karma clause as satisfied at WI-04.
- **OQ-14 (new) — Angular build output location and `npm start` (REQ-SETCMP-028, WI-01).** `dev-server.js` serves
  `frontend/src` only; Karma globs `src/app/**/*.js`. Candidates: `frontend/src/ng/` (served as-is, must be
  git-ignored and excluded from Karma/ESLint) or a second static root in `dev-server.js`. Also whether `npm start`
  runs `ng build --watch` alongside the server, and the multi-stage `Dockerfile` shape.
- **OQ-15 (new) — `downgradeComponent` registration site (WI-04).** `angular.module('sam').directive('samSettingsCompare', downgradeComponent(…))`
  must run after the Angular bundle loads and before `UpgradeModule.bootstrap`; the bundle is loaded last in
  `index.html`, so registration inside the bundle (before `bootstrapModule`) is the natural spot — confirm, since
  `app.routes.js` references the element tag at config time only as a string.
- **ADRs due at Architect** (from SPEC §Traceability): bootstrap owner (REQ-001), routing during hybrid (REQ-002),
  locale source (REQ-019 / OQ-8), where comparison logic lives (REQ-020/022 — client-side per OQ-1, now an ADR to record).

## Gauntlet protection summary

| Scenario | What it guards for SETCMP | Protected by |
|----------|---------------------------|--------------|
| S1 estate navigation | app boots, default route, IED detail page reachable (links to compare) | WI-01, WI-02, WI-04, WI-05 |
| S2 IED inventory filtering | unrelated AngularJS screen still works after bootstrap change | WI-01, WI-02, WI-05 |
| S3 settings upload validation | IED-detail settings tab + `sam:settingsUploaded` producer (consumed by the compare bridge) | WI-02, WI-04, WI-05 |
| **S4 settings comparison** | the migrated screen: URL, hooks, violation first, counters, de-DE, swap, CSV | WI-03, **WI-04**, WI-05 (every item touching the compare screen) |
| S5 SCL import + audit | roles/permissions unchanged (viewer, auditor), audit trail unchanged | WI-02, WI-04, WI-05 |
| S6 records browser | download path + bootstrap regression catch-all | WI-01, WI-02, WI-05 |

Every push runs S1–S6 (`ui_gauntlet.mandatory_on: push`); the live finale replays S4 against the downgraded component.
