Status: ready-for-agent

# Add frontend Edit Bookmark delete action

## Parent

`.scratch/delete-bookmark/PRD.md`

## What to build

Add the user-facing delete action to the Edit Bookmark flow. The edit form should show a destructive `Delete` action in the lower action row, visually separated from the save action. Clicking it should ask for browser confirmation, call the Bookmark delete API only when confirmed, show pending/error state through the existing form workflow, and navigate back to the Bookmark list after success.

The create flow should keep its current behavior and should not show a delete action.

## Acceptance criteria

- [ ] The frontend has a Bookmark delete API helper that calls `DELETE /bookmarks/:id`.
- [ ] The frontend has a type for the `{ deletedBookmarkId: number }` success payload.
- [ ] Delete API errors use the existing Bookmark API error parsing and map `bookmark.not_found` to the form error surface.
- [ ] The Bookmark form can optionally render a destructive `Delete` action.
- [ ] The delete action appears in the Edit Bookmark flow and does not appear in the Create Bookmark flow.
- [ ] The save action remains on the left side of the lower action row.
- [ ] The delete action is aligned to the right side of the lower action row.
- [ ] The delete action is visually destructive and uses English UI text.
- [ ] Clicking `Delete` opens a browser confirmation dialog before any API call.
- [ ] Cancelling the confirmation leaves the user on the edit page and does not call the delete API.
- [ ] Confirming deletion calls the delete API for the current Bookmark id.
- [ ] Successful deletion navigates to `/`.
- [ ] Failed deletion displays the API form error using the existing error surface.
- [ ] Save and delete have separate pending states.
- [ ] While saving or deleting, both actions are disabled to prevent overlapping requests.
- [ ] Pending delete state uses English UI text such as `Deleting...`.
- [ ] Frontend API coverage verifies delete payload parsing and relevant error mapping where not already covered.
- [ ] `bun run typecheck` and `bun run agent:test` pass.

## Blocked by

- `.scratch/delete-bookmark/issues/01-add-backend-bookmark-hard-delete.md`
