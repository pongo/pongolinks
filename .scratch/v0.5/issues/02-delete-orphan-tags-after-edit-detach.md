# Delete orphan Tags after edit detach

Status: ready-for-agent

## Goal

Delete Tags that become orphaned after they are detached during Bookmark edit.

## Context

`CONTEXT.md` now says a Tag with no attached Bookmarks is removed. v0.5 applies that rule narrowly: only Tags detached by the current edit diff are checked for orphan status.

## Scope

- Update `apps/backend/src/features/bookmarks/bookmarks-repository.ts`.
- After deleting detached `bookmark_tags` links, check each detached Tag for remaining Bookmark attachments.
- Delete a detached Tag only when it has no remaining Bookmark attachments.
- Perform detach, orphan check, and orphan delete inside the same Bookmark update transaction.
- Check orphan status immediately before deleting the Tag.
- Keep the cleanup helper reusable for a future Bookmark delete workflow, but do not implement Bookmark delete.

## Out Of Scope

- General cleanup of all existing orphan Tags.
- Bookmark delete workflow.
- Special concurrency handling beyond the existing transaction and immediate orphan check.
- Changing Tag table schema.

## Acceptance Criteria

- A detached Tag is deleted when it is no longer attached to any Bookmark.
- A detached Tag remains when it is still attached to another Bookmark.
- Tags retained on the edited Bookmark are not checked or deleted.
- Tags attached during the edit are not deleted.

## Suggested Tests

- Add a backend test where a Tag attached only to the edited Bookmark is detached and removed from `tags`.
- Add a backend test where a Tag attached to two Bookmarks is detached from one Bookmark and remains in `tags`.
- Keep the empty `tagsText` case covered: all detached single-use Tags should be removed.

