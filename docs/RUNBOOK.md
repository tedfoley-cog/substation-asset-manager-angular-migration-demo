# Runbook

## Start
| What | Command | Check |
|---|---|---|
| Backend (H2, seeded) | `cd backend && mvn spring-boot:run` | `curl localhost:8080/api/substations` → 3 sites |
| Frontend | `cd frontend && npm ci && npm start` | `curl localhost:3000/` → 200; `/api/*` proxied |
| Everything incl. PostgreSQL | `docker compose up --build` | `docker compose ps` → db/backend healthy, frontend up |
| Backend against local PostgreSQL | `SPRING_PROFILES_ACTIVE=postgres SPRING_DATASOURCE_URL=… mvn spring-boot:run` | Flyway applies V1/V2 |

Maven Central HTTP 429: `MAVEN_MIRROR=https://maven-central.storage-download.googleapis.com/maven2/ docker compose up --build`, or add the same URL as a `<mirror>` in `~/.m2/settings.xml`.

## Verify
```
cd backend  && mvn test                                   # 53 tests: unit · OpenAPI contract · ArchUnit
cd frontend && npm run lint && npm test                   # ESLint · Karma (ChromeHeadless)
python3 tools/checks/run_all.py --base origin/main        # FM-01..03 (exit 1 on ratchet breach / removed handlers)
cd tests/ui && npm ci && npx playwright install chromium && npx playwright test    # S1–S6, stack must be up
```
Gauntlet counts assume a fresh seed; restart the backend (`docker compose down -v && docker compose up`) between runs if a scenario complains about an extra settings version or import.

## Reset data
H2 is in-memory — restart the backend. PostgreSQL — `docker compose down -v`.

## Demo users (`X-SAM-User`)
`rvasquez` PROTECTION_ADMIN · `mbrandt`, `aokafor` ENGINEER · `lchen` VIEWER (cannot download records) · `sdubois` AUDITOR (audit read-only) · `jkowalski` inactive → anonymous VIEWER.

## Known day-zero findings (intentional)
FM-01 baseline 12 (comparison logic in `settings-compare.controller.js`, filter logic in list controllers), FM-03 baseline 1. The ratchet only moves down.
