# Delete Bookmark

## Context

The Bookmark edit view needs a destructive action for removing the current Bookmark.

Relevant domain rules from `CONTEXT.md`:

- A Bookmark can have zero or more Tags.
- A Bookmark can have zero or more Related Links.
- A Related Link belongs to exactly one Bookmark.
- A Tag with no attached Bookmarks is removed.

Relevant implementation facts:

- `related_links.bookmark_id` already uses `ON DELETE CASCADE`.
- `bookmark_tags.bookmark_id` already uses `ON DELETE CASCADE`.
- Tags are reusable rows, so SQLite will not delete orphan Tags automatically.

## Problem

Deleting a Bookmark must remove the Bookmark and all derived or attached relationship data without leaving orphan Tags. The UI also needs a clear destructive action in the edit flow without introducing a custom confirmation surface.

## Direction

Add hard delete behavior for Bookmarks.

The edit view should show a red `Delete` button in the lower action row, aligned to the right while the save action remains on the left. Clicking `Delete` should open a browser `confirm` dialog with text such as `Delete this bookmark? This action cannot be undone.`

On confirmation, the frontend calls `DELETE /bookmarks/:id`. On success, it navigates to `/`. On failure, it shows the API form error in the existing form error surface.

The backend should keep deletion on the Bookmark write side by adding a `delete(id, log?)` method to `BookmarkEditor`. The endpoint returns the existing Result response shape with `{ deletedBookmarkId: number }` and status `200`. Missing Bookmarks return the existing `bookmark.not_found` error with status `404`.

Deletion should run in a transaction:

1. Find the Bookmark and its current Tag attachment rows.
2. Delete the Bookmark.
3. Let SQLite cascade delete Related Links and Bookmark-Tag attachment rows.
4. Delete any Tags from the captured attachment rows that now have no Bookmark attachments.

## Out of Scope

- Soft delete, undo, trash, or restore behavior.
- A custom modal confirmation component.
- Changing existing Tag or Related Link schema constraints.
- Changing create/update Bookmark behavior.

## Implementation Plan

1. Add backend `BookmarkEditor` integration coverage for deleting a Bookmark, cascading Related Links and Bookmark-Tag rows, preserving shared Tags, deleting single-use orphan Tags, and returning `bookmark.not_found` for missing Bookmarks.
2. Add a Bookmark delete API smoke suite for `DELETE /bookmarks/:id`, including success and missing Bookmark cases.
3. Add `BookmarkEditor.delete(id, log?)` using the existing Result pattern and a single database transaction.
4. Add the `DELETE /bookmarks/:id` route with existing `BookmarkId` parsing, route logging, `resultResponse`, and the `{ deletedBookmarkId }` success payload.
5. Add a frontend `deleteBookmark(id)` API helper and include the success payload type.
6. Update `BookmarkForm.vue` so it can optionally render a destructive delete action in the bottom row, with independent `isSaving` and `isDeleting` states while blocking both actions during either operation.
7. Update `EditBookmarkView.vue` to confirm deletion with the browser dialog, call the delete API, route to `/` on success, and surface API errors through the existing form error state.
8. Re-run `bun run typecheck` and `bun run agent:test`.

feat: add bookmark deletion flow
