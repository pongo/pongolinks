# Regression-test Tag diff with Related Link sync

Status: ready-for-agent

## Goal

Verify Tag diff synchronization does not regress existing Bookmark edit behavior, especially Related Link synchronization from v0.4.

## Context

Bookmark update currently performs Bookmark field updates, Tag replacement, and Related Link diff synchronization in one transaction. v0.5 changes Tag persistence in that transaction, so the neighboring Related Link behavior should stay covered.

## Scope

- Add focused backend regression coverage in `apps/backend/test/bookmarks-api-smoke.ts` or the existing closest test file.
- Ensure Tag diff and Related Link sync both work during the same `PATCH /api/bookmarks/:id`.
- Ensure existing Bookmark URL duplicate and `updatedAt` behavior remain covered by existing tests or updated assertions.
- Run the project verification commands after implementation:
  - `bun run typecheck`
  - `bun run agent:test`
  - `bun run format`

## Out Of Scope

- Frontend tests.
- New API contracts.
- Dev server startup.
- Deploy.
- Git commit.

## Acceptance Criteria

- A Bookmark edit can attach/detach/retain Tags and insert/delete/retain Related Links in the same request.
- Existing Related Link tests still pass, including preserving unchanged Related Link IDs.
- Existing Tag list/get DTO behavior still passes.
- Verification commands pass.

