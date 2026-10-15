# Implementation plan — Substation Asset Manager (AngularJS → Angular migration pilot, day zero)

## 1. What the demo proves

A grid-automation software team owns a full-stack asset web application: a fleet of protection relays and IEDs per substation, firmware versions, settings-file versions and comparisons, IEC 61850 SCL import, disturbance-record retrieval, roles and an audit trail. The frontend is AngularJS 1.8, the backend is Spring Boot 3 on Java 17. The team wants to migrate one bounded screen to Angular 17+ with identical behaviour. This repository is the **day-zero state** of that product. It gives an Agentic SDLC mechanism everything a migration pilot needs — a product-owner requirement with real gaps, governing standards the stage skills read at run time, a harness contract, a deterministic parity baseline (OpenAPI contract tests, seeded fixtures, a Playwright behaviour oracle), and deterministic checks for the three failure modes the team has already been burned by. Nothing here is the "after" state.

## 2. What Devin does live

Given the one-line instruction *"Migrate the settings-comparison screen according to the approved requirement"*, the orchestrator runs Specify → Decompose → Design → Architect → Coding → QA → Integrate → Document → Trace on this repo, raises the planted requirement gaps as BLOCKED questions at the first gate, bootstraps a hybrid AngularJS/Angular shell, ships the Angular component as a draft PR with the parity gauntlet green, and finishes by click-testing the migrated screen live in its own browser.

## 3. Stack and rationale

| Piece | Choice | Confirmed from |
|---|---|---|
| Frontend framework | AngularJS 1.8.3 (`angular`, `angular-mocks`, `angular-sanitize`, `angular-animate`), `.component()` + legacy `.controller()` mix, `#!` hashbang routing | https://docs.angularjs.org/guide/component, https://docs.angularjs.org/api/ng/provider/$locationProvider (hashPrefix `!` default since 1.6); npm `angular@1.8.3` is the final 1.x release |
| Router | `@uirouter/angularjs` 1.1.x (`ui.router` module, `$stateProvider`, `ui-view`, `ui-sref`) | https://ui-router.github.io/ng1/ ; npm `@uirouter/angularjs@1.1.2` |
| Unit tests | Karma 6 + Jasmine (`karma-jasmine`, `karma-chrome-launcher`, ChromeHeadless), `angular-mocks` `$httpBackend`/`$componentController` | https://docs.angularjs.org/guide/unit-testing, https://karma-runner.github.io/6.4/config/configuration-file.html |
| E2E leftovers | `protractor.conf.js` + two `*.e2e.js` specs using `browser`, `element(by.model(...))`, `by.repeater(...)` — Protractor was end-of-lifed in 2023 and is deliberately **not** in `devDependencies` (common state of real projects) | https://www.protractortest.org/#/api, https://github.com/angular/protractor/issues/5502 (EOL notice) |
| Lint | ESLint 8 (last version with `.eslintrc` + `eslint-plugin-angular` 4.x support) | https://eslint.org/docs/v8.x/use/configure/, https://github.com/EmmanuelDemey/eslint-plugin-angular |
| Dev server | Express 4 static server with `http-proxy-middleware` proxying `/api` to `:8080`, port 3000 | https://github.com/chimurai/http-proxy-middleware#readme |
| Backend | Spring Boot 3.3.x, Java 17, Spring Web MVC, Spring Data JPA, Bean Validation | https://docs.spring.io/spring-boot/3.3/ ; Boot 3.x requires Java 17+ |
| Database | H2 in PostgreSQL compatibility mode for dev/CI (`MODE=PostgreSQL`), PostgreSQL 16 via docker-compose for the "real" profile; Flyway SQL migrations shared by both | https://h2database.com/html/features.html#compatibility, https://documentation.red-gate.com/flyway/flyway-concepts/migrations/sql-based-migrations (`V<version>__<description>.sql`), https://docs.spring.io/spring-boot/3.3/how-to/data-initialization.html |
| API docs | springdoc-openapi 2.x (`/v3/api-docs`, `/swagger-ui.html`) | https://springdoc.org/#getting-started |
| Contract tests | Committed `openapi/asset-manager.v1.yaml` validated against MockMvc responses with Atlassian `swagger-request-validator-mockmvc` | https://bitbucket.org/atlassian/swagger-request-validator/src/master/swagger-request-validator-mockmvc/ |
| Architecture tests | ArchUnit JUnit 5 (controllers never touch repositories; entities never depend on web/DTO packages; controllers never return `@Entity` types) | https://www.archunit.org/userguide/html/000_Index.html |
| UI gauntlet / parity oracle | `@playwright/test`, headless Chromium, `webServer` array starting backend + frontend | https://playwright.dev/docs/test-webserver |
| IEC 61850 SCL | Namespace `http://www.iec.ch/61850/2003/SCL`; element chain `SCL/Header`, `Substation/VoltageLevel/Bay/ConductingEquipment(type=CBR|DIS|CTR|VTR)`, `LNode`, `Communication/SubNetwork/ConnectedAP/Address/P`, `IED/AccessPoint/Server/LDevice/LN0|LN(lnClass,inst,prefix,lnType)`, `DataTypeTemplates/LNodeType/DO`; file suffixes `.icd` (IED capability), `.cid`, `.scd` (substation configuration) per IEC 61850-6 | IEC 61850-6 Ed.2 (SCL); public reference instances from libiec61850 `examples/server_example_basic_io/simpleIO_direct_control.{icd,cid}` (read during research) |
| Logical-node → ANSI mapping used by the importer | PDIF→87, PTOC→51, PIOC→50, PDIS→21, PTRC→94, RBRF→50BF, RREC→79, RSYN→25, PTUV→27, PTOV→59, PTOF/PTUF→81, RDRE→disturbance recorder, MMXU→metering, XCBR/CSWI→breaker/switch control | IEC 61850-7-4 logical node classes; IEEE C37.2 device function numbers |
| Disturbance records | COMTRADE (IEEE C37.111-1999 / IEC 60255-24 2013) `.cfg/.dat/.hdr` triplets; cfg carries station name, rec_dev_id, rev_year, channel counts, line frequency, sample rate/end sample, start and trigger timestamps, `ASCII|BINARY` | IEEE C37.111-2013 / IEC 60255-24:2013 clause 6 (cfg layout) |
| Relay settings | Setting groups (SG1…SG6), per-unit thresholds, 87B pickup / slope 1 / slope 2 / breakpoint / seal-in, 50BF pickup and timers, 51P IEC curve + time dial, CT ratio per bay | IEC 60255-151 (overcurrent, IEC inverse curves), IEC 60255-187-1 (differential), IEEE C37.2 |
| Hybrid migration target (not in `main`) | `@angular/upgrade/static` `UpgradeModule`, `ngDoBootstrap` → `upgrade.bootstrap(document.body, ['sam'], { strictDi: true })`, `downgradeComponent` to place the Angular component inside the AngularJS shell | https://angular.dev/guide/upgrade |

## 4. Repo layout

```
.
├── README.md                                  flowchart first, then what/why/how
├── DEMO_NOTES.md                              presenter cheat sheet + single-session fallback prompt
├── harness.yaml                               machine-readable harness contract (commands, protected paths, standards, PR rules)
├── docker-compose.yml                         postgres + backend + frontend (:3000)
├── package.json / playwright.config.ts        root Playwright gauntlet runner (starts both halves)
├── .github/workflows/ci.yml                   backend, frontend, failure-mode checks, Playwright gauntlet
├── .github/PULL_REQUEST_TEMPLATE.md           requirement ID, governance trailer, evidence sections
├── .github/CODEOWNERS                         two-reviewer protected paths (auth, audit)
├── .agents/skills/parity-gauntlet/SKILL.md    mandatory finale: run the gauntlet headless, then click-test live
├── docs/IMPLEMENTATION_PLAN.md                this file
├── docs/HARNESS_CONTRACT.md                   human-readable harness contract
├── docs/flowchart.html / flowchart.png        demo flow
├── docs/ARCHITECTURE.md                       the app as the team documents it today
├── requirements/customer/angular-migration-requirement.md   product-owner requirement (deliberately imperfect)
├── standards/CODING_STANDARD.md
├── standards/INTERFACE_CONTRACT_STANDARD.md   API versioning, DTO vs domain, error envelope, null semantics
├── standards/UI_MIGRATION_GUIDELINES.md       ngUpgrade rules, parity oracle, what may not change
├── openapi/asset-manager.v1.yaml              committed contract (source of truth for contract tests)
├── tools/checks/
│   ├── controller-logic.js                    failure mode 1: business logic in AngularJS controllers (baseline-ratcheted)
│   ├── error-handling-diff.js                 failure mode 2: try/catch / .catch / @ExceptionHandler removed in a diff
│   ├── null-coercion.js                       failure mode 3: `|| 0`, `?? 0`, `orElse(0)` on API fields (baseline-ratcheted)
│   └── baseline.json                          known day-zero findings (the smells the pilot is expected to remove)
├── backend/                                   Spring Boot 3, Java 17, Maven
│   ├── pom.xml, Dockerfile
│   └── src/main/java/com/meridian/sam/
│       ├── SubstationAssetManagerApplication.java
│       ├── config/ (OpenApiConfig, WebConfig CORS, HeaderAuthFilter)
│       ├── domain/ (Substation, Bay, Ied, FirmwareRelease, SettingsFile, Setting, SclImport, DisturbanceRecord, UserAccount, AuditEvent, enums)
│       ├── repository/ (Spring Data interfaces)
│       ├── service/ (SubstationService, IedService, SettingsService, SettingsComparisonService, SclImportService, DisturbanceRecordService, AuditService, FirmwareComplianceService)
│       ├── web/ (REST controllers per resource + ApiExceptionHandler + dto/)
│       └── scl/ (SclParser — DOM over the 61850 namespace)
│   └── src/main/resources/ (application.yml, application-postgres.yml, db/migration/V1__schema.sql, V2__seed_fleet.sql, V3__seed_settings_and_records.sql)
│   └── src/test/java/... (contract tests, ArchUnit rules, a handful of service tests — partial coverage on purpose)
│   └── src/test/resources/scl/ASHF_E1Q02_P1.icd, meridian_ashford_132.scd
├── frontend/                                  AngularJS 1.8
│   ├── package.json, server.js, karma.conf.js, .eslintrc.json, protractor.conf.js
│   ├── e2e/legacy/*.e2e.js                    Protractor-era leftovers
│   ├── src/index.html, src/styles/app.css
│   └── src/app/
│       ├── app.module.js, app.routes.js, app.run.js
│       ├── core/ (api.service, auth.service, event-bus.service [$rootScope bus], locale.service, notification.service)
│       ├── shared/ (nav-bar + user-switcher components, modal.service, sam-sparkline directive [DOM manipulation], engUnit filter [locale logic], ansiFunction filter)
│       ├── substations/ (list component; detail $scope controller)
│       ├── ieds/ (list component with filters/sort; detail $scope controller with tabs)
│       ├── settings/ (settings-file.service; settings-compare.controller — business logic in the controller)
│       ├── scl/ (import component with validated form)
│       ├── records/ (disturbance-records component)
│       └── audit/ (audit-trail component)
│   └── test/unit/*.spec.js                    Karma + Jasmine
└── tests/ui/                                  Playwright gauntlet = behaviour oracle
    ├── UI_TEST_PLAN.md, fixtures/, global-setup.ts
    └── *.spec.ts (navigation, settings-compare, scl-import, disturbance-records, ied-list, approval golden path)
```

## 5. Flowchart outline

Nodes: Requirement → Specify → Gate 1 (spec approved, questions answered) → Decompose → Design → Architect → Gate 2 (architecture approved) → Coding → QA (parity gauntlet + contract tests + failure-mode checks) → Integrate (draft PR) → Document → Trace → Gate 3 (two human reviews, human merge) → Finale (Devin click-tests the migrated screen live). Loop edges: Architect VIOLATION → Design; QA FAIL → Coding; Specify BLOCKED → human question. Side nodes: `standards/` read at run time, `harness.yaml`, audit log.

## 6. Runtime plan

- Local / Devin machine: `cd backend && mvn spring-boot:run` (H2, Flyway seeds the fleet) and `npm --prefix frontend start` → http://localhost:3000. Or `docker compose up` (Postgres + both halves, frontend on :3000).
- The presenter sees: the AngularJS app with real fleet data, Swagger UI on :8080, Playwright HTML report, the draft PR, and the live click-through on Devin's Desktop tab.

## 7. Visual artifact plan

Primary visual: the flowchart (tier 1) plus the use case's native outputs (tier 2): the draft PR/diff, the Playwright parity report and the migrated screen rendered inside the legacy shell. No separate dashboard — the Dashboard Decision Gate fails on "tracking is the point" (this is a one-shot migration). The app UI itself is the interactive surface the gauntlet exercises.

## 8. UI test gauntlet plan

Surface: the AngularJS app on :3000 (hashbang routes `#!/substations`, `#!/ieds`, `#!/ieds/:id`, `#!/ieds/:id/settings/compare`, `#!/scl/import`, `#!/records`, `#!/audit`). Scenarios (each asserts on seeded domain content):

1. `navigation.spec.ts` — substations → Ashford 132 kV → bay list → IED detail → settings tab; names, voltage, ANSI functions, firmware compliance badges asserted at each stop.
2. `settings-compare.spec.ts` — compare v3 vs v4 for the 87B relay: exact changed-row set, deltas, out-of-range flag, "changed only" filter, search, sort by delta, locale switch en-GB → de-DE changes separators, row drawer shows range and history.
3. `scl-import.spec.ts` — invalid submissions (no file, wrong extension, missing substation) show validation errors; valid `.icd` import creates the IED, shows LN summary and an audit event.
4. `disturbance-records.spec.ts` — filter by IED × fault type × status combinations, exact result sets, retrieve action changes state and sparkline count.
5. `ied-list.spec.ts` — search, status + substation filters, sort by firmware compliance, counts in the KPI strip.
6. `approval-golden-path.spec.ts` — as an uploader the approve button is refused (four-eyes), switch to a protection engineer, approve v4, IED detail shows the active version, audit trail shows the approval.

Trigger: CI job on every push; live finale via `.agents/skills/parity-gauntlet/SKILL.md` and the last bullet of `DEMO_NOTES.md`.

## 9. CI plan

`.github/workflows/ci.yml` jobs: `backend` (Temurin 17, `mvn -B verify` — unit + contract + ArchUnit), `frontend` (Node 20, `npm ci`, `eslint`, Karma ChromeHeadless), `checks` (the three failure-mode scripts; error-handling diff on pull_request), `ui-gauntlet` (build backend jar, `npx playwright install --with-deps chromium`, `npx playwright test`, upload report on failure).

## 10. Risks and unknowns

- Hybrid bootstrap: `UpgradeModule` requires AngularJS to be bootstrapped by Angular (`ngDoBootstrap`), so `ng-app` must be removed from `index.html`; `strictDi` will reveal any un-annotated injection in the legacy code; `$locationProvider` hashbang + Angular's router coexistence is a known friction point. The spike (Step 12) measures how far one trivial component can be rendered.
- Angular 17+ tooling pulls a Vite/esbuild build chain into a repo that currently has none; CI time roughly doubles.
- ESLint 8 and `eslint-plugin-angular` are deprecated upstream; kept deliberately as legacy realism.
- The committed OpenAPI file and the springdoc runtime document may drift — the contract test validates responses against the committed file, which is the intended source of truth.
- Vendor-specific settings-file formats are proprietary; the app models settings generically (group / element / name / value / unit / range) rather than imitating a vendor format.
