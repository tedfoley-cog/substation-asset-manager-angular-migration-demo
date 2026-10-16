# ADR-001 — Angular owns the single bootstrap (UpgradeModule, strictDi), `ng-app` removed
Stage: architect
Status: proposed
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-005, DES-SETCMP-014, DES-SETCMP-002) ; specs/SETCMP/SPEC.md (REQ-SETCMP-001, REQ-SETCMP-030, REQ-SETCMP-035)
Approved-by:

## Context
Day zero bootstraps AngularJS declaratively: `frontend/src/index.html:2` is `<html lang="en" ng-app="sam">`, followed by
4 vendor scripts (lines 47–50) and 19 classic app scripts (lines 52–70). UM-01 requires that a hybrid application is
bootstrapped exactly once, by Angular, through `UpgradeModule` and `ngDoBootstrap`; UM-02 requires `strictDi: true`.
The throwaway spike (`docs/HYBRID_SPIKE_NOTES.md` §1–§2, §5–§6) showed that leaving `ng-app` in place double-bootstraps
and ui-router throws, that strictDi already holds because every injectable in `frontend/src/app` uses array annotation
(guarded by `.eslintrc.json` rule `angular/di: ["error","array"]`), and that zone.js must be loaded once before Angular.
Bootstrap ownership is the one decision every other hybrid decision (routing, downgrade registration, event bridge)
depends on, and reversing it later means touching every screen — hence an ADR.

## Decision
1. `ng-app="sam"` is removed from `frontend/src/index.html`; `ng-controller="ShellController"` on `<body>` stays.
2. `AppModule` (`frontend/src/app-ng/app.module.ts`) imports `BrowserModule` and `UpgradeModule`, has **no**
   `bootstrap:` array and no `RouterModule`, and implements
   `ngDoBootstrap() { this.upgrade.bootstrap(document.documentElement, ['sam'], { strictDi: true }); bridgeLegacyEvents(this.upgrade.$injector, this.events); }`.
3. `frontend/src/app-ng/main.ts` is `import './downgrades'; platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));`
   — the only bootstrap call in the repository. No `angular.bootstrap(...)` is added anywhere (UM-01).
4. zone.js is loaded exactly once, via the Angular CLI `polyfills: ["zone.js"]` array (DES-001/005); nothing else imports it.
5. Script order in `index.html`: the existing classic scripts unchanged, then `ng/runtime.js`, `ng/polyfills.js`,
   `ng/main.js` as `type="module"`. Module scripts are deferred, so `angular.module('sam')`, all config blocks and all
   ui-router states exist before any Angular code runs; `downgrades.ts` (DES-014) therefore registers the downgraded
   directive on the already-defined `sam` module before `bootstrapModule`.
6. `$locationProvider.html5Mode(false).hashPrefix('!')` (`app.config.js`) and the ui-router config are untouched.

## Alternatives considered (and why rejected)
- **Keep `ng-app` and let Angular attach later** — double bootstrap; ui-router `$urlRouter` throws (spike §1). Rejected.
- **Manual `angular.bootstrap(document, ['sam'])` from Angular code** — forbidden by UM-01; loses UpgradeModule's
  `$injector`/NgZone wiring that DES-016 relies on for change detection of `$q` callbacks. Rejected.
- **Bootstrap Angular on a sub-element instead of `document.documentElement`** — `ng-controller="ShellController"` is on
  `<body>` and the top bar/footer bind to it, so the AngularJS root must stay at the document root. Rejected.
- **Delay `ngDoBootstrap` until `/api/me` resolves** — slows first paint and cannot follow a user switch; see ADR-003.
- **esbuild IIFE + JIT as in the spike** — constructor DI emits no metadata (NG0202, spike §4) and breaks UM-30's single
  build story; Angular CLI/AOT is the Specify-gate decision (OQ-7). Rejected for the product build (kept only for the
  temporary logic side-build of ADR-004).

## Consequences (positive / negative / follow-ups)
- (+) One bootstrap path; `UpgradeModule` runs AngularJS inside `NgZone`, so impure pipes and downgraded components
  update on `$q`/bus activity without manual `ApplicationRef.tick()` (DES-016).
- (+) strictDi is enforced at runtime: an un-annotated injectable now fails loudly as `[$injector:strictdi]` instead of
  working by accident after minification.
- (−) A strictDi failure blanks the whole app (`main.ts` catch → console error → S1 fails at `api-status`). Mitigation:
  `angular/di` lint rule (TST-SETCMP-029) and the console scan (TST-SETCMP-034).
- (−) The first paint now waits for `ng/main.js` (≈106 kB AOT, DES-002) in addition to the AngularJS scripts.
- Follow-up: WI-02 lands this change alone (no downgrade yet) so a bootstrap regression is isolated (WORK_ITEMS WI-02).

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-028 (S1–S6 unchanged on H2 and Compose after WI-02), TST-SETCMP-034 (console scan: no `[$injector:modulerr]`,
`[$injector:strictdi]`, NG0xxx), TST-SETCMP-029 (`angular/di` still enforced on `src/app`), TST-SETCMP-030 (bundle
emitted and served).

## Reversibility
Low cost while only one screen is downgraded: restore `ng-app="sam"`, drop the three module script tags and the
Angular workspace. Cost grows with every downgraded screen; after the last AngularJS screen migrates the decision
inverts naturally (UpgradeModule removed, `bootstrap: [AppComponent]` added).

## Open questions
- `specs/SETCMP/WORK_ITEMS.md` WI-02 says `main.ts` does `import 'zone.js'`, whereas DES-SETCMP-005 puts zone.js in the
  CLI `polyfills` array and forbids importing it elsewhere. DESIGN.md governs; the WI wording should be aligned by the
  Document stage. Likewise WI text says "18 app scripts", `index.html` lines 52–70 hold 19.

## GATE

GATE: architect — status: WAITING FOR HUMAN APPROVAL. Coding must not start until `Approved-by:` in the header is filled by a human message of the form `Approved-by: <name> <YYYY-MM-DD>` (one approval covers ADR-001…006). Orchestrator: https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb
