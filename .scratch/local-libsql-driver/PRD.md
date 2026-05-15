Status: ready-for-agent

# PRD: Local libSQL SQLite Driver

## Problem Statement

The backend and database package currently use `bun:sqlite` as the Drizzle SQLite driver. That works for the Bun/Elysia runtime, but it creates testing friction because Vitest runs under Node while `bun:sqlite` is Bun-only. Repository and database tests that should be normal Vitest integration tests are forced through `spawnSync("bun")` smoke scripts, which makes them noisier, harder to structure, and less consistent with the rest of the test suite.

## Solution

Replace the Bun-only SQLite driver with `@libsql/client` while keeping pongolinks on local SQLite storage configured through `DATABASE_PATH`. The goal is not remote Turso/libSQL support; the goal is a Node-compatible Drizzle driver that works in both the Bun backend runtime and Vitest. After the driver change, database migration smoke tests and Bookmark repository characterization tests should run directly as Vitest tests, while API smoke tests may continue to launch Bun because they exercise the Bun/Elysia runtime.

## User Stories

1. As a developer, I want the database package to avoid `bun:sqlite`, so that database code can be imported under Node-based Vitest.
2. As a developer, I want the backend to keep using a local SQLite file, so that the deployment shape remains simple.
3. As a developer, I want database configuration to stay path-based, so that `DATABASE_PATH` continues to describe the actual runtime input.
4. As a developer, I want `@pongolinks/db` to expose the same practical database creation boundary, so that backend callers do not learn driver internals.
5. As a developer, I want Drizzle schema and relations to keep working with the new driver, so that feature repositories do not need behavior changes.
6. As a developer, I want migrations to run against the new driver, so that local development and tests use the same database access path.
7. As a developer, I want migration smoke tests to run directly in Vitest, so that schema and trigger regressions are caught without spawning Bun.
8. As a developer, I want Bookmark editing characterization coverage to run directly in Vitest, so that create/update persistence behavior is easier to maintain.
9. As a developer, I want Bookmark repository tests to use the migrated test database fixture, so that they test real schema constraints, Tags, and Related Links.
10. As a developer, I want API smoke tests to remain allowed to spawn Bun, so that Bun/Elysia runtime checks stay realistic.
11. As a developer, I want the driver choice documented, so that future maintainers do not reintroduce `bun:sqlite` or switch to remote libSQL accidentally.
12. As a developer, I want `better-sqlite3` explicitly rejected, so that its local SQLite fit is not repeatedly reconsidered despite Bun runtime incompatibility.
13. As a developer, I want no product-facing API changes, so that Bookmark and Tag workflows continue to behave the same.
14. As a developer, I want no domain vocabulary changes, so that the existing Bookmark, Tag, Tag Popularity, Related Link, and Private Bookmark language remains stable.
15. As a developer, I want typecheck and agent tests to pass after the migration, so that the driver change is safe to hand to another agent.

## Implementation Decisions

- `@libsql/client` is the selected SQLite driver for Drizzle.
- The database remains a local SQLite file. Remote Turso/libSQL is out of scope and should not shape the public configuration.
- `DATABASE_PATH` remains the backend configuration name. The database package may internally adapt that path to whatever local libSQL URL format the client requires.
- `@pongolinks/db` continues to own Drizzle schema, relations, client creation, and migrations.
- `bun:sqlite` imports should be removed from app and package source code.
- `better-sqlite3` was considered because it is a direct local SQLite driver, but rejected because it is not a good fit for the Bun runtime.
- The backend database type should come from the database package or the libSQL Drizzle driver instead of `BunSQLiteDatabase`.
- The migrated test database helper should use the same local libSQL-backed database creation path as production, with in-memory or temporary local storage appropriate for tests.
- The `BookmarkEditor` write boundary remains responsible for Bookmark create/update persistence consistency, including Tag synchronization, Related Link synchronization, duplicate URL handling, and post-write reloading.
- The driver change should not move HTTP parsing, value-object construction, or Result response mapping into repository modules.
- Existing API response shapes and error codes are preserved.
- ADR-0004 records the accepted driver decision and should remain aligned with the implementation.

## Testing Decisions

- Good tests should assert externally visible behavior: persisted rows, returned DTOs, Result errors, constraints, triggers, and slice-level outcomes. They should not assert internal ordering or private helper calls unless those details are observable through durable state.
- Migration smoke coverage remains in the database package and should become a direct Vitest test.
- Migration smoke coverage should continue checking migrated tables, FTS triggers, foreign keys, uniqueness behavior, and `updated_at` behavior.
- Bookmark editor characterization should become a direct Vitest suite rather than a Vitest wrapper around a Bun script.
- Bookmark editor tests should cover duplicate Bookmark URLs, unique submitted Tags, sorted returned Tags, Related Link extraction, duplicate update errors, missing update errors, Tag attach/detach/orphan deletion, shared Tag preservation, and Related Link insert/delete/retain behavior.
- API smoke tests for Bookmark and Tag routes may continue to use `spawnSync("bun")` because they verify the Bun/Elysia runtime rather than only database or repository behavior.
- Verification commands are `bun run typecheck` and `bun run agent:test`.

## Out of Scope

- Remote Turso/libSQL support.
- Renaming `DATABASE_PATH` to `DATABASE_URL`.
- Replacing SQLite with another database.
- Changing Drizzle schema semantics beyond what is required for driver compatibility.
- Changing Bookmark, Tag, Related Link, or Private Bookmark domain behavior.
- Changing public API response shapes or error codes.
- Removing Bun/Elysia API smoke tests that still need to exercise the runtime.
- Deploying the app or starting a dev server.

## Further Notes

This PRD supersedes the earlier v0.9 architecture-plan assumption that changing the SQLite/Drizzle driver was out of scope. That assumption was correct for the Bookmark editing refactor, but the driver migration is now its own focused infrastructure change.

ADR-0004 is the architectural source of truth for the local libSQL driver decision.
