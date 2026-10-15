---
name: run-the-stack
description: Start the Spring Boot asset service (:8080) and the AngularJS dev server (:3000) locally or with Docker Compose, and verify seeded data is reachable.
---
1. Backend: `cd backend && mvn -q spring-boot:run` (H2 in-memory, Flyway seeds 5 substations / 20 IEDs). Ready when
   `curl -s localhost:8080/api/substations | head -c 80` returns JSON. If Maven Central answers 429, use the Google
   mirror in `~/.m2/settings.xml` (see `docs/RUNBOOK.md`).
2. Frontend: `cd frontend && npm ci && npm start` → http://localhost:3000/#!/substations (proxies `/api` to :8080).
3. Or both: `docker compose up --build` (PostgreSQL 16 profile).
4. Identity is the `X-SAM-User` header chosen in the top-right switcher: `rvasquez` (admin), `mbrandt`/`aokafor`
   (engineers), `lchen` (viewer), `sdubois` (auditor).
