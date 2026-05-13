# Autolink Bookmark descriptions in the frontend

Status: ready-for-agent

## Parent

[pongolinks v0.4 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Render Bookmark descriptions with safe Autolinker output in the Bookmark list. The UI should not add a separate Related Links block; descriptions should simply display URL text as clickable inline links while preserving the existing compact list layout.

## Acceptance criteria

- [ ] `autolinker` is added to frontend dependencies.
- [ ] Frontend `BookmarkDTO` includes `relatedLinks: { id: number; url: string }[]`.
- [ ] Cheap API adapter tests are updated for successful Bookmark responses with `relatedLinks`.
- [ ] `autolink-description.ts` exists inside the frontend bookmarks vertical slice.
- [ ] `autolinkBookmarkDescription` calls `Autolinker.link(...)` with `sanitizeHtml: true`.
- [ ] `autolinkBookmarkDescription` disables email, phone, mention, and hashtag parsing.
- [ ] `autolinkBookmarkDescription` uses `newWindow: true` and `className: "bookmark-description-link"`.
- [ ] `BookmarkListView.vue` renders description HTML only from `autolinkBookmarkDescription(bookmark.description)`.
- [ ] Existing whitespace behavior for descriptions is preserved.
- [ ] Description links receive quiet inline styling and do not compete visually with Bookmark titles or Tags.
- [ ] No separate Related Links section, chips, count, or empty state is added.
- [ ] Cheap frontend tests verify HTML escaping, URL linking, and disabled email/phone/mention/hashtag linking.

## Blocked by

- [02-create-and-list-bookmarks-with-related-links.md](./02-create-and-list-bookmarks-with-related-links.md)
