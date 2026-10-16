# ADR-005 — Angular CLI/AOT inside `frontend/`, output to `frontend/src/ng/`, one `npm run build`, ESLint exclusion, multi-stage Dockerfile
Stage: architect
Status: accepted
Date: 2026-10-16
Upstream: specs/SETCMP/DESIGN.md (DES-SETCMP-001, DES-SETCMP-002, DES-SETCMP-003, DES-SETCMP-004, DES-SETCMP-006, DES-SETCMP-022) ; specs/SETCMP/SPEC.md (REQ-SETCMP-027, REQ-SETCMP-028, REQ-SETCMP-029)
Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16

## Context
`frontend/server/dev-server.js:11` serves `frontend/src` as the static root and maps `/vendor/*` to `node_modules`;
`frontend/Dockerfile` runs `npm ci --omit=dev` and copies only `server/` and `src/` (no build step, no devDependencies);
`karma.conf.js` globs `src/app/**/*.js`; `.eslintrc.json` is ESLint 8 + `eslint-plugin-angular` with `lint = eslint src test`;
CI (`.github/workflows/ci.yml`) runs `npm ci → npm run lint → npm test` in the `frontend` job and starts
`node server/dev-server.js` directly in the `ui` job (line 68). `package.json` has no `build` script. UM-30 requires the
frontend to stay one `npm install && npm run build` emitting into the same static server; UM-31 requires both test
runners in CI; the Specify gate fixed Angular **16** with CLI/AOT (OQ-7). Where the bundle lands, how `npm start`
gets a fresh bundle and how Docker builds it were OQ-14/OQ-17; the Design gate chose `prestart`.

## Decision
1. **Workspace:** `frontend/angular.json` (project `sam-ng`, `sourceRoot: src/app-ng`, builder
   `@angular-devkit/build-angular:browser` 16.2, `main: src/app-ng/main.ts`, `polyfills: ["zone.js"]`, `styles: []`,
   `assets: []`), `tsconfig*.json` (`strict`, `strictTemplates`, ES2022), Angular Karma config `src/app-ng/karma.conf.js`;
   the legacy `karma.conf.js` is untouched (DES-001).
2. **Output `frontend/src/ng/`** with `outputHashing: none`, `vendorChunk: false`, `extractLicenses: false`, budgets
   1 MB warn / 2 MB error, stub `index: { input: src/app-ng/index.stub.html, output: index.unused.html }` (the builder
   rejects `index: false`). Verified: exactly `runtime.js`, `polyfills.js`, `main.js` (≈106 kB AOT prod). The dev server
   already serves anything under `src/`, so `/ng/*.js` needs no server change; Docker copies `src/`. `src/ng/` and
   `.angular/` are git-ignored; Karma, ESLint and the FM globs (`frontend/src/app/**/*.js`, `frontend/src/app-ng/**/*.ts`,
   `tools/checks/common.py:6`) all miss `src/ng/` (DES-002).
3. **Scripts:** `build = ng build` (prod AOT), `build:dev`, `watch`, `prestart = npm run build` so `npm start` always
   serves a fresh bundle (OQ-17: accepted; manual `npm run build` also documented in RUNBOOK), `start` stays
   `node server/dev-server.js`, `test` stays legacy Karma, `test:ng = ng test --watch=false
   --browsers=ChromeHeadlessCI --karma-config src/app-ng/karma.conf.js` (DES-003).
4. **ESLint:** `ignorePatterns: ["src/ng/**", "src/app-ng/**", ".angular/**"]`; Angular code is checked by `tsc --strict`
   + AOT `strictTemplates`; no `angular-eslint` added (DES-004).
5. **Docker:** multi-stage — `build` stage (`node:20-alpine`, `npm ci`, copy sources, `npm run build`), runtime stage
   (`npm ci --omit=dev`, `COPY server`, `COPY --from=build /app/src ./src`); `docker-compose.yml` unchanged (DES-006).
6. **CI:** `frontend` job → `npm ci → lint → build → test → test:ng`; `ui` job adds `npm run build` before starting the
   dev server (it does not go through `npm start`, so `prestart` does not fire there); `checks`/`backend` unchanged (DES-022).

## Alternatives considered (and why rejected)
- **`dist/` output** — needs Docker/CI copy steps and a second static root; breaks UM-30's "same static server". Rejected.
- **Second static root in `dev-server.js`** — a server change for no gain over `src/ng/`. Rejected.
- **Emit under `src/app/`** — Karma's `src/app/**/*.js` glob and the FM-01 glob would scan the bundle. Rejected.
- **`ng serve` as the dev server** — replaces `dev-server.js`'s `/api` proxy and `/vendor` mapping, so Compose and the
  CI `ui` job would change; contrary to UM-30. Rejected.
- **esbuild JIT bundle (spike)** — NG0202 with constructor DI; no AOT template checking. Rejected (OQ-7).
- **No `prestart`, document-only** — considered (OQ-17); the Design gate chose `prestart` for a never-stale `npm start`.
- **`angular-eslint`** — extra dependency footprint; no standard requires it (REQ-SETCMP-029 accepts CLI tooling). Rejected.

## Consequences (positive / negative / follow-ups)
- (+) One `package.json`, one install, one `npm run build`; Compose and the CI gauntlet keep working with a one-line change each.
- (+) AOT + `strictTemplates` catch template errors at build time; bundle ≈106 kB instead of the spike's 1.8 MB JIT.
- (−) `npm start` now takes a few extra seconds (`prestart`); the two-terminal `npm run watch` + `npm start` loop is the dev path.
- (−) The runtime image still carries build output only if the build stage ran — a plain `docker build` without the stage will 404 on `/ng/main.js`.
- (−) ESLint does not see `src/app-ng/**`; style consistency there rests on `tsc` and review.
- Follow-ups: RUNBOOK dev-loop note (WI-01); `.gitignore` entries for `frontend/src/ng/` and `frontend/.angular/`.

## Verification (TST-SETCMP ids from DESIGN.md)
TST-SETCMP-030 (`npm run build` emits `src/ng/{runtime,polyfills,main}.js`; `npm start` serves them; `docker compose up
--build` serves `/` and `/ng/main.js`), TST-SETCMP-029 (`npm run lint` green with the ignores; `angular/di` still on
`src/app`), TST-SETCMP-031 (`npm run test:ng` in CI next to `npm test`), TST-SETCMP-013 (legacy Karma specs stay green).

## Reversibility
Low: everything is additive (new workspace files, three script tags, three npm scripts, one Dockerfile stage, two CI
lines). Changing the output directory later is a one-line `outputPath` + script-tag change.

## Open questions
- `frontend/` has no `.dockerignore`. DES-006's build stage copies the sources after `npm ci`; if a developer's local
  `node_modules/` or `src/ng/` is in the build context it is copied into the image (slow, and a stale bundle could mask
  a broken build before `npm run build` overwrites it). Not a DES change — WI-01 should add a `.dockerignore`
  (`node_modules`, `src/ng`, `.angular`) or confirm the context is clean in CI.

## GATE

GATE: architect — status: PASSED. Approved-by: Teddy Foley (delegated to the parent Devin session for this dry run) 2026-10-16 (covers ADR-001…006). FYI points acknowledged: DESIGN governs zone.js wording; Document records the IC-20 display-only exception under OQ-1; WI-01 adds frontend/.dockerignore. Orchestrator: https://devin-gtm.devinenterprise.com/sessions/94789f2008a241d1809df347bc530bcb
