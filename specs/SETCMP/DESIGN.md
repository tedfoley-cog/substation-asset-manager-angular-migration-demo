# DESIGN — SETCMP: Settings Comparison migration to Angular (CR-2031)
Stage: design
Upstream: specs/SETCMP/SPEC.md (approved 2026-10-16), specs/SETCMP/WORK_ITEMS.md
Approved-by:

## Overview

Target state after WI-05 (Angular 16.2, AOT, one `npm run build`; ui-router untouched; one screen downgraded):

```
frontend/src/index.html (no ng-app; 4 vendor + app <script>s, then ng/runtime.js, ng/polyfills.js, ng/main.js type=module)
  └─ Angular CLI bundle (src/app-ng → src/ng/, AOT)  main.ts → downgrades.ts → bootstrapModule(AppModule)
       └─ AppModule.ngDoBootstrap(): UpgradeModule.bootstrap(document.documentElement, ['sam'], { strictDi: true })
            └─ AngularJS `sam` module (ShellController, ApiClient, SessionService, EventBus, filters, 7 legacy screens)
                 └─ ui-router state `settingsCompare`  url '/ieds/:id/settings/compare?left&right'  template '<sam-settings-compare>'
                      └─ downgraded SettingsCompareComponent (src/app-ng/settings/)  — binds, formats (SamNumberPipe/SamDatePipe), dispatches
                           ├─ settings-compare.logic.ts (pure functions: toNumber, classify, rangeViolation, deltaPercent, severity, compare, …)
                           ├─ ApiClient / SessionService / EventBus / $state  (upgraded via $injector factory providers, UM-11)
                           └─ SamEventsService (RxJS Subjects) ◄── one bridge from EventBus.subscribe('sam:userChanged' | 'sam:settingsUploaded')
```

## Design decisions

Facts below marked *(verified)* were checked in a throwaway `@angular/cli@16.2.16` workspace in `/tmp` (Angular core/upgrade 16.2.12,
TypeScript 5.1.6, `@angular-devkit/build-angular` 16.2.16, Node 24 locally / Node 20 in CI — CLI `engines.node ^16.14 || >=18.10`).

**DES-SETCMP-001 — Angular workspace lives inside `frontend/`, sources under `src/app-ng/`.** `frontend/angular.json` (project `sam-ng`,
`sourceRoot: src/app-ng`, builder `@angular-devkit/build-angular:browser`, `main: src/app-ng/main.ts`, `polyfills: ["zone.js"]`, `styles: []`,
`assets: []`), `frontend/tsconfig.json` (`strict`, `strictTemplates`, target ES2022), `tsconfig.app.json`, `tsconfig.spec.json`,
`src/app-ng/karma.conf.js` (Angular runner; the legacy `frontend/karma.conf.js` is untouched). Feature code in `src/app-ng/settings/`
mirrors `src/app/settings/` (CS-03); shared Angular-side code in `src/app-ng/core/`. Rationale: UM-10/CS-03 name the folders; one
`package.json` keeps UM-30. REQ-027, 028, 029, 034 · WI-01 · TST-029, 030, 031, 037.

**DES-SETCMP-002 — Build output is `frontend/src/ng/` (resolves OQ-14, location).** `outputPath: src/ng`, `outputHashing: none`,
`vendorChunk: false` in every configuration, `extractLicenses: false`, production budgets raised to 1 MB warn / 2 MB error. *(verified)*
the browser builder emits exactly `runtime.js`, `polyfills.js`, `main.js` (106 kB AOT prod with UpgradeModule + one component) and
requires an `index` option (string|object, `false` is rejected), so a stub `src/app-ng/index.stub.html` is configured with
`index: { input, output: "index.unused.html" }` and never served. `server/dev-server.js` already serves anything under `src/` → `/ng/*.js`
works with no server change; Docker copies `src/` (DES-006). Git-ignore `frontend/src/ng/` and `frontend/.angular/`. Karma's glob
`src/app/**/*.js`, ESLint (DES-004) and the FM globs (`frontend/src/app/**/*.js`, `frontend/src/app-ng/**/*.ts`) all miss `src/ng/`.
Rejected: a second static root in `dev-server.js` (server change for no gain); `dist/` (needs Docker/CI copy steps, breaks UM-30).
REQ-028 · WI-01 · TST-030.

**DES-SETCMP-003 — npm scripts (resolves OQ-14, `npm start`/`build`/`test`).** `build` = `ng build` (prod AOT, default configuration);
`build:dev` = `ng build --configuration development`; `watch` = `ng build --watch --configuration development`; `prestart` = `npm run build`
so `npm start` always serves a fresh bundle (≈2–5 s incremental, *(verified)* 1.6 s cold on the scratch app); `start` stays
`node server/dev-server.js` (the CI `ui` job calls the server directly and therefore gets an explicit `npm run build` step);
`test` stays the legacy Karma run; `test:ng` = `ng test --watch=false --browsers=ChromeHeadlessCI --karma-config src/app-ng/karma.conf.js`;
`pretest` = `npm run build:logic` (DES-009, WI-03..05 only). RUNBOOK gets the two-terminal dev loop (`npm run watch` + `npm start`).
REQ-027, 028 · WI-01 · TST-030, 031.

**DES-SETCMP-004 — ESLint excludes Angular sources and output.** `.eslintrc.json` `ignorePatterns: ["src/ng/**", "src/app-ng/**",
".angular/**"]`; `lint` stays `eslint src test`. Angular code is checked by `tsc --strict` + AOT `strictTemplates` during `ng build`; no
`angular-eslint` is added (dependency footprint, no rule in the standards requires it). REQ-029 · WI-01 · TST-029.

**DES-SETCMP-005 — Hybrid bootstrap sequence.** `index.html`: remove `ng-app="sam"` from `<html>`, keep `ng-controller="ShellController"`,
keep the 4 vendor + 19 app classic scripts in their current order, append `<script src="ng/runtime.js" type="module">`, `ng/polyfills.js`,
`ng/main.js` (the order the CLI writes *(verified)*; module scripts are deferred, so they run after every classic script — `angular.module('sam')`
and all states exist before anything Angular runs). `main.ts`: `import './downgrades'; platformBrowserDynamic().bootstrapModule(AppModule)
.catch(err => console.error(err))`. `AppModule`: `imports: [BrowserModule, UpgradeModule]`, `declarations: [SettingsCompareComponent]`,
`providers: upgradedProviders` (DES-012), **no** `RouterModule`, `ngDoBootstrap() { this.upgrade.bootstrap(document.documentElement, ['sam'],
{ strictDi: true }); bridgeLegacyEvents(this.upgrade.$injector, this.events); }`. zone.js is loaded once via the `polyfills` array (never
imported elsewhere). No `angular.bootstrap` call anywhere; `$locationProvider.hashPrefix('!')` and ui-router keep `#!/` URLs (UM-03/04).
strictDi failure surface: an un-annotated injectable makes `upgrade.bootstrap` throw `[$injector:strictdi]`, caught by `main.ts` → console
error, blank app → S1 fails at `api-status`; prevention is the existing ESLint `angular/di: array` rule (TST-029) and TST-034's console scan.
REQ-001, 035 · WI-02 · TST-028, 034.

**DES-SETCMP-006 — Multi-stage `frontend/Dockerfile`.** Stage `build`: `node:20-alpine`, `npm ci`, `COPY . .`, `npm run build`. Runtime stage:
`npm ci --omit=dev`, `COPY server ./server`, `COPY --from=build /app/src ./src` (bundle included). `docker-compose.yml` unchanged. REQ-028 · WI-01 · TST-030.

**DES-SETCMP-007 — `settings-compare.logic.ts` is the single comparison engine.** `frontend/src/app-ng/settings/settings-compare.logic.ts`,
no imports, no decorators, exports:
`EPSILON = 0.0005`; types `SettingValue {settingGroup, lnClass, name, value: string|null, unit, minValue, maxValue}`, `SettingsFile`,
`HistoryEntry`, `Kind = 'changed'|'added'|'removed'|'unchanged'`, `CompareRow {key, settingGroup, lnClass, name, unit, minValue, maxValue,
left?, right?, kind, violation: string|null, deltaPercent: number|null, severity: 0|1|2|3}`, `Summary`;
`toNumber(raw, locale): number` (NaN for null/''/non-numeric; `de*` locale accepts `1.234,5`; every locale accepts a decimal comma — the
controller's lines 21–28 verbatim); `classify(left, right, locale)`; `rangeViolation(v, locale)` → `'below minimum <min>' | 'exceeds maximum <max>' | null`;
`deltaPercent(left, right, locale): number|null` (null when either side is non-numeric or baseline is 0); `severity(row)`;
`compare(left: SettingsFile|null, right: SettingsFile|null, locale) → {rows, summary, groups}` (pair key `settingGroup|name`, sort severity
desc → group → name, summary over all rows, distinct sorted groups); `visibleRows(rows, showUnchanged, group)`; `defaultSelection(history,
left?, right?) → {left: number|null, right: number|null}` (ACTIVE else newest; previous = first entry with lower `versionNo`); `csvText(left, right,
rows): string` (header `group,ln,setting,unit,v<l>|-,v<r>|-,kind,violation`, every cell quoted, inner `"` doubled, raw string values, `''`
for a missing side). Rationale: UM-10/CS-02/CS-13 — parse only at comparison, never in templates; pure functions are testable without
Angular. REQ-007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 018, 020 · WI-03 · TST-001..011, 024.

**DES-SETCMP-008 — Presentation stays out of the logic module.** `deltaPercent` is a number; the caller renders
`(pct > 0 ? '+' : '') + samNumber(pct, 1) + ' %'` (controller in WI-03, component in WI-04). Values are formatted with `samNumber` only in
templates (CS-12); CSV uses raw wire strings (CS-13). REQ-012, 019 · WI-03, WI-04 · TST-009, 014.

**DES-SETCMP-009 — How the thin AngularJS controller reaches the TypeScript module (resolves OQ-12): temporary IIFE side-build.**
Entry `src/app-ng/settings/settings-compare.global.ts` (re-exports `settings-compare.logic.ts` + `csv-download.ts`) is bundled by
`esbuild --bundle --format=iife --global-name=samCompareLogic --target=es2017 --outfile=src/ng/settings-compare.logic.js` (`build:logic`;
`esbuild` is pinned as an explicit devDependency at the version build-angular 16.2 already ships, 0.18.x *(verified: `esbuild-wasm` is a hard
dependency, native `esbuild` optional)*; no decorators are involved, so the NG0202 problem of the spike does not apply). `build` runs
`build:logic` first; `pretest` runs it for Karma. Bridge: `src/app/settings/settings-compare.logic-bridge.js` —
`factory('SettingsCompareLogic', ['$window', function ($window) { return $window.samCompareLogic; }])` (lazy read, so load order is irrelevant).
`karma.conf.js` adds `src/ng/settings-compare.logic.js` to `files`; `index.html` loads it as a classic script after the app scripts. The
IIFE, bridge and `pretest` are deleted in WI-05 with the controller (DES-021). Rejected: (a) `downgradeInjectable` of an Angular service —
needs a bootstrapped Angular injector inside the legacy Karma run and the full bundle in `files`, where `bootstrapModule` would fight
`angular-mocks`; (c) leave the controller fat until WI-05 — loses the isolated FM-01 drop that proves WI-03; `tsc --module umd` — tsc's UMD
wrapper has no global fallback and `angular-mocks` defines `window.module` as a function, so it would silently register nothing.
REQ-020, 021, 030 · WI-03 · TST-012, 024.

**DES-SETCMP-010 — Thin controller shape in WI-03.** `SettingsCompareController` keeps every `$scope` member the Karma spec touches
(`loading, history, left, right, rows, summary, selection, showUnchanged, groupFilter, groups, visibleRows(), swap(), reselect(), exportCsv(),
versionLabel(), rowClass()`) and `load()`, but delegates to `SettingsCompareLogic.compare/visibleRows/defaultSelection/csvText/downloadCsv`;
it maps `row.delta` from `deltaPercent` (DES-008). The file must contain none of the FM-01 patterns (`Math.abs(`, `n < Number(`,
`.localeCompare(…||`, `severity(`/`.severity =`, `'text/csv'`, `/PDIF|PTOC`, `/Pickup|Setting`); the Blob/anchor download with the
`text/csv` literal lives in `src/app-ng/settings/csv-download.ts` (`downloadCsv(filename, text)`), which is not a `@Component` file.
REQ-020, 021, 030 · WI-03 · TST-012, 024.

**DES-SETCMP-011 — `SettingsCompareComponent`.** `selector: 'sam-settings-compare'`, no `@Input`s (reads `$state.params.id/left/right`),
`templateUrl: './settings-compare.component.html'`, no component styles (UM-23). State: `loading, history, left, right, rows, summary, groups,
selection, showUnchanged, groupFilter, iedName`. Methods: `load(override?)` (same promise chain as the controller, via upgraded `ApiClient`),
`reselect()`, `swap()`, `visibleRows()`, `rowClass(r)`, `kindBadge(r)`, `versionLabel(h)`, `delta(r)`, `exportCsv()` (`csvText` → `downloadCsv`
→ `EventBus.toast('info', 'Export', n + ' rows exported')`), `breadcrumbHref()`. Template is a 1:1 transcription of
`settings-compare.html`: identical element order, texts (`h1`, subtitle, legend, banner, empty state), `data-test`/`data-setting`/`data-kind`
attributes, `diff-cell-left/right`, `diff-row-*`, `badge-*`, `status-down`, `<select>` with `[ngValue]` + `(change)` and the
`<option [ngValue]="null">— none —</option>`, `*ngFor="let r of visibleRows(); trackBy: key"`. REQ-002, 004, 005, 006, 007, 012, 013, 014,
015, 016, 017, 018, 022, 026, 034 · WI-04 · TST-014..021, 027.

**DES-SETCMP-012 — Upgraded providers, declared once.** `src/app-ng/core/upgrade-providers.ts`: `InjectionToken`s `API_CLIENT`,
`SESSION_SERVICE`, `EVENT_BUS`, `UI_ROUTER_STATE` with `useFactory: (i) => i.get('ApiClient' | 'SessionService' | 'EventBus' | '$state'),
deps: ['$injector']`, exported as `upgradedProviders` and registered only in `AppModule`. No AngularJS service is reimplemented in Angular
(UM-11); nothing is `downgradeInjectable`d (no AngularJS consumer of Angular services exists in this increment). All HTTP therefore still
passes `userHeaderInterceptor`/`apiErrorInterceptor` (REQ-024). REQ-022, 024, 035 · WI-04 · TST-021, 023, 028.

**DES-SETCMP-013 — Navigation inside the downgraded component (resolves OQ-10).** Breadcrumb anchors bind `[href]="$state.href('ieds')"` and
`[href]="$state.href('iedDetail', { id: iedId, tab: 'settings' })"` (ui-router computes `#!/ieds/7?tab=settings`, so the URL scheme is not
hard-coded); no `ui-sref` in an Angular template. Reselect/swap call `$state.go('settingsCompare', { id, left, right })` — the explicit name
replaces `'.'`; because `left/right` are `dynamic: true` the state is not re-entered, so the component calls `load({left, right})` itself,
exactly as the controller does. Visible text and URL unchanged (UM-20). REQ-003, 006, 026 · WI-04 · TST-015, 027.

**DES-SETCMP-014 — `downgradeComponent` registration site (resolves OQ-15).** `src/app-ng/downgrades.ts`:
`angular.module('sam').directive('samSettingsCompare', downgradeComponent({ component: SettingsCompareComponent }))`, imported first by
`main.ts`, i.e. after the deferred module script starts (all classic scripts done, `sam` exists) and before `bootstrapModule`. `angular` is the
global from `vendor/angular/angular.js` (`declare const angular`, `@types/angular` dev-only) — AngularJS is not bundled twice.
`app.routes.js` changes only the `settingsCompare` entry to `template: '<sam-settings-compare></sam-settings-compare>'` (url/params kept).
REQ-002, 003 · WI-04 · TST-027, 028.

**DES-SETCMP-015 — Locale source (resolves OQ-8 at design level; Architect records the ADR).** Recommended **(b)**: `SamNumberPipe` and
`SamDatePipe` in `src/app-ng/core/` (`pure: false`), each a line-for-line port of the `samNumber`/`samDate` filters (same `Intl.NumberFormat`
/`Intl.DateTimeFormat` options, `—` for null/''/undefined, string pass-through for non-numeric such as `3-pole`, formatter cache keyed
`locale|style`), reading `SessionService.locale()` (upgraded, DES-012) on every evaluation. `LOCALE_ID` keeps Angular's default and is not read
by any code path; this satisfies the intent of UM-21 (exact parity, proven by TST-022) while deviating from its letter — the ADR must say so.
Rejected: (a) delay `ngDoBootstrap` until `/api/me` — `SessionService.load()` is called by `ShellController` *after* bootstrap, so it would need
a second fetch, slows first paint and still cannot follow a user switch; (c) re-bootstrap on `sam:userChanged` — destroys the AngularJS app
and every open screen; (d) `DecimalPipe`/`DatePipe` + `registerLocaleData` — needs locale data for `en-GB`, `de-DE` **and** `fr-FR`
(`sdubois` in `V2__reference_data.sql`), `DatePipe` presets (`shortDate` de = `10.06.24`, `mediumDate` en-GB = `10 Jun 2024`) do not match the
filters' `02.06.2024`/`02/06/2024`, and `DecimalPipe` throws NG02100 on `3-pole`. REQ-005, 012, 019 · WI-04, WI-05 · TST-014, 022, 027.

**DES-SETCMP-016 — Re-render on user switch without reload.** Impure pipes re-evaluate on every change detection; the bridged
`userChanged$` (DES-017) triggers `load()`; `ShellController.switchUser` additionally calls `$state.reload()`, which re-creates the downgraded
component. Change detection runs because `UpgradeModule` runs AngularJS inside `NgZone` ($q callbacks and bus events are zone-tracked).
S4's de-DE `/\d,\d+/` assertion on `87T Pickup` therefore holds even if `/api/me` resolves after the first paint. REQ-019, 023 · WI-04 · TST-020, 027.

**DES-SETCMP-017 — One RxJS bridge for the two legacy events (UM-12).** `src/app-ng/core/sam-events.service.ts`:
`@Injectable({ providedIn: 'root' }) SamEventsService { userChanged$ = new Subject<User>(); settingsUploaded$ = new Subject<unknown>(); }`.
`src/app-ng/core/legacy-event-bridge.ts`: `bridgeLegacyEvents($injector, events)` subscribes once via `EventBus.subscribe(EventBus.EVENTS.USER_CHANGED
| SETTINGS_UPLOADED, payload => subject.next(payload))`, called only from `ngDoBootstrap` (DES-005). The component subscribes with `takeUntil(destroy$)`.
No `$rootScope` import in `src/app-ng/**`; `SAM_EVENTS` unchanged (CS-04). REQ-023, 035 · WI-04 · TST-020, 023.

**DES-SETCMP-018 — Error-path parity (FM-02).** `load()` keeps the controller's chain: history → files → compare, `.catch(() => { /* surfaced by
apiErrorInterceptor → sam:apiError → shell toast */ })` (new; also removes AngularJS's "possibly unhandled rejection" console error on failure,
which TST-034 scans for) and `.finally(() => this.loading = false)`. Deleting the controller in WI-05 removes one `finally` line and the
component adds `catch` + `finally`, so FM-02's net count is ≤ 0 — no `Error-handling-removed:` line is expected; if one becomes necessary it
goes in the integration PR body. REQ-024 · WI-04, WI-05 · TST-021, 026.

**DES-SETCMP-019 — Null handling (FM-03).** Template keeps `r.left ? (r.left.value | samNumber) : '—'`, `r.minValue !== null ? … : ''`;
logic returns `null`/`NaN`, never `0`/`''`; no `|| 0`, `|| ''`, `?? 0` on API fields. Gap found: `check_null_coercion.py` scans
`frontend/src/app/**/*.html` and `frontend/src/app-ng/**/*.ts` but **not** `frontend/src/app-ng/**/*.html`; WI-05 adds that glob (count stays 1 —
see Open questions). REQ-013 · WI-03, WI-04, WI-05 · TST-011, 018, 025.

**DES-SETCMP-020 — Sticky header by CSS (UM-22).** `app.css` gains `table.grid.compare-grid { overflow: visible } table.grid.compare-grid thead th
{ position: sticky; top: 56px; z-index: 10 }` (the top bar is 56 px sticky; `table.grid` currently sets `overflow: hidden`, which would make the
table its own scroll container and defeat `position: sticky`). The Angular table has class `grid compare-grid`, no `sam-sticky-header`, so no
shadow clone and no duplicated `data-test` rows. No other style changes (UM-23). REQ-025, 026 · WI-04 · TST-027, 035.

**DES-SETCMP-021 — Lifecycle of the legacy controller/template/spec (resolves OQ-13).** Keep `settings-compare.controller.js`,
`settings-compare.html`, the `index.html` script tag and `test/unit/settings-compare.controller.spec.js` through WI-04 (the state no longer
references them, but they stay loadable so REQ-030's "pass unchanged" holds literally while the gauntlet is proven on the component). WI-05
deletes all four plus the bridge/IIFE/`pretest` of DES-009, with commit trailer `Refs: REQ-SETCMP-030, REQ-SETCMP-034` and this CHANGELOG
wording for REQ-030's Karma clause: *"The SettingsCompareController Karma spec passed unchanged through WI-04 and was retired with its
controller in WI-05; its five cases are covered by TST-SETCMP-001..011 (logic) and TST-SETCMP-014..021 (component)."* The remaining Karma
specs (api-client, event-bus, locale.filters, sticky-header) keep running (UM-31). REQ-030, 034 · WI-04, WI-05 · TST-012, 013, 037.

**DES-SETCMP-022 — Test strategy and CI.** Runners: legacy Karma (`npm test`, ChromeHeadlessCI), Angular Karma (`npm run test:ng`, same
`ChromeHeadlessCI` launcher with `--no-sandbox`, `jasmine-core` stays the repo's 5.1.2, `@types/jasmine` 5.x), backend `mvn -q -B test`
(unchanged — proves REQ-022/031/032 by absence of change), FM checks, Playwright S1–S6 on every push. `ci.yml`: `frontend` job becomes
`npm ci → npm run lint → npm run build → npm test → npm run test:ng`; `ui` job adds `npm run build` before `node server/dev-server.js`; `checks`
and `backend` unchanged. REQ-027, 030, 031, 032 · WI-01, WI-05 · TST-028, 031, 032.

**DES-SETCMP-023 — FM-01 expectations (from `check_controller_logic.py`).** Day zero: 12 = 10 in `settings-compare.controller.js`
(lines 34, 42, 43, 50, 54, 56, 57, 72, 75, 114) + `ied-detail.controller.js:82` + `substations.controller.js:15`. After WI-03: **2** (the
thin controller matches no pattern — DES-010); baseline lowered to 2 with `--update-baseline` in WI-03. After WI-04/05: **2** — the
component `.ts` is scanned (`@Component` present) and must not contain `.severity =`, `severity(`, `'text/csv'` or the regexes; it reads
`r.severity` and calls logic functions only. `*.logic.ts`, `csv-download.ts`, pipes and services are not scanned (no `@Component`); specs
are excluded by `common.files`. REQ-020, 021 · WI-03, WI-05 · TST-024.

**DES-SETCMP-024 — Non-gating timing indicator (OQ-4).** S4 records `performance.now()` around `compare-go` click → `compare-table` visible and
attaches it as `test.info().annotations.push({ type: 'timing', description: … })`; no `expect`, no threshold, no fixture. REQ-033 · WI-05 · TST-033.

**DES-SETCMP-025 — Acceptance fixtures (OQ-9).** (i) The Karma synthetic `NTH01_T1_87T` v2→v3 fixture (ids 11/12, 4 + 4 values) is copied
verbatim into `settings-compare.logic.spec.ts`: expected rows `87T Slope 1` changed + `exceeds maximum 50` (severity 3), `Trip Mode` changed (1),
`5th Harmonic Block` removed PDIF (2), `51P Pickup` added (1), `87T Pickup` unchanged (0); summary `{changed:2, added:1, removed:1,
violations:1, unchanged:1}`; `87T Slope 1` delta `+120`. (ii) A seed-derived fixture from `V4__settings_history.sql` (`NTH01_T1_87T_v002.rsf`
→ `_v003.rsf`, 19 values each, see Parity test plan). (iii) Gauntlet S4 on `CEN01_SGT2_87T` v2→v3 (`87T Slope 2` 95 > 90) unchanged.
REQ-008, 009, 010, 011, 016 · WI-03, WI-05 · TST-006, 027.

## Sequence

| Step | WI | Does | Green check before the next step |
|------|----|------|----------------------------------|
| 1 | WI-01 | DES-001/002/003/004/006 + empty `AppModule` (no bootstrap, no `ng-app` change), `ci.yml` build steps, `.gitignore` | `npm run lint`, `npm test` (unchanged), `npm run build` emits `src/ng/{runtime,polyfills,main}.js`, `npm run test:ng` (empty suite), `docker compose up --build` serves `/`, S1–S6 |
| 2 | WI-02 | DES-005 (remove `ng-app`, module scripts, `ngDoBootstrap` with strictDi), `upgradedProviders` scaffold | S1–S6 on H2 **and** Compose, TST-034 console scan clean, FM-01 = 12 / FM-03 = 1 / FM-02 OK, Karma unchanged |
| 3 | WI-03 | DES-007/008/009/010/025 — logic module + spec, IIFE bridge, thin controller, baseline → 2 | `npm run test:ng` TST-001..011 green, `npm test` TST-012 unchanged, FM-01 = 2 (baseline updated), S4 + S1–S6 |
| 4 | WI-04 | DES-011..020 — component, pipes, bridge, downgrade, route template, CSS | TST-014..021, 023 green; S4 unchanged (TST-027), S1/S3/S5 (TST-028); FM-01 ≤ 2, FM-03 = 1, FM-02 OK; TST-035 manual |
| 5 | WI-05 | DES-021/022/024 + TST-022 parity, FM-03 glob (DES-019), legacy removal, timing annotation | all runners + FM + S1–S6 twice (reset data), TST-032 backend, TST-036 roles, console scan |
| 6 | WI-06 | ARCHITECTURE/CHANGELOG/trace, OQ-11 fix, F1 follow-up note | manual review; Trace gate |

## Parity test plan

| TST | What | Where | Level | REQs |
|-----|------|-------|-------|------|
| TST-SETCMP-001 | `0.30` vs `0.3000` → unchanged; `0.3004` vs `0.3000` → changed; non-numeric exact-string compare | `src/app-ng/settings/settings-compare.logic.spec.ts` | unit (ng) | 009 |
| TST-SETCMP-002 | `toNumber`: de locale `1.234,5` → 1234.5; en `1,5` → 1.5; `''`/null → NaN; `3-pole` → NaN | same | unit (ng) | 009, 013 |
| TST-SETCMP-003 | pairing by `settingGroup|name`; added / removed / changed / unchanged kinds | same | unit (ng) | 008 |
| TST-SETCMP-004 | `rangeViolation`: `55` > max `50` → `exceeds maximum 50`; below min text; null bounds / non-numeric → null; left side never checked | same | unit (ng) | 010 |
| TST-SETCMP-005 | severity 3 → 2 (PDIF removed, `Pickup`/`Slope` changed) → 1 → 0, then group, then name | same | unit (ng) | 011 |
| TST-SETCMP-006 | Karma-fixture NTH01 v2→v3 (DES-025 i): rows, kinds, violation, summary `{2,1,1,1,1}`, `87T Slope 1` first | same | unit (ng) | 008, 009, 010, 011, 016 |
| TST-SETCMP-007 | seed NTH01 v2→v3 (DES-025 ii): summary `{changed:4, added:0, removed:0, violations:0, unchanged:15}`; order `Group 1 · 50P Pickup` (9.97→8.55, sev 2), `Group 2 · 87T Slope 1` (35→30, sev 2), `Group 1 · 2nd Harmonic Block` (16→17, sev 1), `Group 1 · Post-fault Window` (725→750, sev 1), then 15 unchanged; groups `['Group 1','Group 2']`; `deltaPercent` ≈ −14.24, −14.29, +6.25, +3.45 | same | unit (ng) | 008, 009, 011, 012, 015, 016 |
| TST-SETCMP-008 | `visibleRows`: unchanged hidden by default (4 of 5), shown when flagged, group filter `Group 2` → `['51P Pickup']`; summary unaffected | same | unit (ng) | 014, 015, 016 |
| TST-SETCMP-009 | `defaultSelection`: ACTIVE vs previous → `{left: 11, right: 12}`; no lower version → `left: null`, all rows `added`; explicit params win | same | unit (ng) | 007 |
| TST-SETCMP-010 | `csvText`: header `group,ln,setting,unit,v2,v3,kind,violation`; `-` for a missing side; quoting of inner `"`; only visible rows | same | unit (ng) | 018 |
| TST-SETCMP-011 | no coercion: null value → `kind` computed from strings, `deltaPercent` null, violation null; `minValue` null never becomes 0 | same | unit (ng) | 013 |
| TST-SETCMP-012 | legacy `SettingsCompareController` spec passes unchanged through WI-04 (5 cases) | `frontend/test/unit/settings-compare.controller.spec.js` | unit (Karma) | 030, 020, 021 |
| TST-SETCMP-013 | remaining Karma specs (api-client, event-bus, locale.filters, sticky-header) stay green after WI-05 | `frontend/test/unit/*.spec.js` | unit (Karma) | 027, 030 |
| TST-SETCMP-014 | select labels `v3 · active · 10.06.2024` (de-DE) / `v3 · active · 10/06/2024` (en-GB); `— none —` option present on baseline only | `src/app-ng/settings/settings-compare.component.spec.ts` | unit (ng) | 005, 019 |
| TST-SETCMP-015 | `swap()`/`reselect()` call `$state.go('settingsCompare', {id, left, right})` and reload; swapping makes `summary.violations` 1 → 0 on the Karma fixture | same | unit (ng) | 003, 006 |
| TST-SETCMP-016 | banner `1 setting(s) in v3 fall outside the permitted range. …` present iff violations > 0; `status-down` on `sum-violations` | same | unit (ng) | 017 |
| TST-SETCMP-017 | every frozen hook present: `compare-summary, sum-changed, sum-added, sum-removed, sum-violations, compare-left, compare-swap, compare-right, compare-group, show-unchanged, export-csv, violation-banner, compare-table, compare-row` + `data-setting`/`data-kind`, `diff-cell-left/right`, `diff-row-*`, `badge-*`, header texts | same | unit (ng) | 004, 026 |
| TST-SETCMP-018 | `—` for missing side / `''` for missing bounds; `3-pole` rendered verbatim | same | unit (ng) | 013 |
| TST-SETCMP-019 | `exportCsv()` → `downloadCsv('NTH01_T1_87T_compare.csv', …)` and `EventBus.toast('info','Export','4 rows exported')` | same | unit (ng) | 018 |
| TST-SETCMP-020 | `userChanged$`/`settingsUploaded$` emissions call `load()`; subscription released on destroy | same | unit (ng) | 023 |
| TST-SETCMP-021 | `ApiClient.settingsHistory` rejection → `loading` false, rows unchanged, no throw; interceptor path untouched (ApiClient is the upgraded instance) | same | unit (ng) | 024, 035 |
| TST-SETCMP-022 | `SamNumberPipe`/`SamDatePipe` vs `samNumber`/`samDate` filter output for `de-DE` and `en-GB`: `0.30`→`0,3`/`0.3`; `1234.5`→`1.234,5`/`1,234.5`; `(pct,1)`; null→`—`; `3-pole`; `2024-06-02T19:30:11Z` date → `02.06.2024`/`02/06/2024`; locale switch mid-test re-renders | `src/app-ng/core/locale-parity.spec.ts` (filter expectations mirror `test/unit/locale.filters.spec.js`) | unit (ng, parity) | 019 |
| TST-SETCMP-023 | `bridgeLegacyEvents` subscribes exactly once per event and forwards payloads; `upgradedProviders` resolve `ApiClient`, `SessionService`, `EventBus`, `$state` from `$injector` | `src/app-ng/core/legacy-event-bridge.spec.ts`, `upgrade-providers.spec.ts` | unit (ng) | 023, 035 |
| TST-SETCMP-024 | FM-01 ratchet: 12 → 2 after WI-03, ≤ 2 thereafter; none in `*.component.ts` | `tools/checks/check_controller_logic.py` | FM | 020, 021 |
| TST-SETCMP-025 | FM-03 ratchet stays 1 (glob extended to `app-ng/**/*.html` in WI-05) | `tools/checks/check_null_coercion.py` | FM | 013 |
| TST-SETCMP-026 | FM-02 diff: no net removed handler vs `origin/main` | `tools/checks/check_error_handling.py` | FM | 024 |
| TST-SETCMP-027 | gauntlet S4 unchanged on `CEN01_SGT2_87T` (URL regex, `h1`, `sum-violations` 1→0, first row `87T Slope 2`/`violation`/`exceeds maximum 90`/`95`, row count, show-unchanged growth, de-DE `/\d,\d+/`, `CEN01_SGT2_87T_compare.csv`) | `tests/ui/specs/04-settings-compare.spec.ts` | gauntlet | 002, 003, 004, 005, 006, 010, 014, 016, 017, 018, 019, 025, 030 |
| TST-SETCMP-028 | gauntlet S1, S2, S3, S5, S6 unchanged (bootstrap, roles, upload event producer) | `tests/ui/specs/*.spec.ts` | gauntlet | 001, 030, 031, 032, 035 |
| TST-SETCMP-029 | `npm run lint` green with `src/ng/**`, `src/app-ng/**` ignored; `angular/di` still enforced on `src/app` | CI `frontend` job | lint | 029, 035 |
| TST-SETCMP-030 | `npm run build` emits `src/ng/{runtime,polyfills,main}.js`; `npm start` serves them; `docker compose up --build` serves `/` and `/ng/main.js` | CI `ui` job + manual | build | 028 |
| TST-SETCMP-031 | `npm run test:ng` runs in CI on ChromeHeadless alongside `npm test` | CI `frontend` job | unit (CI) | 027 |
| TST-SETCMP-032 | `mvn -q -B test` unchanged: `OpenApiContractTest` (no contract drift), audit/permission tests (no new DENIED, no Role change) | `backend/` | contract | 022, 031, 032 |
| TST-SETCMP-033 | S4 timing annotation `compare-go` → `compare-table` visible (non-gating) | `tests/ui/specs/04-settings-compare.spec.ts` | gauntlet (informational) | 033 |
| TST-SETCMP-034 | console scan on S1 + S4: no `[$injector:modulerr]`, `[$injector:strictdi]`, NG0xxx, "possibly unhandled rejection" | manual / Playwright `page.on('console')` helper | manual | 001, 035 |
| TST-SETCMP-035 | visual parity with day zero: breadcrumb links land on `#!/ieds` and `#!/ieds/:id?tab=settings`, legend, badges, sticky header without a cloned `data-test` row | live finale | manual | 025, 026 |
| TST-SETCMP-036 | `lchen` (VIEWER) and `sdubois` (AUDITOR, fr-FR) open `#!/ieds/:id/settings/compare` and see rows | manual | manual | 032 |
| TST-SETCMP-037 | review: feature code only under `src/app-ng/settings/` + `src/app-ng/core/`; legacy files gone after WI-05 | PR review | manual | 034 |

## Resolved open points

| OQ | Resolution |
|----|------------|
| OQ-8 | DES-015/016: impure `SamNumberPipe`/`SamDatePipe` over `Intl`, locale read from the upgraded `SessionService` per evaluation; `LOCALE_ID` unused. Architect records the ADR (deviation from UM-21's "via `LOCALE_ID`" wording, same output). |
| OQ-10 | DES-013: `$state.href(...)` for breadcrumb hrefs, `$state.go('settingsCompare', …)` + self-`load()` for reselect; no `ui-sref` in Angular. |
| OQ-11 | Handed to Document (WI-06): `docs/HYBRID_SPIKE_NOTES.md` "UM-09" → "UM-03". |
| OQ-12 | DES-009/010: temporary esbuild IIFE of the logic module (`src/ng/settings-compare.logic.js`, global `samCompareLogic`) + `SettingsCompareLogic` bridge factory; Karma loads the IIFE via `pretest`; removed in WI-05. |
| OQ-13 | DES-021: keep controller/template/spec through WI-04, delete in WI-05 with the quoted CHANGELOG wording for REQ-030's Karma clause. |
| OQ-14 | DES-002/003/006: output `frontend/src/ng/` (git-ignored, served as-is), `outputHashing: none`, stub index; `build` = `ng build`, `prestart` builds, `test:ng` added, CI gets explicit build steps, multi-stage Dockerfile. |
| OQ-15 | DES-014: registration in `src/app-ng/downgrades.ts`, imported by `main.ts` before `bootstrapModule`; deferred module script guarantees `sam` exists. |

## Open questions

- **OQ-16 — Extending `tools/checks/check_null_coercion.py` to `frontend/src/app-ng/**/*.html` (DES-019).** It changes the harness's own check
  (count stays 1 today). Approve as part of WI-05, or keep the checks frozen and accept that Angular templates are reviewed by hand for FM-03?
- **OQ-17 — `prestart` build on every `npm start` (DES-003).** Adds a few seconds to every start; the alternative is documenting "run
  `npm run build` first" and leaving `start` untouched. Design recommends `prestart`; confirm.

## Traceability

| REQ | DES | TST | | REQ | DES | TST |
|-----|-----|-----|-|-----|-----|-----|
| 001 | 005 | 028, 034 | | 019 | 008, 015, 016 | 014, 022, 027 |
| 002 | 011, 014 | 027 | | 020 | 007, 009, 010, 023 | 001–011, 012, 024 |
| 003 | 013, 014 | 015, 027 | | 021 | 009, 010, 023 | 012, 024 |
| 004 | 011 | 017, 027 | | 022 | 011, 012 | 032 |
| 005 | 011, 015 | 014, 027 | | 023 | 016, 017 | 020, 023 |
| 006 | 011, 013 | 015, 027 | | 024 | 012, 018 | 021, 026 |
| 007 | 007, 011 | 009 | | 025 | 020 | 027, 035 |
| 008 | 007, 025 | 003, 006, 007 | | 026 | 011, 013, 020 | 017, 035 |
| 009 | 007, 025 | 001, 002, 006, 007 | | 027 | 001, 003, 022 | 013, 031 |
| 010 | 007, 025 | 004, 006, 027 | | 028 | 001, 002, 003, 006 | 030 |
| 011 | 007, 025 | 005, 006, 007 | | 029 | 001, 004 | 029 |
| 012 | 007, 008, 011, 015 | 007, 009 | | 030 | 009, 010, 021, 022 | 012, 013, 027, 028 |
| 013 | 007, 011, 019 | 002, 011, 018, 025 | | 031 | 022 | 028, 032 |
| 014 | 007, 011 | 008, 027 | | 032 | 022 | 028, 032, 036 |
| 015 | 007, 011 | 007, 008 | | 033 | 024 | 033 (informational — OQ-4: no gating test, indicator only) |
| 016 | 007, 011, 025 | 006, 007, 008, 027 | | 034 | 001, 011, 021 | 037 |
| 017 | 011 | 016, 027 | | 035 | 005, 012, 017 | 021, 023, 028, 029, 034 |
| 018 | 007, 010, 011 | 010, 019, 027 | | | | |

All 35 REQ-SETCMP ids have ≥ 1 DES and ≥ 1 TST; REQ-SETCMP-033 is informational per the Specify-gate decision on OQ-4.
