# pongolinks v0.10 Implementation Plan

Status: approved

## Goal

Add ordinary page-based pagination to the Bookmark list. The v0.10 result should keep the list simple and linkable: no infinite scrolling, a fixed backend-owned page size, deterministic ordering, total Bookmark count after the list, and a compact pagination control.

## Decisions Already Made

- Use ordinary offset/limit pagination for v0.10.
- Do not implement deferred joins yet.
- Revisit deferred joins only after measuring slow deep pages on realistic data.
- Use `updatedAt DESC, id DESC` as the Bookmark list order.
- Add or update the database index to match `updated_at DESC, id DESC`.
- Represent the current page with a query parameter: `/?page=2`.
- Page 1 canonical URL is `/`.
- Accept `/?page=1`, but generated links should omit `page` for page 1.
- Normalize invalid frontend `page` values to page 1.
- Backend also treats missing or invalid `page` as page 1.
- If `page > lastPage`, return an empty page with real `totalCount` and pagination metadata; do not redirect.
- Return pagination metadata from the API instead of making the frontend recalculate it.
- When `totalCount = 0`, return `totalPages = 0`, `page = 1`, and both navigation flags false.
- Show the pagination control only when `totalPages > 1`.
- Use a centered 5-page window when possible.
- When the 5-page window does not include page 1, show `1 ...` before the window.
- When the 5-page window does not include the last page, show `... lastPage` after the window.
- Previous/next controls are icon-only Lucide chevron links with accessible labels.
- Do not render missing previous/next controls.
- Page size is backend-owned.
- Use a temporary backend page size of `3` for easier verification.
- Frontend reads `pagination.pageSize` from the API and does not send `pageSize`.
- Do not create an ADR for v0.10.

## Domain Documentation Updates

No `CONTEXT.md` updates are required for v0.10.

Pagination, page size, offset/limit, API metadata, and index shape are implementation concerns, not domain language.

## Backend API

Extend `GET /api/bookmarks` to accept an optional `page` query parameter.

The response shape should be:

```ts
{
  bookmarks: BookmarkDTO[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
```

Rules:

- Missing, invalid, zero, negative, and fractional `page` values normalize to `1`.
- Page size is a backend constant set to `3` in v0.10.
- `totalPages = Math.ceil(totalCount / pageSize)` when `totalCount > 0`.
- `totalPages = 0` when `totalCount = 0`.
- `hasPreviousPage` is true when `page > 1` and there is at least one page.
- `hasNextPage` is true when `page < totalPages`.
- `page > totalPages` returns an empty `bookmarks` array and real metadata.

## Repository and Database Scope

Update the Bookmark list query to:

- order by `updatedAt DESC, id DESC`;
- apply `limit`;
- apply `offset`;
- return only one page of Bookmarks with existing Tags and Related Links included;
- run a `count(*)` query for the total Bookmark count.

Add or update a database index matching the list order:

```sql
CREATE INDEX idx_bookmarks_updated_at_id ON bookmarks (updated_at DESC, id DESC);
```

If the existing `idx_bookmarks_updated_at` index is redundant after the new index is added, drop it in the same migration.

## Frontend Scope

Update the Bookmark list page to:

- read `page` from `route.query.page`;
- normalize invalid values to page 1 for frontend state;
- call `listBookmarks(page)`;
- generate `/` for page 1 links;
- generate `/?page=N` for pages greater than 1;
- render total Bookmark count after the list;
- render pagination controls after total count when `totalPages > 1`.

Pagination window rules:

- show a centered 5-page window when possible;
- clamp the window at the beginning and end;
- show `1 ...` before the window when page 1 is outside it;
- show `... lastPage` after the window when the last page is outside it.

Previous and next controls:

- use Lucide chevrons;
- render as links;
- use `aria-label="Previous page"` and `aria-label="Next page"`;
- do not render when unavailable.

## Tests

Add or update coverage for:

- backend API response metadata;
- backend page size of 3;
- invalid `page` normalization;
- `page > lastPage` returning an empty page with real metadata;
- deterministic ordering by `updatedAt DESC, id DESC`;
- frontend API payload parsing with pagination metadata;
- pagination-window helper behavior.

Run:

```bash
bun run typecheck
bun run agent:test
bun run format
```

Do not run a dev server.

## Implementation Issues

1. [Paginate Bookmark list API](./issues/01-paginate-bookmark-list-api.md)
2. [Add deterministic Bookmark list index](./issues/02-add-deterministic-bookmark-list-index.md)
3. [Render Bookmark pagination controls](./issues/03-render-bookmark-pagination-controls.md)

Commit message: feat(bookmarks): add paginated bookmark list
