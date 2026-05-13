# Add Tag contract and list display

Status: ready-for-agent

## Parent

[pongolinks v0.3 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Introduce Tags into the Bookmark API contract and frontend list rendering without changing Bookmark editing behavior yet. Bookmarks returned from list/get should include a `tags` array shaped as `{ id, name, nameLower }[]`; existing Bookmarks with no Tags should return an empty array. The Bookmark list should render attached Tags as compact chips next to the Bookmark domain and hide the chips when there are no Tags.

This slice establishes the end-to-end shape that later create/edit slices will fill with real Tag attachment behavior.

## Acceptance criteria

- [ ] `BookmarkDTO` includes `tags: { id: number; name: string; nameLower: string }[]` in backend and frontend types.
- [ ] `GET /pongolinks/api/bookmarks` returns `tags: []` for Bookmarks without Tags.
- [ ] `GET /pongolinks/api/bookmarks/:id` returns `tags: []` for a Bookmark without Tags.
- [ ] The frontend Bookmark list renders Tag chips to the right of the Bookmark domain when Tags are present.
- [ ] The frontend Bookmark list shows no Tag chip area for Bookmarks without Tags.
- [ ] Cheap frontend API parsing tests are updated for successful Bookmark responses with `tags`.
- [ ] Existing Bookmark list behavior still works for title, domain, description, privacy marker, edit link, and updated date.

## Blocked by

None - can start immediately
