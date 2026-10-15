# Interface Contract Standard

## 1. The contract is the file

`api/openapi.yaml` is the API contract. It is generated (`api/tools/regenerate_contract.py`) and committed; a PR that
changes the service surface without changing the contract fails `OpenApiContractTest.liveDocumentMatchesCommittedContract`.

## 2. Boundaries

- **IC-01** Controllers accept request DTOs and return response DTOs from `web/dto`. Entities never cross the HTTP boundary.
- **IC-02** Every GET operation has an `x-contract-example` that executes against seeded data in CI.
- **IC-03** Response schemas declare `required`; everything else is `nullable: true`. Clients must handle `null`.

## 3. Compatibility rules

- **IC-10 Additive only within a major.** New fields and new optional query parameters are fine. Removing or renaming a
  field, changing a type or making a parameter required is a breaking change and requires a `/api/v2` path.
- **IC-11 Enumerations are closed on the server, open on the client.** Clients must tolerate unknown enum values.
- **IC-12 Errors use one envelope:** `{status, error, message, details[], path, timestamp}` (`ApiError`). `details`
  carries field-level messages; `message` is safe to show to an operator.

## 4. New endpoints

A new endpoint needs, in the same PR: controller + service + DTOs, contract regeneration, a contract example, a MockMvc
test for the happy path and at least one failure path, and a note in `docs/ARCHITECTURE.md` if it introduces a concept.

## 5. Frontend ↔ backend

- **IC-20** The UI never derives domain truth that the server also computes; if both compute, the server wins and the
  UI consumes the server result.
- **IC-21** Authentication is the `X-SAM-User` trusted header in this environment; production replaces it with the
  gateway identity. Code must read the user only via `CurrentUser`.
