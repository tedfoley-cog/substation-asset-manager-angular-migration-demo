# SPEC — SETCMP: Settings Comparison migration to Angular (CR-2031)
Stage: specify
Source: requirements/customer/angular-migration-requirement.md (received 2026-09-30)
Approved-by:

## Context

The Settings Comparison screen (`#!/ieds/:id/settings/compare?left&right`, ui-router state `settingsCompare`) lets an
engineer pick a baseline and a candidate settings-file version of one IED and see which settings changed, were added
or removed, which candidate values fall outside their permitted min/max range, and export the visible rows as CSV.
Today the whole comparison engine — tolerance comparison (`EPSILON = 0.0005`), de-DE/en-GB number parsing, range
checks, severity ordering, summary counters and CSV assembly — lives in the `$scope` controller
`frontend/src/app/settings/settings-compare.controller.js` (a 2018 port of an Excel macro). That controller accounts
for 10 of the 12 day-zero FM-01 findings in `tools/checks/baseline.json`; it is the harness's main target.

"Hybrid" here means: Angular owns bootstrap (`UpgradeModule`, `ngDoBootstrap`, `ng-app` removed — UM-01), ui-router
stays the router (UM-03/UM-04), and the new comparison component is reached through the *existing* `settingsCompare`
state by downgrading it (`downgradeComponent`). The throwaway spike in `docs/HYBRID_SPIKE_NOTES.md` proved this on
Angular 16 with the gauntlet 6/6 and zero console errors.

Fixed by the standards and therefore not negotiable in this spec: UM-01..UM-04 (bootstrap/routing), UM-10..UM-12
(logic in a framework-neutral `*.logic.ts` module first; shared services downgraded once; no `$rootScope` consumption
from Angular), UM-20..UM-23 (same URL, `data-test` hooks, visible text; locale parity; CSS sticky header; no restyle),
UM-30..UM-32 (one build; both test runners; gauntlet on every push), CS-02 (no domain logic in components), CS-04 (no
new bus events), CS-10..CS-13 (no null coercion, error handling kept, locale filters/pipes, values are strings on the
wire), IC-10 (additive API only) and IC-20 (if client and server both compute, the server wins).

## Requirements

Verification levels: **unit** (Karma or Angular CLI runner), **contract** (`OpenApiContractTest` / MockMvc),
**gauntlet S4** (`tests/ui/specs/04-settings-compare.spec.ts`, plus S1–S6 overall), **FM ratchet**
(`tools/checks/run_all.py`), **manual** (reviewer / live finale).

| ID | Requirement | Source | Verification |
|----|-------------|--------|--------------|
| REQ-SETCMP-001 | The application is bootstrapped exactly once, by Angular, through `UpgradeModule.bootstrap(document.documentElement, ['sam'], { strictDi: true })` from `ngDoBootstrap()`, and `ng-app="sam"` is removed from `frontend/src/index.html`; no `angular.bootstrap` call is added. | §2.1 bullet 2, UM-01, UM-02 | gauntlet S1–S6 (app starts, no console errors) + manual |
| REQ-SETCMP-002 | The Settings Comparison screen is rendered by an Angular component mounted into the existing ui-router state `settingsCompare` via `downgradeComponent`; ui-router remains the only router, no `RouterModule` is imported, and hash-bang URLs are preserved. | §2.1 bullets 2–3, §2.2, UM-03, UM-04 | gauntlet S4 (`toHaveURL(/settings\/compare\?left=\d+&right=\d+/)`) + manual |
| REQ-SETCMP-003 | The screen keeps the URL `#!/ieds/:id/settings/compare?left&right` (dynamic `left`/`right` query params) so bookmarks and the IED-detail "Compare versions" button (`data-test="compare-go"`, `$state.go('settingsCompare', …)`) work unchanged. | §2.1 bullet 3, UM-20 | gauntlet S4 |
| REQ-SETCMP-004 | Every `data-test` hook and attribute listed under *Gauntlet protection* below, and the visible texts the gauntlet asserts (`h1` = `Settings comparison — <iedName>`, banner contains `fall outside the permitted range`, violation badge text e.g. `exceeds maximum 90`, cell classes `diff-cell-left`/`diff-cell-right`), are present on the migrated screen with identical values. | UM-20, §4 | gauntlet S4 |
| REQ-SETCMP-005 | The operator can choose a baseline and a candidate from the IED's settings-file history (`GET /api/ieds/{iedId}/settings`); both selects show the label `v<versionNo> · <status lowercased> · <samDate(uploadedAt,'date')>`; the baseline select offers a `— none —` option; changing either select updates the URL params and reloads the comparison. | §2.1 bullet 4a, CS-12 | unit + gauntlet S4 |
| REQ-SETCMP-006 | The swap control (`compare-swap`) exchanges baseline and candidate and re-runs the comparison, so that a violation in the candidate disappears when the files are swapped. | agreed-upon-today behaviour (`$scope.swap`), §2.1 bullet 4a | gauntlet S4 (`sum-violations` becomes `0` after swap) |
| REQ-SETCMP-007 | When no candidate is given in the URL the candidate defaults to the IED's `ACTIVE` version (else the newest); when no baseline is given it defaults to the newest version whose `versionNo` is lower than the candidate's (the "previous version"); when no such version exists the baseline is "none" and every candidate setting is classified `added`. | CR-2031-F8, agreed-upon-today behaviour (`load()`), Karma "defaults to active version vs the previous one" | unit |
| REQ-SETCMP-008 | Settings are paired by the key `settingGroup + '|' + name`; a setting present only in the candidate is `added`, only in the baseline is `removed`, otherwise `changed` or `unchanged`. | §2.1 bullet 4b, CR-2031-F2 | unit |
| REQ-SETCMP-009 | *Agreed-upon-today:* two numeric values are `unchanged` when `abs(left − right) < 0.0005` (so `0.30` vs `0.3000` is unchanged); non-numeric values are compared as exact strings. Numeric parsing accepts a decimal comma, and for a `de`-locale operator also accepts `1.234,5` grouping. **Blocked by OQ-2** (CR-2031-F2 reads as exact equality). | CR-2031-F2, Karma "classifies rows and tolerates export rounding", CS-13 | unit |
| REQ-SETCMP-010 | A candidate value is a range violation when it parses as a number and is `< minValue` ("below minimum <min>") or `> maxValue` ("exceeds maximum <max>"); non-numeric values and missing bounds never produce a violation; violations are evaluated on the candidate (right) file only. | §2.1 bullet 4c, CR-2031-F3, CS-10 | unit + gauntlet S4 (`87T Slope 2` = `95` > `90`) |
| REQ-SETCMP-011 | Rows are ordered by severity descending then `settingGroup`, then `name`: violations (3) first, then removed protection-function settings (`lnClass` in PDIF/PTOC/PIOC/PDIS/PTRC/RBRF) or changed settings whose name matches Pickup/Setting/Reach/Slope/Time Delay/Zone (2), then other differences (1), then unchanged (0). | CR-2031-F3 (first half), agreed-upon-today behaviour (`severity()`), Karma "orders violations first" | unit + gauntlet S4 (first row `data-kind="violation"`) |
| REQ-SETCMP-012 | Each row shows group, LN class, setting name, baseline value, candidate value, unit, signed percentage delta (`samNumber(pct, 1) + ' %'`, blank when either side is non-numeric or the baseline is 0), permitted range `min … max`, and a badge with the violation text or the kind. | §2.1 bullet 4b, agreed-upon-today behaviour (`deltaText`, template) | unit + manual |
| REQ-SETCMP-013 | Missing baseline/candidate values and missing min/max render as `—` / blank, never as `0` or `''`; FM-03 count does not rise above `tools/checks/baseline.json` (`1`). | CS-10, FM-03 | FM ratchet + unit |
| REQ-SETCMP-014 | Unchanged rows are hidden by default; the `show-unchanged` checkbox reveals them; the empty-state text `No differences between the selected versions … tick “show unchanged” to list all <n> settings` is kept. | §2.1 bullet 4d, UM-20 | unit + gauntlet S4 (row count grows after check) |
| REQ-SETCMP-015 | The `compare-group` select lists the distinct `settingGroup` values of the comparison, sorted, with an `All groups` option; selecting one restricts the visible rows (and the CSV export) to that group. | §2.1 bullet 4e | unit |
| REQ-SETCMP-016 | The summary counters `sum-changed`, `sum-added`, `sum-removed`, `sum-violations` and the unchanged count are computed over **all** rows of the comparison (not the filtered view), so that with the default filter the number of visible rows equals changed + added + removed. | CR-2031-F4, gauntlet S4 | unit + gauntlet S4 |
| REQ-SETCMP-017 | When `summary.violations > 0` the warning banner `violation-banner` is shown with the text `<n> setting(s) in v<candidate> fall outside the permitted range. This file must not be activated until the values are corrected or an engineering deviation is recorded.` **Whether a server-side activation block is in scope is OQ-3.** | CR-2031-F3 (second half), agreed-upon-today behaviour | gauntlet S4 |
| REQ-SETCMP-018 | `export-csv` downloads a UTF-8 `text/csv` file whose header is exactly `group,ln,setting,unit,v<leftVersionNo>,v<rightVersionNo>,kind,violation` (`-` in place of `v<n>` when a side is "none"), one row per *visible* row with every cell double-quoted (inner `"` doubled) in the order group, lnClass, name, unit, left value, right value, kind, violation; filename `<iedName>_compare.csv`; and emits the toast `Export — <n> rows exported`. | CR-2031-F5, §2.1 bullet 4f, agreed-upon-today behaviour (`exportCsv`) | unit + gauntlet S4 (filename `CEN01_SGT2_87T_compare.csv`) |
| REQ-SETCMP-019 | Numbers and dates shown on the screen are formatted for the operator's session locale exactly as `samNumber` (max 4 fraction digits, `—` for null) and `samDate` do today, e.g. de-DE `0,3` and `10.06.2024`; a parity unit test compares the Angular pipe output with the AngularJS filter output for both `de-DE` and `en-GB`. **How `LOCALE_ID` is sourced is OQ-8.** | §2.1 bullet 6, UM-21, CS-12 | unit (parity) + gauntlet S4 (`/\d,\d+/`) |
| REQ-SETCMP-020 | All comparison logic (parsing, classification, range check, severity ordering, summary, CSV assembly) lives in a framework-neutral TypeScript module under `frontend/src/app-ng/settings/` (`*.logic.ts`, no `@Component`), with its own unit tests written before the component; the component only binds, formats and dispatches. | §2.1 bullet 5, UM-10, CS-02 | unit + FM ratchet |
| REQ-SETCMP-021 | After the migration `tools/checks/check_controller_logic.py` reports fewer FM-01 findings than the baseline (`12`); the 10 findings in `settings-compare.controller.js` are gone and none reappear in a `@Component` file. | FM-01 ratchet, docs/HARNESS_CONTRACT.md | FM ratchet |
| REQ-SETCMP-022 | *Agreed-upon-today:* the client fetches `GET /api/ieds/{iedId}/settings`, `GET /api/settings/{left}` and `GET /api/settings/{right}` and computes the comparison itself; `api/openapi.yaml` is not changed. **Blocked by OQ-1**: if the server-side comparison endpoint is approved, this REQ is withdrawn and replaced by an additive endpoint (IC-10, §4 of the interface standard) consumed by the same logic module as a thin client (IC-20). | CR-2031-F1 vs §2.2, IC-10, IC-20 | contract |
| REQ-SETCMP-023 | The screen reloads its data on the existing bus events `sam:userChanged` and `sam:settingsUploaded`; no event is added to `SAM_EVENTS`; the Angular component receives them through an RxJS bridge in one shared service, never via `$rootScope`. | CS-04, UM-12, agreed-upon-today behaviour | unit + manual |
| REQ-SETCMP-024 | Every API failure on the screen still reaches the operator through the global `apiErrorInterceptor` → `sam:apiError` → shell toast path, and the loading indicator is cleared on failure; the diff removes no `try/catch`, `.catch` or `.finally` without a PR justification line. | CS-11, FM-02 | FM-02 diff check + unit |
| REQ-SETCMP-025 | The comparison table keeps its sticky header using CSS `position: sticky`; the `samStickyHeader` directive is not used by the Angular component, and no clone of the table carries `data-test` attributes. | UM-22, UM-23 | gauntlet S4 (`compare-row` count exact) + manual |
| REQ-SETCMP-026 | The screen looks the same as today: styling stays in `frontend/src/styles/app.css`, row classes `diff-row-changed/added/removed/violation`, badge classes `badge-bad/warn/ok/muted`, legend and breadcrumb (`IEDs / <iedName> / Compare settings`, linking back to the IED settings tab) unchanged. | §2.2 bullet 4, UM-23 | manual (live finale) |
| REQ-SETCMP-027 | The Angular code is unit-tested with the Angular CLI test runner (`ng test`), and the legacy Karma suite keeps running; both run in CI (`frontend · lint + karma` job extended, not replaced). | §4 bullets 1–2, UM-31 | unit (CI) |
| REQ-SETCMP-028 | The frontend remains a single `npm install && npm run build` (a `build` script is added to `frontend/package.json`); the Angular CLI output lands where `server/dev-server.js` and Docker Compose already serve static files, so `npm start` and `docker compose up --build` work without new steps. | §4 bullet 4, UM-30 | manual + gauntlet (CI `ui` job) |
| REQ-SETCMP-029 | `npm run lint` (ESLint 8 with `eslint-plugin-angular`) excludes the Angular sources/bundle (`src/app-ng/**`, build output) and stays green; Angular code is linted by its own CLI tooling. | CS-41, docs/HYBRID_SPIKE_NOTES.md | unit (CI lint) |
| REQ-SETCMP-030 | The existing Karma unit tests for `SettingsCompareController` and the Playwright gauntlet S1–S6 pass unchanged against the hybrid bundle; the gauntlet runs on every push. | §4 bullet 1, UM-32, CR §5 | gauntlet S1–S6 |
| REQ-SETCMP-031 | The audit trail is unchanged: the comparison screen records no audit events today and the migration adds none; `SETTINGS_UPLOAD` SUCCESS/FAILURE/DENIED events keep being written by `SettingsService.upload`. **A DENIED event for comparison access would only be introduced if OQ-5 is answered yes.** | §4 bullet 3, CS-21 | contract (backend tests) + gauntlet S5 |
| REQ-SETCMP-032 | *Agreed-upon-today:* every role (VIEWER, ENGINEER, PROTECTION_ADMIN, AUDITOR) can open the comparison screen and read `GET /api/settings/{fileId}`; no new UI gating or `Role` permission is added. **Blocked by OQ-5** (CR-2031-F7 and §6 disagree; enforcement would have to be server-side per CS-20 and touch `auth/**`). | CR-2031-F7, §6, CS-20 | contract + manual |
| REQ-SETCMP-033 | Loading a comparison for an IED with 200 settings per version completes in under 1 second **under a measurement method still to be defined (OQ-4)**; the seeded estate's largest file has 19 settings, so a test fixture must be created. | CR-2031-F6 | manual / unit (fixture) — method open |
| REQ-SETCMP-034 | The feature's Angular code lives in one folder `frontend/src/app-ng/settings/` mirroring `frontend/src/app/settings/`; the AngularJS controller and template are removed only after the gauntlet is green on the downgraded component. | CS-03, UM-10 | manual (review) |
| REQ-SETCMP-035 | All injectables keep array / `$inject` annotation so `strictDi: true` holds; shared AngularJS services needed by the component (`ApiClient`, `SessionService`, `EventBus`) are exposed via `downgradeInjectable`/upgrade providers exactly once, with no duplicate implementation. | UM-02, UM-11, CS-41 | unit + gauntlet (bootstrap) |

## Non-goals

Per CR-2031 §2.2 and the standards:
- Migrating any screen other than Settings Comparison (estate, IED list/detail, upload, SCL import, records, audit stay AngularJS).
- Replacing ui-router or introducing the Angular Router (UM-03); changing URLs or hash-bang scheme (UM-04).
- Visual redesign, component-scoped styles, new layout or new columns (UM-23).
- REST API changes beyond what OQ-1 may approve; no `/api/v2`; no change to upload validation.
- Replacing `ngAnimate`, porting `samStickyHeader` as a directive, or redesigning the `EventBus` beyond the single RxJS bridge (UM-12; broader bus replacement is an Architect decision for later screens).
- The mobile client itself and any JSON API designed specifically for it (§6, OQ-6).
- Merging to `main`: all output is draft PRs labelled `ai-generated`; a human integrates.

## Open questions

Each question blocks the REQ(s) named. The spec records today's behaviour as the default and does **not** choose.

**OQ-1 — Server-side comparison endpoint (CR-2031-F1) vs "no REST API changes" (§2.2).** Blocks REQ-SETCMP-022,
affects REQ-SETCMP-020/021. *Evidence:* there is no comparison endpoint — `SettingsController` exposes only
`GET /api/ieds/{iedId}/settings` (history), `GET /api/settings/{fileId}` and `POST /api/ieds/{iedId}/settings`
(upload); `api/openapi.yaml` lists the same three operations; `SettingsService.validate()` already does a server-side
range check (`BigDecimal`), so if the client keeps computing violations both sides compute and IC-20 says the server
wins. *Options:* (a) add `GET /api/settings/compare?left=<fileId>&right=<fileId>` returning rows + summary — additive
(IC-10 fine), needs controller + service + DTOs, contract regeneration, `x-contract-example`, MockMvc happy/failure
tests and an `ARCHITECTURE.md` note (interface standard §4); `web/` and `service/` are *not* two-reviewer paths; the
`*.logic.ts` module becomes a thin client, and tolerance/severity rules move to Java; (b) keep the comparison
client-side in the framework-neutral `*.logic.ts` module (UM-10) and defer the endpoint to the mobile-API decision
(OQ-6) — satisfies §2.2 and §2.1 bullet 5 ("reusable place") but not F1 literally. A third reading, (c) do both now, is
ruled out by IC-20 unless the client stops computing.

**OQ-2 — "Changed when the value differs" (CR-2031-F2) vs today's tolerance.** Blocks REQ-SETCMP-009. *Evidence:*
`classify()` treats numeric values within `EPSILON = 0.0005` as unchanged, and the Karma test "classifies rows and
tolerates export rounding" asserts `0.30` vs `0.3000` → `unchanged` (summary `unchanged: 1`); the controller comment says
relays round values on export, which is why the tolerance exists. *Options:* (a) exact string equality as F2 literally
says — the Karma test must change (contradicting §4 "no regression in the existing Karma unit tests") and relay
re-exports will show spurious changes; (b) numeric equality after parsing (`0.30 == 0.3000` but `0.3004 ≠ 0.3000`) —
no tolerance, still passes the existing test; (c) keep `EPSILON = 0.0005`. If OQ-1 picks the server, the same rule
must be implemented with `BigDecimal` and documented.

**OQ-3 — "The file must be blocked from activation while violations exist" (CR-2031-F3).** Blocks REQ-SETCMP-017.
*Evidence:* the screen has no activation action; today it only shows the `violation-banner` text. Activation happens
implicitly on upload (`SettingsService.upload` sets `ACTIVE` unless `draft`, after `validate()` rejects out-of-range
values with a 400). There is no "activate a DRAFT" endpoint, so a DRAFT with violations cannot currently be activated
at all, and an ACTIVE file with violations can only exist in seed data (e.g. `CEN01_SGT2_87T` v3, ACTIVE, with `87T Slope 2 = 95`
against max `90` — the S4 fixture). *Options:* (a) banner only — current behaviour, no backend change (fits §2.2); (b) add a server-side activation
guard / endpoint — new API, touches `service/` and possibly `db/migration/**` (two-reviewer path), out of §2.2 scope
unless approved; (c) defer to a separate CR.

**OQ-4 — "Under 1 second for 200 settings" (CR-2031-F6) has no method.** Blocks REQ-SETCMP-033. *Evidence:* the
largest seeded settings file has 19 values (`STH02_T1_87T`), the smallest 7 (`CEN01_BC_BCU`); nothing seeded reaches
200. No environment (H2 vs PostgreSQL, local vs CI, network), percentile (p50/p95), start/stop points (navigation start
→ table rendered? API response → rows?) or tooling is specified. *Options:* (a) unit-level budget on the logic module
(compare 2×200 values in < X ms, deterministic, CI-safe); (b) Playwright timing on a 200-setting fixture uploaded via
`POST /api/ieds/{iedId}/settings` in a dedicated scenario, p95 over N runs against the Compose stack; (c) drop F6 to a
non-blocking observation. Needs: fixture ownership and the acceptance environment.

**OQ-5 — Who may open the comparison (CR-2031-F7 vs §6).** Blocks REQ-SETCMP-032, affects REQ-SETCMP-031.
*Evidence:* F7 says Engineers and Protection Admins only; §6 says Legal wants Viewers read-only, Engineering does not.
Today every role can open the screen, `Role` has `canUploadSettings/canImportScl/canAssignFirmware/canDownloadRecords/
canReadAudit` but no comparison/read permission, and `SettingsService.history()/get()` perform no permission check.
CS-20 requires enforcement server-side, which means a new `Role` method and a `Permissions.require` in
`SettingsService`, a DENIED audit event (CS-20 "every denied action is audited"), and a change under
`backend/src/main/java/com/meridian/sam/auth/**` — a two-reviewer path — plus S5's viewer flow may be affected.
*Options:* (a) no restriction (today); (b) ENGINEER + PROTECTION_ADMIN only (F7) — AUDITOR also loses access, which F7
does not mention; (c) F7 plus read-only VIEWER (Legal); (d) UI-only hiding — rejected by CS-20, listed for completeness.

**OQ-6 — Mobile JSON API (§6) "not decided".** Affects OQ-1 and REQ-SETCMP-020/022. *Evidence:* §2.1 bullet 5 asks
for a "reusable place so the mobile team can use it later" and F1 assumes a server endpoint, but §6 says the JSON API
is undecided. If the mobile team will consume a server endpoint, OQ-1(a) is the natural answer; if the mobile client
is also TypeScript, a shared `*.logic.ts` package (OQ-1(b)) may satisfy the reuse goal. Needs the mobile team's
platform and timeline.

**OQ-7 — Angular major version.** Affects REQ-SETCMP-001/027/028. *Evidence:* §2.1 says "Angular (17 or newer)";
`docs/HYBRID_SPIKE_NOTES.md` and `docs/ARCHITECTURE.md` describe the spike on Angular 16; CI uses Node 20
(`.github/workflows/ci.yml`) and `frontend/package.json` declares `engines.node >= 18`. every Angular major from 17
onwards supports Node 20 (exact minimum minor versions to be confirmed against the chosen release), but Angular ≥ 17 defaults to
standalone components and the esbuild/Vite builder, which changes how the downgraded component is declared and how
the bundle is emitted into the static server (UM-30). *Options:* (a) Angular 17 LTS-style pin (minimum that satisfies
the CR); (b) latest stable at coding time; (c) 16 as spiked — does not meet the CR. Needs the customer's support-window
policy.

**OQ-8 — Source of `LOCALE_ID` (UM-21).** Blocks REQ-SETCMP-019 design (the spec notes it must be *designed*, not
decided here). *Evidence:* `SessionService.locale()` returns `'en-GB'` until `GET /api/me` resolves after bootstrap,
and the AngularJS filters are `$stateful` so they re-render when the user (and locale) changes via
`sam:userChanged` (the top-bar user switch in S4/S5 relies on this). Angular's `LOCALE_ID` is a static injection token
read at bootstrap by `DecimalPipe`/`DatePipe`. *Options the Architect must weigh:* (a) delay `ngDoBootstrap` until
`/api/me` resolves (slower first paint, breaks the "switch user without reload" behaviour); (b) component-level pipes
that take the locale from a downgraded `SessionService`/RxJS stream instead of `LOCALE_ID`; (c) re-bootstrap on user
change. Whatever is chosen must keep the de-DE assertion in S4 and the `samNumber`/`samDate` parity test green.

**OQ-9 — Acceptance set (CR §5) is under-specified.** Affects REQ-SETCMP-030 and the Trace stage. *Evidence:*
screenshots of the current screen were "promised but not supplied"; §5 requires the Protection Engineering lead to
sign off results on the NTH-01 and CEN-01 transformer relays, but NTH-01 has `NTH01_T1_87T` (3 versions, v3 active)
and CEN-01 has `CEN01_SGT2_87T` (the S4 relay) plus other IEDs; which version pairs constitute the acceptance set is
not stated, and the gauntlet mutates seed data (S3 uploads a v4 on NTH01_T1_87T). *Needs:* the exact IED/version pairs
and the expected row/summary values, or agreement that S4's assertions on `CEN01_SGT2_87T` plus the Karma fixture on
`NTH01_T1_87T` v2→v3 are the acceptance set.

**OQ-10 — Breadcrumb and version-select links inside a downgraded component.** Affects REQ-SETCMP-026. *Evidence:*
the template uses `ui-sref` (an AngularJS directive) for the breadcrumb and `$state.go('.', {left, right})` for
reselection; inside an Angular component these need either the upgraded `$state` service or plain `#!/…` hrefs. Not a
customer gap but a design point that must not alter visible text or URL (UM-20).

**OQ-11 — Guideline cross-reference drift.** `docs/HYBRID_SPIKE_NOTES.md` cites "UM-09" for the router rule; the
guideline is UM-03. Cosmetic, for the Document stage.

## Gauntlet protection

All six scenarios in `tests/ui` (S1 estate navigation, S2 IED inventory, S3 upload validation, **S4 settings
comparison**, S5 SCL import + audit, S6 records) run on every push and must stay green **unchanged** against the
hybrid bundle (UM-32, REQ-SETCMP-030). S4 is the direct guard for this feature; S1 and S3 also exercise the IED detail
page that links to it; S5 exercises the viewer/auditor roles that OQ-5 may affect.

S4 asserts, in order: sign-in as `mbrandt` (de-DE); search `CEN01_SGT2` → one `ied-row` → `ied-open` → `tab-settings`
→ `compare-go`; URL matches `settings/compare?left=\d+&right=\d+`; `h1` contains `Settings comparison — CEN01_SGT2_87T`;
`sum-violations` = `1`; `violation-banner` contains `fall outside the permitted range`; first `compare-row` has
`data-setting="87T Slope 2"`, `data-kind="violation"`, contains `exceeds maximum 90`, `.diff-cell-right` = `95`;
`compare-row` count = changed + added + removed; after `show-unchanged` the count grows; the `87T Pickup` row's
`.diff-cell-right` matches `/\d,\d+/`; after `compare-swap`, `sum-violations` = `0`; `export-csv` download is named
`CEN01_SGT2_87T_compare.csv`.

Frozen `data-test` hooks on the compare screen (from `frontend/src/app/settings/settings-compare.html`; Playwright
`testIdAttribute` is `data-test`):

| Hook | Element | Frozen attributes / text |
|------|---------|--------------------------|
| `compare-summary` | stat row container | contains the four counters below |
| `sum-changed` | changed counter | integer text |
| `sum-added` | added counter | integer text |
| `sum-removed` | removed counter | integer text |
| `sum-violations` | violations counter | integer text; class `status-down` when > 0 |
| `compare-left` | baseline `<select>` | option label format `v<n> · <status> · <date>`, `— none —` option |
| `compare-swap` | swap button | text `⇄` |
| `compare-right` | candidate `<select>` | same label format |
| `compare-group` | group filter `<select>` | `All groups` + sorted groups |
| `show-unchanged` | checkbox | label text `show unchanged` |
| `export-csv` | button | text `Export CSV` |
| `violation-banner` | warning `.alert.alert-warn` | present only when violations > 0; text per REQ-SETCMP-017 |
| `compare-table` | `<table class="grid">` | present only when visible rows > 0; header `Group / LN / Setting / v<l> / v<r> / Unit / Δ / Permitted / Change` |
| `compare-row` | `<tr>` per visible row | `data-setting="<name>"`, `data-kind="violation|changed|added|removed|unchanged"`, cells `.diff-cell-left` / `.diff-cell-right`, row class `diff-row-*` |

Also frozen because the gauntlet or other screens depend on them: the IED-detail `compare-go` button and the
`settingsCompare` state name/URL (REQ-SETCMP-003); the sticky-header behaviour must not clone rows carrying `data-test`
(REQ-SETCMP-025). The `Unchanged` stat has no hook today and none is required.

## Traceability

Per `docs/HARNESS_CONTRACT.md` and `harness.yaml`: every `REQ-SETCMP-nnn` above must later map to at least one
`DES-SETCMP-nnn` (Design stage, `specs/SETCMP/DESIGN.md`), at least one `TST-SETCMP-nnn` (unit, contract or gauntlet),
and at least one commit carrying the trailer `Refs: REQ-SETCMP-nnn`; the matrix is regenerated into
`docs/trace/SETCMP.md` at each stage and orphans in either direction fail the Trace stage. IDs are never reused or
renumbered; a REQ overtaken by an open-question decision (e.g. REQ-SETCMP-022 if OQ-1 → server endpoint) is marked
`withdrawn` with the OQ as reason and a new ID is issued. The ADRs the Architect stage must produce for this feature
are: bootstrap owner (REQ-SETCMP-001), routing during hybrid (REQ-SETCMP-002), locale source (REQ-SETCMP-019 / OQ-8),
and where comparison logic lives (REQ-SETCMP-020/022 / OQ-1).
