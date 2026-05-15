# Deepen Bookmark Editing Module

## Context

The Bookmark backend slice currently keeps Bookmark persistence, DTO mapping, Tag synchronization, Related Link synchronization, duplicate URL handling, and observability counts in `apps/backend/src/features/bookmarks/bookmarks-repository.ts`.

The module already hides meaningful behavior, but its public shape still reads like repository CRUD. As Bookmark behavior grows, callers and tests may need to know too much about the order of persistence, Tag synchronization, Related Link synchronization, duplicate URL handling, post-write reloading, and error mapping.

Relevant domain rules from `CONTEXT.md`:

- A URL can identify at most one Bookmark.
- Tags attached to a Bookmark are synchronized from submitted Tag text.
- Related Links are synchronized from the Bookmark description.
- A Tag with no attached Bookmarks is removed.

## Problem

The current module has useful depth internally, but the seam is not named after the main domain workflow. The deletion test suggests the behavior is load-bearing: removing it would spread URL uniqueness checks, Tag synchronization, Related Link synchronization, and DTO mapping across route handlers or tests.

The friction is that the current interface does not clearly say "edit a Bookmark and keep its derived relationships consistent". It says `create` and `update` on a repository, while the implementation does more than persistence.

## Direction

Deepen a Bookmark editing module around create/update behavior. Name the public write boundary `BookmarkEditor`. Keep database details, relationship synchronization, duplicate URL handling, and post-write reloading behind that interface.

The route module should know how to parse HTTP input, construct value objects, produce Result responses, and add request logging context. It should not need to know the persistence choreography beyond calling `BookmarkEditor`.

Read behavior is outside this plan. `list` and `findById` can remain repository/read-model operations because they do not own the create/update consistency workflow.

Tag synchronization may be extracted as a private collaborator inside the Bookmark backend slice, but it should not become a cross-feature or top-level architecture boundary in v0.9. The v0.9 boundary is Bookmark editing; Tag synchronization is one internal rule it coordinates.

Request parsing and value-object construction stay at the route/application edge. `BookmarkEditor` receives validated editable Bookmark data and owns persistence consistency.

Observability counts stay as internal telemetry in v0.9. `BookmarkEditor` may accept an optional editing logger/callback, but Tag and Related Link synchronization counts should not become part of the public API response or domain result.

The project currently runs Vitest under Node while the database client uses `bun:sqlite`. v0.9 should not change the Drizzle SQLite driver. Focused `BookmarkEditor` integration coverage can follow the existing backend pattern: a Vitest wrapper launches a Bun smoke/integration script that uses the real migrated SQLite database fixture.

Changing the database driver, including a possible move to `@libsql/client`, is out of scope for v0.9.

## Out of Scope

- Changing the SQLite/Drizzle driver.
- Making Tag synchronization a top-level or cross-feature module.
- Moving `list` or `findById` into the editing boundary.
- Moving HTTP/request parsing or value-object construction into `BookmarkEditor`.
- Changing API response shapes or error codes.

## Implementation Plan

1. Characterize existing behavior with focused `BookmarkEditor` integration coverage around create/update Bookmark outcomes, including duplicate URLs, Tag attach/detach/orphan deletion, and Related Link insert/delete/retain.
2. Introduce `BookmarkEditor` inside the Bookmark backend slice as the public write boundary for creating and updating editable Bookmark state.
3. Move create/update orchestration behind `BookmarkEditor` while preserving the existing HTTP Result shape and error codes.
4. Keep `BookmarkUrl` and `TagName` construction outside `BookmarkEditor`; pass `EditableBookmarkData` into the write boundary.
5. Preserve optional write-path telemetry through a `BookmarkEditor` logger/callback without adding synchronization counts to the API response.
6. Keep `list` and `findById` on the read-side repository path unless extracting them becomes necessary for the write refactor.
7. Extract Tag synchronization only as a private collaborator if it makes `BookmarkEditor` smaller and clearer.
8. Keep low-level row-to-DTO mapping private to the persistence implementation unless another real adapter appears.
9. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: deepen bookmark editing workflow
