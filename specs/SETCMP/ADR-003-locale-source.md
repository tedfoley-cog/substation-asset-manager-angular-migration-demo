# ADR-003 — Locale comes from the session at render time: impure `Intl` pipes, `LOCALE_ID` unused
Stage: architect
Status: proposed
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-008, DES-SETCMP-012, DES-SETCMP-015, DES-SETCMP-016) ; specs/SETCMP/SPEC.md (REQ-SETCMP-005, REQ-SETCMP-012, REQ-SETCMP-019, REQ-SETCMP-023)
Approved-by:

## Context
Day zero formats every number and date through the `$stateful` filters `samNumber`/`samDate`
(`frontend/src/app/core/locale.filters.js:7–37`), which call `Intl.NumberFormat`/`Intl.DateTimeFormat` with
`SessionService.locale()` on **every** evaluation. `SessionService.locale()` (`session.service.js:19`) returns
`'en-GB'` until `GET /api/me` resolves — and `SessionService.load()` is only called by `ShellController`
(`shell.controller.js:45`) **after** bootstrap. The operator can switch user without a reload (`switchUser` →
`SessionService.switchTo` → `sam:userChanged`, then `$state.reload()`, `shell.controller.js:14–18`). Seeded users
span `en-GB`, `de-DE` and `fr-FR` (`sdubois`). S4 signs in as `mbrandt` (de-DE) and asserts `/\d,\d+/` on the
`87T Pickup` cell (`04-settings-compare.spec.ts:34–36`). UM-21's letter asks for Angular `DatePipe`/`DecimalPipe` with
`LOCALE_ID` "from the session"; but `LOCALE_ID` is a static injection token fixed at bootstrap, when the session locale is
not yet known. This was SPEC OQ-8; DESIGN chose option (b) and the Design gate accepted the deviation. This ADR records it.

## Decision
1. `SamNumberPipe` and `SamDatePipe` (`frontend/src/app-ng/core/sam-number.pipe.ts`, `sam-date.pipe.ts`) are declared
   with `pure: false` and are line-for-line ports of the two filters: same `Intl` options (`maximumFractionDigits: 4`
   default, fixed digits when given; `date` = `{year:'numeric', month:'2-digit', day:'2-digit'}`, `datetime` with
   `timeZone:'UTC'`), `—` for `null`/`undefined`/`''`, string pass-through for non-numeric input such as `3-pole`,
   formatter cache keyed `locale|style`.
2. Each evaluation reads `SessionService.locale()` from the **upgraded** `SESSION_SERVICE` token (DES-012) — the same
   AngularJS instance the filters use, so there is one locale source and no duplicate state (UM-11).
3. `LOCALE_ID` keeps Angular's default (`en-US`) and is read by no code path; `DecimalPipe`/`DatePipe` and
   `registerLocaleData` are not used on the migrated screen.
4. Re-render on user switch needs no extra code: impure pipes re-evaluate on every change-detection pass, AngularJS runs
   inside `NgZone` under `UpgradeModule`, the bridged `userChanged$` (ADR-006) triggers `load()`, and `$state.reload()`
   re-creates the downgraded component (DES-016).
5. Presentation stays out of the logic module: `deltaPercent` returns a number and the component renders
   `(pct > 0 ? '+' : '') + samNumber(pct, 1) + ' %'` (DES-008); CSV keeps raw wire strings (CS-13).

## Alternatives considered (and why rejected)
- **(a) Delay `ngDoBootstrap` until `/api/me` resolves and provide `LOCALE_ID` from the answer** — needs a second
  `/api/me` fetch before the AngularJS shell exists (today `ShellController` issues it), slows first paint, and still
  cannot follow `switchUser` because `LOCALE_ID` is frozen for the injector's lifetime. Rejected.
- **(c) Re-bootstrap on `sam:userChanged`** — destroys the AngularJS application and every open screen on each switch,
  changes the agreed "switch user without reload" behaviour, and S4/S5 switch users mid-flow. Rejected.
- **(d) Angular `DecimalPipe`/`DatePipe` with a static `LOCALE_ID` + `registerLocaleData`** — needs locale data for
  `en-GB`, `de-DE` and `fr-FR`; `DatePipe` presets do not reproduce the filters' output (`shortDate` de = `10.06.24`,
  `mediumDate` en-GB = `10 Jun 2024` vs the required `10.06.2024`/`10/06/2024`); `DecimalPipe` throws NG02100 on `3-pole`,
  which the filters pass through verbatim. Parity with `samNumber`/`samDate` (REQ-SETCMP-019) would be lost. Rejected.
- **Provide `LOCALE_ID` via a factory reading `SessionService`** — evaluated once at injector creation, i.e. still
  `'en-GB'` at bootstrap; same defect as (a) without the delay. Rejected.

## Consequences (positive / negative / follow-ups)
- (+) Exact output parity with the filters, proven by a parity spec; `fr-FR` works with no locale-data import; the user
  switch keeps working without reload.
- (+) Pipes and filters read the same `SessionService` instance, so a future locale change (e.g. per-IED locale) is one edit.
- (−) Impure pipes run on every change-detection pass; mitigated by the `locale|style` formatter cache and the small
  table (≤ 19 seeded values; 200 per CR-2031-F6). A later screen with thousands of cells should re-measure.
- (−) Angular's own i18n machinery (`$localize`, `DecimalPipe`) is not used on this screen; if a later screen adopts it,
  two formatting paths would coexist — a decision for that screen's ADR.
- **Follow-up (standards owner):** UM-21 currently reads "with the operator locale provided via `LOCALE_ID` from the
  session". This ADR satisfies UM-21's intent (locale from the session, exact `samDate`/`samNumber` parity, parity test)
  but not its letter. The wording should be updated in a follow-up to the standards (outside this feature's branch),
  e.g. "…with the operator locale read from the session at render time (impure pipes); `LOCALE_ID` is not the source".
  The Document stage (WI-06) should list this in `specs/SETCMP/CHANGELOG.md`.

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-022 (`src/app-ng/core/locale-parity.spec.ts`: pipe vs filter for `de-DE`/`en-GB`, `0.30`→`0,3`/`0.3`,
`1234.5`→`1.234,5`/`1,234.5`, `(pct,1)`, null→`—`, `3-pole`, date `02.06.2024`/`02/06/2024`, locale switch mid-test),
TST-SETCMP-014 (select labels `v3 · active · 10.06.2024` / `10/06/2024`), TST-SETCMP-027 (S4 de-DE `/\d,\d+/`),
TST-SETCMP-020 (reload on `userChanged$`), TST-SETCMP-036 (`sdubois` fr-FR opens the screen).

## Reversibility
Medium-low: the two pipes are the only formatting surface of the screen; replacing them with `DecimalPipe`/`DatePipe`
later is a template-level change plus locale-data registration, bounded by the parity spec. The decision does not
touch the backend or the URL/DOM contract.
