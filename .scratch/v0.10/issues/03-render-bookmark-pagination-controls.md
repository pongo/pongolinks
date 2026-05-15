# Render Bookmark pagination controls

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.10 Implementation Plan](../plan.md)

## What to build

Render ordinary page-based pagination on the Bookmark list page using the metadata returned by the Bookmark list API. After the Bookmark list, show the total Bookmark count and then a compact pagination control when more than one page exists.

Page links should be real router links. Page 1 should generate the canonical `/` URL, while later pages should use `/?page=N`.

## Acceptance criteria

- [ ] The frontend Bookmark API adapter accepts an optional page number.
- [ ] The adapter sends no `page` query for page 1 and sends `page=N` for pages greater than 1.
- [ ] Frontend types and API payload parsing include the backend `pagination` metadata.
- [ ] The Bookmark list view reads the current page from `route.query.page`.
- [ ] Invalid frontend page query values normalize to page 1.
- [ ] The list reloads when the route page query changes.
- [ ] Total Bookmark count renders after the Bookmark list.
- [ ] Pagination controls render only when `totalPages > 1`.
- [ ] The pagination control shows a centered 5-page window when possible.
- [ ] The pagination control clamps the 5-page window near the beginning and end.
- [ ] The pagination control shows `1 ...` before the window when page 1 is outside it.
- [ ] The pagination control shows `... lastPage` after the window when the last page is outside it.
- [ ] Page number controls are links.
- [ ] The previous page control is an icon-only Lucide chevron link with `aria-label="Previous page"`.
- [ ] The next page control is an icon-only Lucide chevron link with `aria-label="Next page"`.
- [ ] Previous and next controls are not rendered when unavailable.
- [ ] Frontend tests cover API payload parsing and pagination-window behavior.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- [Paginate Bookmark list API](./01-paginate-bookmark-list-api.md)
