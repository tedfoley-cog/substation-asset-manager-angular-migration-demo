# Coding Standard

Applies to every change in this repository, human or agent authored. Checked by `tools/checks/` where a rule is
machine-checkable; the rest is reviewed. IDs are stable; cite them in PRs as `CS-nn`.

## Structure

- **CS-01 Layering (backend).** `web` → `service` → `repository` → `domain`. Controllers never touch repositories or
  return JPA entities; services own transactions and business rules. Enforced by `LayeringRulesTest` (ArchUnit).
- **CS-02 Business logic lives in services, not controllers/components.** A UI controller or component may bind,
  format and dispatch; it may not compute domain results (comparisons, validations, classifications). Enforced by
  `tools/checks/check_controller_logic.py` against a ratcheted baseline.
- **CS-03 One feature, one folder.** Frontend features are folders under `frontend/src/app/<feature>/`; Angular
  (post-migration) features live under `frontend/src/app-ng/<feature>/` with the same name.
- **CS-04 No new `$rootScope` events.** Cross-feature communication goes through an injectable service. Existing
  bus events are listed in `app.config.js` and may only be removed, never added.

## Correctness

- **CS-10 Never coerce missing values.** `null`/`undefined`/`''` from the API must render as "—" or be rejected; never
  as `0`, `false` or `''` silently. Enforced by `tools/checks/check_null_coercion.py`.
- **CS-11 Error handling is not optional.** Every API call has a failure path that reaches the operator (toast,
  banner or inline message). Removing a `try/catch`, `.catch` or error handler in a diff must be justified in the PR.
  Enforced by `tools/checks/check_error_handling.py` on the diff.
- **CS-12 Locale.** Dates and numbers shown to operators go through `samDate`/`samNumber` (AngularJS) or the
  equivalent locale pipes (Angular). No `toFixed`/`toLocaleString` in templates.
- **CS-13 Numeric settings are strings on the wire.** Setting values keep their textual form (e.g. `0.30`); parse at
  the point of comparison only.

## Security and audit

- **CS-20 Permission checks are server-side.** The UI may hide controls, the service must enforce
  (`Permissions`/`CurrentUser`). Every denied action is audited.
- **CS-21 Audit trail is append-only.** No update/delete paths on `audit_event`. Paths under `auth/` and `audit/`
  require two reviewers (see `harness.yaml`).
- **CS-22 Uploads are validated by content, not extension alone.** SCL files must parse against the IEC 61850 namespace.

## Tests

- **CS-30** Every behaviour change ships with a test at the right level: unit (Karma/JUnit), contract
  (`OpenApiContractTest`) or UI gauntlet (`tests/ui`). Bug fixes start with a failing test.
- **CS-31** Tests assert domain content (IED names, versions, values), not element counts alone.

## Style

- **CS-40** Java: Google Java Style, 4-space indent, no wildcard imports, records for DTOs.
- **CS-41** JavaScript/TypeScript: ESLint config in the repo is the standard. AngularJS code uses array DI.
- **CS-42** Commit messages: Conventional Commits with a `Refs: REQ-...` trailer when traceable.
