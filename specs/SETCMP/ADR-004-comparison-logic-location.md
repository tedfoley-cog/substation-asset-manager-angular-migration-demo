# ADR-004 — Comparison logic lives in the client, in framework-neutral `settings-compare.logic.ts`; no server endpoint in this increment
Stage: architect
Status: accepted
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-007, DES-SETCMP-008, DES-SETCMP-009, DES-SETCMP-010, DES-SETCMP-021, DES-SETCMP-023) ; specs/SETCMP/SPEC.md (REQ-SETCMP-013, REQ-SETCMP-020, REQ-SETCMP-021, REQ-SETCMP-022, REQ-SETCMP-030, REQ-SETCMP-034)
Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16

## Context
The whole comparison engine — `EPSILON = 0.0005`, `toNumber` (de-DE grouping), `classify`, `rangeViolation`,
`deltaText`, `severity`, `compare`, CSV assembly — sits in the `$scope` controller
`frontend/src/app/settings/settings-compare.controller.js` (lines 18–120) and produces 10 of the 12 day-zero FM-01
findings (`tools/checks/baseline.json`: `FM-01.count = 12`; DES-023 lists lines 34, 42, 43, 50, 54, 56, 57, 72, 75, 114).
The server offers no comparison: `SettingsController` (`backend/.../web/SettingsController.java:22–40`) exposes only
`GET /api/ieds/{iedId}/settings`, `GET /api/settings/{fileId}` and `POST /api/ieds/{iedId}/settings`; `api/openapi.yaml`
lists the same paths (lines 819, 1038). CR-2031-F1 asked for a server-side endpoint, CR §2.2 said "no REST API
changes"; the Specify gate resolved OQ-1 as **client-side, no REST change, F1 deferred**. UM-10 requires the logic to
move to `frontend/src/app-ng/<feature>/*.logic.ts` with its own tests before any component exists; CS-02/CS-13 require
no domain logic in components and parsing only at the point of comparison. The thin AngularJS controller must keep
passing `test/unit/settings-compare.controller.spec.js` unchanged through WI-04 (REQ-SETCMP-030), yet Karma
(`karma.conf.js` files `src/app/**/*.js`) cannot load the Angular bundle — SPEC/WORK_ITEMS OQ-12.

## Decision
1. **Single engine, client-side:** `frontend/src/app-ng/settings/settings-compare.logic.ts` — no imports, no
   decorators — exports `EPSILON`, the row/summary types and the pure functions `toNumber(raw, locale)`, `classify`,
   `rangeViolation`, `deltaPercent` (number | null), `severity`, `compare(left, right, locale) → {rows, summary, groups}`,
   `visibleRows`, `defaultSelection`, `csvText` (DES-007). The locale is a parameter, never read from a service.
2. **No server endpoint and no contract change in this increment:** the client keeps fetching history + two files and
   `api/openapi.yaml` is untouched (REQ-SETCMP-022); `mvn test` proves this by absence of drift (`OpenApiContractTest`).
   CR-2031-F1 (`GET /api/settings/compare?left&right`) is recorded as a **follow-up**, to be re-opened together with the
   mobile-API decision (OQ-6); the pure module is designed so a Java port (`BigDecimal`) or a shared TS package can
   replace the client computation without touching the component.
3. **Presentation stays out:** formatting via pipes/filters only (DES-008, ADR-003); the `text/csv` Blob/anchor download
   is `src/app-ng/settings/csv-download.ts` (`downloadCsv(filename, text)`), outside any `@Component` or controller file.
4. **Temporary IIFE bridge for the thin controller (WI-03 → WI-05 only):** `settings-compare.global.ts` re-exports the
   module and `csv-download.ts`; `esbuild --bundle --format=iife --global-name=samCompareLogic --target=es2017
   --outfile=src/ng/settings-compare.logic.js` (`build:logic`, esbuild 0.18.x pinned to what build-angular 16.2 ships —
   no decorators, so the spike's NG0202 does not apply). AngularJS reaches it through
   `src/app/settings/settings-compare.logic-bridge.js`: `factory('SettingsCompareLogic', ['$window', $w => $w.samCompareLogic])`
   (lazy read). `karma.conf.js` adds `src/ng/settings-compare.logic.js`; `pretest` runs `build:logic`; `index.html` loads
   the IIFE as a classic script (DES-009). The controller keeps every `$scope` member the Karma spec touches and
   delegates everything else (DES-010), so FM-01 drops 12 → 2 in WI-03 and the baseline is lowered (never raised).
5. **Retirement:** controller, template, Karma spec, bridge, IIFE and `pretest` are deleted in WI-05 (DES-021) with the
   CHANGELOG wording quoted there; the component `.ts` (scanned because it contains `@Component`) must contain none of
   the FM-01 patterns and only call logic functions (DES-023).

## Alternatives considered (and why rejected)
- **Server endpoint now (OQ-1 option a)** — additive and IC-10-clean, but contradicts CR §2.2, needs controller +
  service + DTOs + contract regeneration + MockMvc tests + ARCHITECTURE note (interface standard §4), and moves
  tolerance/severity rules to Java mid-migration. Rejected at the Specify gate; deferred, not dismissed.
- **Both client and server compute** — ruled out by IC-20 unless the client stops computing.
- **Logic as an Angular `@Injectable` service** — ties the engine to Angular DI, cannot be unit-tested without
  TestBed, and cannot be shared with a non-Angular mobile client; UM-10 asks for a framework-neutral module. Rejected.
- **`downgradeInjectable` to reach the module from AngularJS (OQ-12 a)** — needs a bootstrapped Angular injector inside
  the legacy Karma run, where `bootstrapModule` fights `angular-mocks`. Rejected.
- **`tsc --module umd` instead of esbuild IIFE** — tsc's UMD wrapper has no global fallback and `angular-mocks` defines
  `window.module` as a function, so it would silently register nothing. Rejected.
- **Leave the controller fat until WI-05 (OQ-12 c)** — loses the isolated, provable FM-01 drop of WI-03. Rejected.

## Consequences (positive / negative / follow-ups)
- (+) FM-01 12 → 2; the engine is testable in milliseconds with no framework; the same functions serve the thin
  controller (WI-03/04) and the component (WI-04+), so behaviour cannot diverge during the overlap.
- (+) `api/openapi.yaml`, `auth/**`, `audit/**` and `db/migration/**` are untouched — no two-reviewer paths.
- (−) Domain truth (range violations, tolerance) is computed in the browser; a mobile client would have to re-implement
  or share the TS module until F1 lands. Recorded follow-up.
- (−) WI-03..05 carry a second small build (`build:logic`) and a `$window` global; both are deleted in WI-05.
- Follow-ups: F1 endpoint (with OQ-6); Document stage notes the follow-up and the baseline change in `specs/SETCMP/CHANGELOG.md`.

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-001..011 (logic spec incl. `0.30` vs `0.3000`, de `1.234,5`, `exceeds maximum 50`, severity order, NTH01
v2→v3 fixtures, CSV, no coercion), TST-SETCMP-012 (legacy Karma spec unchanged through WI-04), TST-SETCMP-024 (FM-01
12 → 2, none in `*.component.ts`), TST-SETCMP-025 (FM-03 stays 1), TST-SETCMP-032 (no contract drift), TST-SETCMP-037
(feature code only under `src/app-ng/settings/` + `core/`).

## Reversibility
Moving the engine to the server later is the planned F1 follow-up: the component already consumes `{rows, summary,
groups}` from one function, so swapping `compare()` for an HTTP call is local to the component's `load()`. The
tolerance/severity rules are documented in TST-SETCMP-001..007, which become the oracle for a Java port.

## Open questions
- **IC-20 wording vs OQ-1.** IC-20 says the UI never derives domain truth the server also computes. The server already
  range-checks on upload (`SettingsService.validate()`, `BigDecimal`, line 78) while the client computes range
  violations for display — and seed data holds an ACTIVE file with a violation (`CEN01_SGT2_87T` v3, S4's fixture), which
  only the client reports. OQ-1 accepted this for the increment; the standard's text still reads as violated. Not
  resolved here — the Document stage should record the exception, or the standards owner relax IC-20 for display-only
  computation.
- UM-30 ("one `npm install && npm run build`") vs the WI-03..05 `pretest → build:logic` hook: `npm test` temporarily
  depends on an esbuild step. Accepted as transitional by DES-009; confirm the reviewer is comfortable with it.

## GATE

GATE: architect — status: PASSED. Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16 (covers ADR-001…006). FYI points acknowledged: DESIGN governs zone.js wording; Document records the IC-20 display-only exception under OQ-1; WI-01 adds frontend/.dockerignore. Orchestrator: https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb
