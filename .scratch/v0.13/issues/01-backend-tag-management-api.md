# Backend Tag management API

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.13 Implementation Plan](../plan.md)

## What to build

Extend the existing backend Tags slice with mutation endpoints for editing and deleting Tags, plus a read endpoint for Bookmarks without Tags.

Keep behavior in `apps/backend/src/features/tags/`. Use Result-based operational error handling and Tag-specific error codes.

## Acceptance criteria

- [ ] `PATCH /api/tags/:id` accepts `{ name: string }`.
- [ ] `PATCH /api/tags/:id` validates `id` as a positive integer.
- [ ] `PATCH /api/tags/:id` validates `name` as non-empty and whitespace-free.
- [ ] Invalid Tag names return `tag.name_invalid`.
- [ ] Missing source Tags return `tag.not_found`.
- [ ] If submitted `nameLower` equals the source `nameLower`, only `tags.name` is updated.
- [ ] If submitted `nameLower` differs and no replacement Tag exists, the source Tag row is updated to the new `name/nameLower`.
- [ ] If submitted `nameLower` differs and a replacement Tag exists, source attachments are transferred to the replacement Tag without duplicate `(bookmark_id, tag_id)` rows.
- [ ] Merge replacement deletes source Tag attachments and then deletes the source Tag.
- [ ] Replace/merge behavior runs in a database transaction.
- [ ] `DELETE /api/tags/:id` deletes the Tag row and relies on `bookmark_tags.tag_id ON DELETE CASCADE`.
- [ ] Deleting a Tag does not delete Bookmarks.
- [ ] `DELETE /api/tags/:id` returns `tag.not_found` for a missing Tag.
- [ ] `GET /api/tags/untagged-bookmarks` returns `{ totalCount, bookmarks }`.
- [ ] Untagged Bookmarks are sorted by `updatedAt DESC, id DESC`.
- [ ] Untagged Bookmark response contains at most 100 rows.
- [ ] Tag-specific error codes are added to the shared API error union.
- [ ] Backend API/smoke coverage verifies update, replace, merge, delete, not-found, invalid names, untagged count/list, and usageCount correctness.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.
