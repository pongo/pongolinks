# Create Bookmark with Tags

Status: ready-for-agent

## Parent

[pongolinks v0.3 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Allow the Bookmark creation form to attach Tags using a plain space-separated `Tags` text field. Submitting the create form should create the Bookmark, create or reuse Tags by `nameLower`, attach them to the Bookmark, and return the created Bookmark with unique Tags sorted by `nameLower`.

The create flow should keep backend parsing and normalization authoritative; the frontend only sends the entered `tagsText`.

## Acceptance criteria

- [ ] The Bookmark create form has a single-line `Tags` input with user-facing English copy and submits `tagsText`.
- [ ] `POST /pongolinks/api/bookmarks` accepts the complete editable Bookmark payload plus `tagsText`.
- [ ] Tag input is split on whitespace, empty parts are ignored, and duplicate submitted Tags are deduplicated by `nameLower`.
- [ ] New Tags are persisted with app-maintained `nameLower`.
- [ ] Existing Tags are reused by `nameLower`.
- [ ] A Bookmark created with `tagsText: "article lang-ru article"` returns exactly two Tags sorted by `nameLower`.
- [ ] Created Bookmarks appear in the list with Tag chips.
- [ ] Duplicate Bookmark URL behavior from v0.2 still returns the expected conflict error.

## Blocked by

- [01-add-tag-contract-and-list-display.md](./01-add-tag-contract-and-list-display.md)
