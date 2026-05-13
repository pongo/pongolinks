# Edit Bookmark Tags with replace-all semantics

Status: ready-for-agent

## Parent

[pongolinks v0.3 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Extend the Bookmark edit flow so the form is initialized from the Bookmark's current Tags and saving replaces all Tag links for that Bookmark. The replacement should happen transactionally with the Bookmark update so the saved Bookmark has exactly the submitted set of Tags.

An empty `Tags` input should clear all Tag links for the Bookmark without deleting orphan Tag rows.

## Acceptance criteria

- [ ] `GET /pongolinks/api/bookmarks/:id` returns existing Tags sorted by `nameLower`.
- [ ] The edit form initializes `tagsText` from `bookmark.tags.map((tag) => tag.name).join(" ")`.
- [ ] `PATCH /pongolinks/api/bookmarks/:id` accepts the complete editable Bookmark payload plus `tagsText`.
- [ ] Saving the edit form replaces all existing Tag links for the Bookmark.
- [ ] Saving with an empty `tagsText` clears all Tag links for that Bookmark.
- [ ] Bookmark update plus Tag link replacement runs in a transaction.
- [ ] Orphan rows in `tags` are not deleted.
- [ ] Updated Bookmarks return and list their final Tags sorted by `nameLower`.

## Blocked by

- [02-create-bookmark-with-tags.md](./02-create-bookmark-with-tags.md)
