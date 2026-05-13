# Add Tag diff synchronization helper

Status: ready-for-agent

## Goal

Replace Bookmark edit Tag replace-all behavior with diff-style synchronization for `bookmark_tags` links.

## Context

v0.3 implemented Tag editing with transactional replace-all semantics. v0.5 changes only the edit path: unchanged Bookmark-Tag links should be retained, newly submitted Tags should be attached, and missing Tags should be detached.

Do not change API payloads, DTOs, or frontend behavior.

## Scope

- Update `apps/backend/src/features/bookmarks/bookmarks-repository.ts`.
- Keep Bookmark create behavior simple: attach submitted Tags to the new Bookmark after find-or-create.
- On Bookmark update, load existing attached Tags for the Bookmark.
- Find or create submitted Tags by `nameLower`.
- Compare submitted and existing Tags by `nameLower`.
- Insert only newly attached `bookmark_tags` rows.
- Delete only detached `bookmark_tags` rows.
- Preserve retained `bookmark_tags` rows.
- Keep `BookmarkDTO.tags` sorted by `nameLower ASC`.
- Keep duplicate Bookmark URL handling unchanged.
- Keep Result-based operational error handling.

## Out Of Scope

- Orphan Tag deletion; that is handled in the next issue.
- evlog diff context; that is handled separately.
- API, DTO, or frontend changes.
- Tag rename, merge, colors, filtering, or user-defined ordering.

## Acceptance Criteria

- Editing a Bookmark from `alpha beta` to `beta gamma` keeps the existing `beta` link, detaches `alpha`, and attaches `gamma`.
- Editing with the same Tags does not delete and recreate existing `bookmark_tags` links.
- Editing with empty `tagsText` detaches all Tags from that Bookmark.
- Existing Tag display casing is preserved when reusing a Tag by `nameLower`.

## Suggested Tests

- Add or update backend smoke tests around `PATCH /api/bookmarks/:id`.
- Assert retained Bookmark-Tag links remain present across edit.
- Assert newly submitted Tags are attached.
- Assert no-longer-submitted Tags are detached.
- Assert empty `tagsText` still clears all Tags from the Bookmark.

