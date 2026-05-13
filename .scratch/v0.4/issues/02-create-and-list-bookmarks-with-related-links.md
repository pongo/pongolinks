# Create and list Bookmarks with Related Links

Status: ready-for-agent

## Parent

[pongolinks v0.4 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Wire Related Link extraction into Bookmark creation and read paths. Creating a Bookmark should derive Related Links from the submitted description, persist the unique extracted URL set, and return the created Bookmark with `relatedLinks`. Listing and fetching Bookmarks should include Related Links for every Bookmark, using an empty array when none exist.

This slice should not change Bookmark edit behavior yet.

## Acceptance criteria

- [ ] Repository read paths include Related Links for `list` and `findById`.
- [ ] Related Links are returned ordered by `id ASC`.
- [ ] `GET /pongolinks/api/bookmarks` returns `relatedLinks: []` for Bookmarks without Related Links.
- [ ] `GET /pongolinks/api/bookmarks/:id` returns `relatedLinks: []` for a Bookmark without Related Links.
- [ ] `POST /pongolinks/api/bookmarks` extracts Related Links from `description`.
- [ ] `POST /pongolinks/api/bookmarks` persists unique extracted Related Links in the same transaction as Bookmark creation.
- [ ] `POST /pongolinks/api/bookmarks` returns the created Bookmark with `relatedLinks`.
- [ ] `POST /pongolinks/api/bookmarks` can return the Bookmark URL itself as a Related Link when present in the description.
- [ ] Existing Tag creation and duplicate Bookmark URL behavior still work after Related Link persistence is added.
- [ ] evlog context includes extracted and inserted Related Link counts without logging individual URLs.

## Blocked by

- [01-add-related-link-contract-extraction-and-db-invariant.md](./01-add-related-link-contract-extraction-and-db-invariant.md)
