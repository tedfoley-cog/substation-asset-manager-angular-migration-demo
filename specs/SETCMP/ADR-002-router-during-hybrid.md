# ADR-002 — ui-router stays the only router; the Angular screen is downgraded into state `settingsCompare`
Stage: architect
Status: proposed
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-011, DES-SETCMP-012, DES-SETCMP-013, DES-SETCMP-014) ; specs/SETCMP/SPEC.md (REQ-SETCMP-002, REQ-SETCMP-003, REQ-SETCMP-006, REQ-SETCMP-026)
Approved-by:

## Context
`frontend/src/app/app.routes.js:13` defines
`settingsCompare { url: '/ieds/:id/settings/compare?left&right', params: { left: { dynamic: true }, right: { dynamic: true } }, templateUrl: 'app/settings/settings-compare.html', controller: 'SettingsCompareController' }`
among eight ui-router 1.1 states; `app.config.js` sets `hashPrefix('!')`, so the gauntlet asserts `#!/…` URLs
(`tests/ui/specs/04-settings-compare.spec.ts:14` — `toHaveURL(/settings\/compare\?left=\d+&right=\d+/)`). The IED detail
page reaches the screen with `$state.go('settingsCompare', …)` (`compare-go`). UM-03 says ui-router stays the router
for the whole hybrid period and Angular components are reached by downgrading; UM-04 says hash-bang URLs are preserved
and Angular's `LocationStrategy` is not used. The spike (`HYBRID_SPIKE_NOTES.md` §3) observed that `RouterModule` and
`$urlRouter` fight over `hashchange`. The legacy template navigates with `ui-sref` (`settings-compare.html:1`) and
`$state.go('.', {left, right})` (`settings-compare.controller.js:102`), which do not exist inside an Angular template.

## Decision
1. **No Angular Router.** `AppModule` imports no `RouterModule`, declares no routes, uses no `APP_BASE_HREF`/`LocationStrategy`.
2. **The existing state hosts the component.** `app.routes.js` changes only the `settingsCompare` entry to
   `template: '<sam-settings-compare></sam-settings-compare>'`; `url`, `params` and the state name are unchanged, so
   `compare-go`, bookmarks and the S4 URL regex work as before (REQ-SETCMP-003).
3. **Downgrade registration** lives in `frontend/src/app-ng/downgrades.ts`:
   `angular.module('sam').directive('samSettingsCompare', downgradeComponent({ component: SettingsCompareComponent }))`,
   imported first by `main.ts` (ADR-001 §5 guarantees `sam` exists). `angular` is the page global from
   `vendor/angular/angular.js` (`declare const angular`); AngularJS is not bundled a second time.
4. **`$state` is reached through an upgraded provider**, `UI_ROUTER_STATE` in `src/app-ng/core/upgrade-providers.ts`
   (`useFactory: i => i.get('$state'), deps: ['$injector']`, DES-012). The component reads `$state.params.id/left/right`.
5. **Navigation inside the component** (DES-013): breadcrumb anchors bind `[href]="$state.href('ieds')"` and
   `[href]="$state.href('iedDetail', { id: iedId, tab: 'settings' })"` so the `#!/` scheme is never hard-coded; reselect
   and swap call `$state.go('settingsCompare', { id, left, right })` (explicit name replaces `'.'`) and then `load({left,
   right})` themselves, because `left/right` are `dynamic: true` and the state is not re-entered — identical to the
   controller's behaviour today. No `ui-sref` in an Angular template.

## Alternatives considered (and why rejected)
- **Angular Router with `useHash` / `withHashLocation()` for the new screen** — two routers on one `hashchange` (spike §3);
  forbidden by UM-03/UM-04 until the last screen migrates. Rejected.
- **Hard-coded `href="#!/ieds/7?tab=settings"` strings** — duplicates the URL scheme in two frameworks; breaks if
  `hashPrefix` or `html5Mode` ever change. `$state.href` is already the single source of truth. Rejected.
- **`@Input()`s fed from a wrapper AngularJS controller (`resolve` → bindings)** — adds a second controller to keep in
  sync and re-introduces a legacy file for the screen; `$state.params` via the upgraded `$state` is simpler. Rejected.
- **Register the downgraded directive in `app.module.js` / `index.html`** — `downgradeComponent` is only available once
  the Angular bundle has executed; a classic script cannot reference it (OQ-15). Rejected.

## Consequences (positive / negative / follow-ups)
- (+) Zero URL change, zero `data-test` change; S4 and S1/S3 run unchanged (UM-20).
- (+) Each later screen follows the same recipe: swap `templateUrl/controller` for one `<sam-…>` tag + one line in `downgrades.ts`.
- (−) The Angular component depends on ui-router APIs (`$state.href/go/params`) through a token; when ui-router is
  finally removed every migrated component must be re-pointed to the Angular Router — the planned end-state cost of UM-03.
- (−) Dynamic params mean the component must reload itself; a future screen that forgets this will show stale data.
- Follow-up (OQ-11): `docs/HYBRID_SPIKE_NOTES.md` cites "UM-09" for this rule; the guideline is UM-03 (Document stage, WI-06).

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-027 (S4: URL regex, `h1`, swap 1→0, CSV name), TST-SETCMP-015 (`swap()`/`reselect()` call
`$state.go('settingsCompare', …)` and reload), TST-SETCMP-028 (S1/S3 reach the state via `compare-go`),
TST-SETCMP-035 (breadcrumb lands on `#!/ieds` and `#!/ieds/:id?tab=settings`), TST-SETCMP-023 (`UI_ROUTER_STATE` resolves `$state`).

## Reversibility
Cheap per screen (one route line, one directive line). Introducing the Angular Router later is a planned, not a
corrective, step; nothing in this increment pre-empts how it is done.

## Open questions
- The legacy breadcrumb (`settings-compare.html:1`) derives the IED id as `selection.right ? right.iedId : left.iedId`
  (from the loaded file), while DES-013 uses `$state.params.id`. Both are the same IED for every seeded and uploaded
  file, so visible text and URL are unchanged; the coder should keep the `$state.params.id` form as designed, but the
  reviewer may want this equivalence stated in the component spec (TST-SETCMP-017/035).
