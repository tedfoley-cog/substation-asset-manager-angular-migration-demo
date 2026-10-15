# Change Request CR-2031 — Migrate Settings Comparison to Angular

**Requesting team:** Protection & Control Engineering, Asset Systems
**Target release:** SAM 5.0 (Q3)
**Status:** Approved for estimation. *This document is the requirement as received; it has not yet been through a Specify stage.*

## 1. Background

The Substation Asset Manager (SAM) web client is AngularJS 1.8. The vendor has declared AngularJS end-of-life and our
security team has flagged the client for remediation. A full rewrite is out of scope this year. We want to start with
**one bounded feature** so the hybrid approach can be proven before we commit the remaining screens.

The feature chosen is **Settings Comparison** (`#!/ieds/:id/settings/compare`), because it is self-contained,
engineers use it daily during setting changes, and it is the screen with the most reported defects.

## 2. Scope

### 2.1 In scope

- Re-implement the Settings Comparison screen as an **Angular (17 or newer)** component.
- Run the new component **inside the existing AngularJS application** using the official hybrid approach
  (`@angular/upgrade`), so that the rest of SAM continues to work unchanged. Users must not notice a second application.
- Keep the URL the same so bookmarks and the "Compare versions" button on the IED detail page keep working.
- Keep all current behaviour of the comparison screen:
  - choose a baseline and a candidate settings version from the IED's history;
  - show changed, added and removed settings with the old and new values and the permitted range;
  - highlight settings that are outside their permitted range;
  - hide unchanged settings by default, with a toggle to show them;
  - filter by setting group;
  - export the visible comparison to CSV.
- Comparison logic should be moved out of the UI into a reusable place so the mobile team can use it later.
- Numbers and dates must continue to follow the operator's locale.

### 2.2 Out of scope

- Migrating any other screen.
- Replacing ui-router.
- Changing the REST API, except where strictly required for the comparison screen.
- Visual redesign. The screen should look the same as today.

## 3. Functional requirements

| ID | Requirement |
|----|-------------|
| CR-2031-F1 | The comparison must use the server-side comparison endpoint so that results are identical in SAM and in the planned mobile client. |
| CR-2031-F2 | A setting is "changed" when its value differs between baseline and candidate. |
| CR-2031-F3 | Range violations must be shown first and the file must be blocked from activation while violations exist. |
| CR-2031-F4 | The summary counters (changed / added / removed / violations) must match the rows shown. |
| CR-2031-F5 | Export must produce the same CSV columns as today. |
| CR-2031-F6 | The screen must load in under 1 second for an IED with 200 settings. |
| CR-2031-F7 | Only Protection Engineers and Protection Admins may open the comparison screen. |
| CR-2031-F8 | When the baseline is not selected the screen should compare against the previous version automatically. |

## 4. Non-functional requirements

- No regression in the existing Karma unit tests or the Playwright gauntlet.
- The Angular code must be unit tested with the Angular CLI test runner.
- The existing audit trail must continue to record settings activity.
- Build must stay a single `npm install && npm run build` for the frontend.

## 5. Acceptance

The change is accepted when the Settings Comparison screen is served by Angular inside SAM, all existing tests pass,
and the Protection Engineering lead signs off the comparison results on the NTH-01 and CEN-01 transformer relays.

## 6. Open points raised by the requester

- Should Viewers still be able to see the comparison read-only? (Legal says yes, Engineering says no.)
- The mobile team may want the comparison as a JSON API — not decided.

---
*Received 2026-09-30. Attachments: none. Screenshots of the current screen were promised but not supplied.*
