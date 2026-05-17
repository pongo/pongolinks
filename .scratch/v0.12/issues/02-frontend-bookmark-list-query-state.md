# Frontend bookmark list query state

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.12 Implementation Plan](../plan.md)

## What to build

Add a search field above the Bookmark list and make the home route `/` support canonical search/filter query state.

The field should display a human-readable mini-query, while route query parameters stay structured as `q`, repeated `tag`, `domain`, `url`, and `page`.

## Acceptance criteria

- [ ] The home route `/` remains the canonical Bookmark list route for unfiltered and filtered states.
- [ ] The frontend Bookmark list API adapter sends `q`, repeated `tag`, `domain`, `url`, and `page` to `GET /api/bookmarks`.
- [ ] Route query state is parsed into the Bookmark list request.
- [ ] Search form submit uses `router.push`.
- [ ] Search form submit resets `page` and omits `page=1`.
- [ ] A full-field HTTP(S) URL submits as `url`.
- [ ] A URL mixed with other tokens is parsed as ordinary mini-query input, not URL lookup mode.
- [ ] Plain words submit as `q`.
- [ ] `#tag` submits as include `tag`.
- [ ] `-#tag` submits as exclude `tag=-tag`.
- [ ] `@example.com` submits as `domain=example.com`.
- [ ] Existing route query state renders back into the field as mini-query text.
- [ ] Pagination links preserve active `q`, `tag`, `domain`, or `url` query parameters.
- [ ] The empty state distinguishes no Bookmarks, no matching Bookmarks, and no Bookmarks on this page.
- [ ] A clear action is shown when `q`, `tag`, `domain`, or `url` is active.
- [ ] Clear search navigates to `/`.
- [ ] Frontend coverage verifies mini-query parsing, route query serialization, URL-state-to-field rendering, page reset, pagination preservation, and clear behavior.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

[Backend bookmark list filters](./01-backend-bookmark-list-filters.md)
