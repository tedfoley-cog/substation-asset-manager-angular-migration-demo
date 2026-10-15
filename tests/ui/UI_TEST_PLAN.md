# UI Test Plan — Playwright gauntlet (`tests/ui`)

Mandatory on every push (`.github/workflows/ci.yml` → `ui` job). Runs against the real stack (:3000 + :8080, seeded H2).
Every scenario asserts **domain content** (IED names, versions, values, roles), not element counts alone, so the same
suite must stay green when a screen moves from AngularJS to Angular (UM-20).

| ID | Scenario | Demo story beat | Pattern covered | Key assertions |
|----|----------|-----------------|-----------------|----------------|
| S1 | `01-estate-navigation` | "This is the estate the engineers live in" | Multi-view navigation | 5 sites / 20 IEDs; region filter; NTH-01 → bay T1 → NTH01_T1_87T → 3 settings versions, v3 active |
| S2 | `02-ied-inventory-filtering` | "Finding the relay you need" | Search / filter / sort + drawer drill-down | 5 line-distance relays; `nth` → 2; MAINTENANCE → STH02_T1_87T; firmware sort flips; drawer shows IP 10.42.1.21 |
| S3 | `03-settings-upload-validation` | "Guardrails on a settings change" | Invalid → valid form validation | short comment blocked client-side; 1.50 pu rejected server-side with detail; 0.35 stored as v4, v3 superseded |
| S4 | `04-settings-compare` | **The feature being migrated** | Business-logic screen, locale, export | 87T Slope 2 = 95 > max 90 first; counters = rows; de-DE decimals; swap clears violation; CSV filename |
| S5 | `05-scl-import-and-audit` | "Chained golden path across roles" | Modal, permissions, audit trail | failed then successful SCD import (3 of 4 matched); admin assigns unapproved 2.50.03 via modal; viewer 403; auditor sees DENIED/SUCCESS rows |
| S6 | `06-records-browser` | "Post-fault review" | Filter + download side-effect | NTH-01 pending = 2; `.cfg` download; record shows collected by mbrandt |

## Live finale (demo)

After the headless run, Devin opens the app in a visible browser and replays S4 (settings comparison) and S5 (import →
firmware modal → audit) by hand, narrating what each role can and cannot do. This is the last bullet of `DEMO_NOTES.md`.

## Running

```bash
# stack up (see .agents/skills/run-the-stack) then:
cd tests/ui && npm ci && npx playwright install --with-deps chromium && npx playwright test
SAM_UI_VIDEO=1 npx playwright test   # record videos into test-results/
```

Screenshots land in `tests/ui/screenshots/` (git-ignored). State mutations (v4 upload, firmware change, downloads)
happen against the in-memory H2 database, so restart the backend to return to day zero.
