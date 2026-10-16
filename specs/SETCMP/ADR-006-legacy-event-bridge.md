# ADR-006 — Shared AngularJS services are upgraded once; legacy bus events reach Angular through one RxJS bridge
Stage: architect
Status: accepted
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-012, DES-SETCMP-017, DES-SETCMP-018) ; specs/SETCMP/SPEC.md (REQ-SETCMP-023, REQ-SETCMP-024, REQ-SETCMP-035)
Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16

## Context
Cross-screen communication is a `$rootScope.$broadcast` bus: `EventBus` (`frontend/src/app/core/event-bus.service.js:5–19`)
publishes/subscribes the names in the `SAM_EVENTS` constant (`app.config.js`, eight events) and `EventBus.toast` feeds
the shell toasts. The compare controller subscribes to `USER_CHANGED` and `SETTINGS_UPLOADED` and reloads
(`settings-compare.controller.js:122–124`). All HTTP goes through `ApiClient`, whose `$http` interceptors add
`X-SAM-User` and turn failures into `sam:apiError` → shell toast (`app.config.js`, `userHeaderInterceptor`/
`apiErrorInterceptor`). UM-11: shared AngularJS services needed by Angular are exposed once, no duplicate
implementations. UM-12: `$rootScope` events are not consumed from Angular — replace with an RxJS subject in a shared
service and bridge the legacy event in exactly one place. CS-04: no new bus events. CS-11/FM-02: no error handler may
disappear. The spike left "sharing the `$rootScope` event bus with Angular" explicitly unproven.

## Decision
1. **Upgraded providers, declared once** (`src/app-ng/core/upgrade-providers.ts`): `InjectionToken`s `API_CLIENT`,
   `SESSION_SERVICE`, `EVENT_BUS`, `UI_ROUTER_STATE`, each `useFactory: i => i.get('<name>'), deps: ['$injector']`,
   exported as `upgradedProviders` and registered only in `AppModule`. Nothing is reimplemented in Angular; nothing is
   `downgradeInjectable`d (no AngularJS consumer of an Angular service exists in this increment) (DES-012).
2. **All HTTP stays on the upgraded `ApiClient`**, so `X-SAM-User` and the error interceptor path are untouched
   (REQ-SETCMP-024). No `HttpClient`, no `HttpClientModule`.
3. **One bridge:** `SamEventsService` (`@Injectable({ providedIn: 'root' })`, `userChanged$`, `settingsUploaded$` Subjects)
   and `bridgeLegacyEvents($injector, events)` in `src/app-ng/core/legacy-event-bridge.ts`, which calls
   `EventBus.subscribe(EventBus.EVENTS.USER_CHANGED | SETTINGS_UPLOADED, payload => subject.next(payload))` exactly once,
   from `ngDoBootstrap` (ADR-001 §2). Components subscribe with `takeUntil(destroy$)`. No `$rootScope` import anywhere
   under `src/app-ng/**`; `SAM_EVENTS` unchanged (DES-017).
4. **Publishing stays legacy:** the component calls the upgraded `EventBus.toast(...)` for the export toast; it never
   `$broadcast`s. Angular → AngularJS notifications, if ever needed, go through the same `EventBus` instance.
5. **Error-path parity:** `load()` keeps history → files → compare with `.catch(() => { /* surfaced by apiErrorInterceptor */ })`
   and `.finally(() => this.loading = false)`; net FM-02 count ≤ 0 across WI-04/05 (DES-018).

## Alternatives considered (and why rejected)
- **`downgradeInjectable(SamEventsService)` and have AngularJS publishers call `subject.next` directly** — every legacy
  publisher would change and two publish paths would coexist; UM-12 asks for one bridge point. Rejected.
- **Inject `$rootScope` into Angular and `$on` there** — forbidden by UM-12; couples the component to AngularJS digest. Rejected.
- **Angular `HttpClient` with its own interceptor for `X-SAM-User`** — duplicates `userHeaderInterceptor`/`apiErrorInterceptor`
  (UM-11 violation) and splits error handling (CS-11). Rejected.
- **Bridge per component (subscribe inside `ngOnInit`)** — N subscriptions to `$rootScope`, leaks if a component forgets
  to unsubscribe, and not "exactly one place". Rejected.
- **Bridge all eight `SAM_EVENTS` now** — speculative; only two are consumed by the migrated screen. Later screens add
  a Subject to `SamEventsService` and one line to the bridge.

## Consequences (positive / negative / follow-ups)
- (+) Single source of truth for session, HTTP and events during the hybrid period; roles, header and toasts behave identically.
- (+) The bridge is the one file to delete when `EventBus` itself is retired; Subjects stay.
- (−) Angular code depends on AngularJS singletons through tokens; the dependency is explicit and listed in one file.
- (−) `payload` types cross the bridge as `unknown`/`User` and must be typed by hand (no shared TS types with the JS bus).
- Follow-up: when the last AngularJS screen goes, `SamEventsService` becomes the bus and `EventBus`/`SAM_EVENTS` are removed (CS-04 allows removal only).

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-023 (`bridgeLegacyEvents` subscribes once per event and forwards payloads; `upgradedProviders` resolve
`ApiClient`, `SessionService`, `EventBus`, `$state`), TST-SETCMP-020 (`userChanged$`/`settingsUploaded$` call `load()`;
released on destroy), TST-SETCMP-021 (`settingsHistory` rejection → `loading` false, no throw; interceptor path
untouched), TST-SETCMP-026 (FM-02 no net removed handler), TST-SETCMP-028 (S3 upload still triggers the reload producer; S5 roles).

## Reversibility
Low: five small files under `src/app-ng/core/`. Replacing the bridge with native RxJS publishers is the planned
end-state once no AngularJS publisher remains.

## GATE

GATE: architect — status: PASSED. Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16 (covers ADR-001…006). FYI points acknowledged: DESIGN governs zone.js wording; Document records the IC-20 display-only exception under OQ-1; WI-01 adds frontend/.dockerignore. Orchestrator: https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb
