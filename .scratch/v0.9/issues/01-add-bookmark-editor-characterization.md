# Add focused BookmarkEditor integration characterization

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.9 BookmarkEditor PRD](../PRD.md)

## What to build

Add focused integration characterization for the current Bookmark create/update write behavior before extracting `BookmarkEditor`. The coverage should describe the externally visible consistency guarantees for edited Bookmark state, using a Bun-backed integration script launched from Vitest because the current database client uses `bun:sqlite`.

This slice should not introduce the new `BookmarkEditor` boundary yet. It should make the existing behavior safe to move in later slices.

## Acceptance criteria

- [ ] A Vitest test launches a Bun integration script for Bookmark write behavior, following the existing backend smoke-test pattern.
- [ ] The integration coverage uses a migrated in-memory SQLite database fixture.
- [ ] Create rejects a duplicate Bookmark URL with the existing error code and status semantics.
- [ ] Create attaches submitted Tags and inserts Related Links extracted from the Bookmark description.
- [ ] Update rejects a URL already used by another Bookmark.
- [ ] Update returns the existing not-found error for a missing Bookmark.
- [ ] Update retains an existing Tag attachment row when a Tag remains submitted.
- [ ] Update detaches removed Tags and deletes only orphan Tags.
- [ ] Update preserves a shared Tag when another Bookmark is still attached to it.
- [ ] Update retains an existing Related Link row when the URL remains in the description.
- [ ] Update deletes removed Related Links and inserts new Related Links.
- [ ] Existing API smoke coverage still passes.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.

