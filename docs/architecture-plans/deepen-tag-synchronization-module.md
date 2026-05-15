# Deepen Tag Synchronization Module

Status: Deferred for v0.9. Tag synchronization may be extracted only as a private collaborator of `BookmarkEditor`; it should not become a separate top-level architecture boundary until another real caller or adapter appears.

## Context

Tag behavior is currently split across the Bookmark and Tag slices:

- `apps/backend/src/features/bookmarks/domain/tag-name.ts` parses submitted Tag text into validated Tag names.
- `apps/backend/src/features/bookmarks/bookmarks-repository.ts` attaches, detaches, creates, and deletes orphan Tags while editing Bookmarks.
- `apps/backend/src/features/tags/tags-repository.ts` reads Tag summaries ordered by Tag Popularity.

This matches the current vertical slices, but the Tag synchronization rules are important enough to deserve a clearer seam as the project grows.

## Problem

The Bookmark repository owns Tag attachment mechanics as private implementation detail. That keeps callers simple, but it makes Tag behavior harder to find, test, and evolve. Future changes to Tag names, Tag Popularity, or orphan deletion would require maintainers to inspect Bookmark persistence internals.

The deletion test says the behavior should stay concentrated: deleting it would spread Tag dedupe, find-or-create, attach/detach, and orphan deletion logic into Bookmark create/update flows.

## Direction

Create a deep Tag synchronization module inside the backend Bookmark slice unless a second real adapter appears. The module should be named after the domain rule: synchronizing Tags attached to a Bookmark from submitted Tag text.

It should own:

- Turning validated Tag names into persisted Tags.
- Attaching newly submitted Tags.
- Detaching removed Tags.
- Removing orphan Tags.
- Returning synchronization counts for observability.

The Tag summary/read feature can remain separate because it exposes Tag Popularity for frontend suggestions rather than editing Bookmark attachments.

## Implementation Plan

1. Add tests around Tag synchronization behavior using a small database fixture or repository-level integration test.
2. Extract Tag synchronization from `BookmarksRepository` into a feature-local module with a small interface.
3. Keep `TagName` validation as the input type so invalid whitespace-containing Tags are still rejected before persistence.
4. Preserve observability counts currently returned by `syncBookmarkTags`.
5. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: deepen bookmark tag synchronization
