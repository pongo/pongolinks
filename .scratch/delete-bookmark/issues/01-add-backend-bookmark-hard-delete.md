Status: ready-for-agent

# Add backend Bookmark hard delete

## Parent

`.scratch/delete-bookmark/PRD.md`

## What to build

Add the backend hard delete path for Bookmark. A caller should be able to delete a Bookmark through the API and receive the existing Result response shape with the deleted Bookmark id. Deleting a Bookmark must also remove its Related Links and Bookmark-Tag attachments, then delete only the Tags that no longer have any Bookmark attachments.

The implementation should keep deletion in the Bookmark write-side workflow, use the existing Result pattern for operational errors, and preserve the existing `bookmark.not_found` behavior for missing Bookmarks.

## Acceptance criteria

- [ ] `DELETE /bookmarks/:id` exists and accepts the same Bookmark id validation rules as existing Bookmark id routes.
- [ ] Successful deletion returns a Result success payload shaped as `{ deletedBookmarkId: number }`.
- [ ] Successful deletion uses HTTP status `200`.
- [ ] Missing Bookmark deletion returns the existing `bookmark.not_found` error with HTTP status `404`.
- [ ] Bookmark deletion is implemented behind the Bookmark write-side boundary with a small public method for deleting by validated Bookmark id.
- [ ] Deletion runs in a single transaction.
- [ ] Related Links owned by the deleted Bookmark are removed.
- [ ] Bookmark-Tag attachment rows owned by the deleted Bookmark are removed.
- [ ] Tags used only by the deleted Bookmark are removed after deletion.
- [ ] Tags still attached to other Bookmarks are preserved.
- [ ] Operational failures are represented with `Result` errors rather than thrown exceptions.
- [ ] Backend integration coverage verifies successful deletion, cascade behavior, orphan Tag cleanup, shared Tag preservation, and missing Bookmark behavior.
- [ ] API smoke coverage verifies the delete endpoint success response and missing Bookmark response.
- [ ] `bun run typecheck` and `bun run agent:test` pass.

## Blocked by

None - can start immediately.
