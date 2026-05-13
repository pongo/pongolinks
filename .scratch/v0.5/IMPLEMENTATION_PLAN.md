# pongolinks v0.5 Implementation Plan

Status: approved

## Goal

Replace Bookmark Tag edit behavior with diff-style synchronization and log the Tag diff in request-scoped wide events.

The v0.5 result should stay small: existing Bookmark API and frontend behavior remain unchanged, while backend edit persistence stops using replace-all for Tag links and removes Tags that become orphaned after they are detached.

## Decisions Already Made

- Keep v0.5 backend-only.
- Do not change Bookmark API request payloads, response DTOs, or frontend UI.
- Keep `PATCH /pongolinks/api/bookmarks/:id` as a complete editable payload update.
- Replace Tag link replace-all behavior on Bookmark edit with diff-style synchronization.
- Diff only `bookmark_tags` links for the edited Bookmark.
- Reuse existing Tags by `nameLower` as in v0.3.
- Preserve existing Tag display casing when a submitted Tag reuses an existing `nameLower`.
- Log Tag names using persisted Tag display names, not raw submitted casing.
- Insert only newly attached Bookmark-Tag links.
- Delete only Bookmark-Tag links that are no longer submitted.
- Retain unchanged Bookmark-Tag links without deleting and reinserting them.
- After detaching Tags during edit, check only those detached Tags for orphan status.
- Delete detached Tags that have no remaining Bookmark attachments.
- Do not delete orphan Tags outside this edit-diff workflow in v0.5.
- Future Bookmark delete behavior should reuse the same orphan cleanup helper when a delete workflow exists.
- Keep Tag synchronization and orphan cleanup inside the same database transaction as the Bookmark update.
- Check orphan status immediately before deleting a Tag.
- Do not add special concurrency handling beyond the transaction and immediate orphan check.
- Keep `BookmarkDTO.tags` sorted by `nameLower ASC`.
- Do not introduce user-defined Tag ordering or a `position` column.
- Do not create an ADR for v0.5; the decision is documented in `CONTEXT.md` and this plan.
- Keep comments in code in English.

## Domain Documentation Updates

`CONTEXT.md` now records that Tags attached to a Bookmark are synchronized from submitted Tag text by attaching newly submitted Tags and detaching Tags that are no longer submitted.

`CONTEXT.md` also records that a Tag with no attached Bookmarks is removed.

## Proposed Backend Structure

```txt
apps/backend/src/features/bookmarks/
  bookmark-id.ts
  bookmark-url.ts
  bookmark-validation.ts
  bookmarks-repository.ts
  contracts.ts
  extract-related-links.ts
  routes.ts
  tag-name.ts
```

No new files are required unless implementation shows a small helper module would materially clarify the repository.

## Backend Scope

1. Replace `replaceBookmarkTags` usage during Bookmark update with a diff-style Tag sync.
2. Keep Bookmark create behavior simple: attach submitted Tags to the new Bookmark after find-or-create.
3. Add or reshape repository helpers so Tag find-or-create can return persisted Tag rows before link diffing.
4. Load existing Tag links for the edited Bookmark with persisted Tag rows.
5. Compare submitted Tags to existing attached Tags by `nameLower`.
6. Compute:
   - Tags to attach;
   - Tag links to detach;
   - retained Tag links.
7. Insert `bookmark_tags` rows only for Tags to attach.
8. Delete `bookmark_tags` rows only for Tags to detach.
9. For detached Tags, check whether each Tag has remaining Bookmark attachments after detach.
10. Delete detached Tags that are orphaned.
11. Return the updated Bookmark DTO using the existing read path.
12. Keep duplicate Bookmark URL behavior unchanged.
13. Keep Related Link synchronization behavior unchanged.
14. Keep Result-based operational error handling; do not throw for expected persistence errors.

## evlog Wide Events

Follow ADR-0003 by adding Tag diff context to the request-scoped wide event for Bookmark edit.

For edit, log:

```txt
tags.submittedCount
tags.attachedCount
tags.detachedCount
tags.retainedCount
tags.attachedNames
tags.detachedNames
tags.deletedOrphanNames
```

Use persisted Tag display names for `attachedNames`, `detachedNames`, and `deletedOrphanNames`.

Do not log Tag IDs in v0.5. Do not add `submittedNames` or `retainedNames`.

Create may keep its existing route-level `tags.count` logging; v0.5 does not require a full create diff event.

## Backend API

No API changes.

Existing Bookmark endpoints keep their paths and request payloads.

### `PATCH /pongolinks/api/bookmarks/:id`

Updates the complete editable Bookmark payload, synchronizes Tags by diff, synchronizes Related Links by existing v0.4 behavior, and returns the existing `BookmarkDTO`.

```ts
{
  url: string,
  title: string,
  description: string,
  isPrivate: boolean,
  tagsText: string,
}
```

## Frontend Scope

No frontend changes.

The existing form continues submitting `tagsText`, and the existing list/edit views continue reading `BookmarkDTO.tags`.

## Tests

### Backend

Add or update tests for:

1. `PATCH /api/bookmarks/:id` attaches newly submitted Tags without removing retained Tag links.
2. `PATCH /api/bookmarks/:id` detaches Tags that are no longer submitted.
3. `PATCH /api/bookmarks/:id` preserves retained Bookmark-Tag links across edit.
4. Detached Tags are deleted when they have no remaining Bookmark attachments.
5. Detached Tags are not deleted when they are still attached to another Bookmark.
6. Reused Tags preserve existing display casing and log persisted display names.
7. Edit Tag diff logging includes submitted, attached, detached, and retained counts.
8. Edit Tag diff logging includes attached, detached, and deleted orphan names.
9. Existing empty `tagsText` behavior still clears all Tags from a Bookmark.
10. Existing Related Link sync behavior still works after Tag diffing changes.

### Frontend

No frontend tests are required for v0.5 because API and UI behavior do not change.

## Out Of Scope

- Separate Tag management UI.
- Separate Tag API endpoints.
- Tag filtering, search, autocomplete, colors, rename, or merge.
- User-defined Tag order.
- Adding metadata to `bookmark_tags`.
- Changing Tag parsing rules.
- Changing Tag DTO shape.
- Changing Bookmark API contracts.
- Changing frontend behavior.
- Bookmark delete workflow.
- General orphan cleanup for all Tags.
- Special concurrent edit handling beyond transaction-scoped orphan checks.
- Related Link behavior changes.
- Import/export.
- Browser extension.
- Dev server startup.
- Deploy.
- Git commit by the agent.

## Verification

Run:

```bash
bun run typecheck
bun run agent:test
bun run format
```

Do not run a dev server as part of agent verification.

## Implementation Issues

1. [Add Tag diff synchronization helper](./issues/01-add-tag-diff-synchronization-helper.md)
2. [Delete orphan Tags after edit detach](./issues/02-delete-orphan-tags-after-edit-detach.md)
3. [Log Tag edit diff context](./issues/03-log-tag-edit-diff-context.md)
4. [Regression-test Tag diff with Related Link sync](./issues/04-regression-test-tag-diff-with-related-link-sync.md)

Commit message: feat: plan v0.5 tag synchronization
