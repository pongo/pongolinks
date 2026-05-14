# Deepen Bookmark Persistence Module

## Context

The Bookmark backend slice currently keeps Bookmark persistence, DTO mapping, Tag synchronization, Related Link synchronization, duplicate URL handling, and observability counts in `apps/backend/src/features/bookmarks/bookmarks-repository.ts`.

The module already hides meaningful behavior, but its public shape still reads like repository CRUD. As Bookmark behavior grows, callers and tests may need to know too much about the order of validation, persistence, Tag synchronization, Related Link synchronization, and error mapping.

Relevant domain rules from `CONTEXT.md`:

- A URL can identify at most one Bookmark.
- Tags attached to a Bookmark are synchronized from submitted Tag text.
- Related Links are synchronized from the Bookmark description.
- A Tag with no attached Bookmarks is removed.

## Problem

The current module has useful depth internally, but the seam is not named after the main domain workflow. The deletion test suggests the behavior is load-bearing: removing it would spread URL uniqueness checks, Tag synchronization, Related Link synchronization, and DTO mapping across route handlers or tests.

The friction is that the current interface does not clearly say "edit a Bookmark and keep its derived relationships consistent". It says `create` and `update` on a repository, while the implementation does more than persistence.

## Direction

Deepen a Bookmark editing module around create/update behavior. Keep database details, relationship synchronization, duplicate URL handling, and post-write reloading behind the interface.

The route module should know how to parse HTTP input, produce Result responses, and add request logging context. It should not need to know the persistence choreography beyond calling the Bookmark editing module.

## Implementation Plan

1. Characterize existing behavior with focused tests around create/update Bookmark outcomes, including duplicate URLs, Tag attach/detach/orphan deletion, and Related Link insert/delete/retain.
2. Introduce a named module for the Bookmark editing workflow inside the Bookmark backend slice.
3. Move create/update orchestration behind that module while preserving the existing HTTP Result shape and error codes.
4. Keep low-level row-to-DTO mapping private to the persistence implementation unless another real adapter appears.
5. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: deepen bookmark persistence workflow
