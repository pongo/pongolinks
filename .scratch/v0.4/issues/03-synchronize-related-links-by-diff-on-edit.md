# Synchronize Related Links by diff on Bookmark edit

Status: ready-for-agent

## Parent

[pongolinks v0.4 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Extend Bookmark edit so Related Links are synchronized from the new description using a real diff. New extracted URLs should be inserted, removed URLs should be deleted, and unchanged URLs should keep their existing rows and `id`.

The diff should run in the same transaction as the Bookmark update and v0.3 Tag replacement.

## Acceptance criteria

- [ ] `PATCH /pongolinks/api/bookmarks/:id` extracts Related Links from the submitted `description`.
- [ ] Newly extracted Related Link URLs are inserted.
- [ ] Related Link URLs no longer present in the description are deleted.
- [ ] Related Link URLs present before and after edit keep their existing row and `id`.
- [ ] Saving a description with no explicit `http://` or `https://` URLs clears Related Links for that Bookmark.
- [ ] Bookmark update, Tag replacement, and Related Link diff run in one transaction.
- [ ] Updated Bookmarks return final `relatedLinks` ordered by `id ASC`.
- [ ] evlog context includes inserted, deleted, and retained Related Link counts without logging individual URLs.
- [ ] Existing Bookmark URL, Tag, and `updatedAt` update behavior still works.

## Blocked by

- [02-create-and-list-bookmarks-with-related-links.md](./02-create-and-list-bookmarks-with-related-links.md)
