# UI Migration Guidelines (AngularJS → Angular hybrid)

These rules govern how screens move from AngularJS 1.8 to Angular inside the same application.

## Bootstrap

- **UM-01** The application is bootstrapped once, by Angular, using `UpgradeModule` (`@angular/upgrade/static`) and
  `ngDoBootstrap`. Remove `ng-app` from `index.html`; do not call `angular.bootstrap` yourself.
- **UM-02** AngularJS strict DI (`strictDi: true`) is on in hybrid mode. Every AngularJS injectable uses array or
  `$inject` annotation (CS-41).
- **UM-03** ui-router stays the router for the whole app during the hybrid period. Angular components are reached
  through existing ui-router states by **downgrading** the component (`downgradeComponent`) and referencing the
  downgraded element in the state template. Do not introduce the Angular Router until the last screen migrates.
- **UM-04** Hash-bang URLs (`#!/…`) are preserved. Angular's `LocationStrategy` is not used while ui-router owns the URL.

## Services

- **UM-10** Logic that an AngularJS controller owns today moves to a framework-neutral TypeScript module
  (`frontend/src/app-ng/<feature>/*.logic.ts`) with its own unit tests before any component is written.
- **UM-11** Shared AngularJS services needed by Angular are exposed with `downgradeInjectable`/upgrade providers once;
  no duplicate implementations.
- **UM-12** `$rootScope` events are not consumed from Angular. Replace with an RxJS subject in a shared service and
  bridge the legacy event in exactly one place.

## Rendering and behaviour

- **UM-20** Migrated screens keep the same URL, `data-test` hooks and visible text so the Playwright gauntlet runs
  unchanged against both implementations.
- **UM-21** Locale: use Angular `DatePipe`/`DecimalPipe` with the operator locale provided via `LOCALE_ID` from the
  session, matching `samDate`/`samNumber` output exactly. Add a parity unit test.
- **UM-22** DOM-manipulating directives (`samStickyHeader`) are not ported; use CSS `position: sticky` in Angular.
- **UM-23** Styling remains `frontend/src/styles/app.css`; no component-scoped redesign during migration.

## Build and test

- **UM-30** The frontend stays one `npm install && npm run build`; the Angular CLI build emits into the same static
  server so `server/dev-server.js` and Docker Compose keep working.
- **UM-31** Both Karma (legacy) and the Angular test runner run in CI until the last AngularJS screen is removed.
- **UM-32** The gauntlet (`tests/ui`) is mandatory on every push and must pass against the hybrid bundle.
