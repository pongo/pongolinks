# Add deterministic Bookmark list index

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.10 Implementation Plan](../plan.md)

## What to build

Add the database support needed for the paginated Bookmark list order. The list is ordered by recently updated Bookmark first, with Bookmark id as the tie-breaker, so the database index should match `updated_at DESC, id DESC`.

This keeps page order stable when several Bookmarks have the same update timestamp and gives the offset/limit query a suitable index for the expected 30-50k Bookmark production size.

## Acceptance criteria

- [ ] A migration adds an index on `bookmarks(updated_at DESC, id DESC)`.
- [ ] The Drizzle schema declares the matching Bookmark list index.
- [ ] The old single-column `updated_at` index is dropped if it is redundant after the compound index exists.
- [ ] Migration tests or schema checks reflect the new index shape.
- [ ] Bookmark list ordering remains `updatedAt DESC, id DESC`.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.
