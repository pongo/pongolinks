# Paginate Bookmark list API

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.10 Implementation Plan](../plan.md)

## What to build

Add page-based pagination to the Bookmark list API so a caller can request one page of Bookmarks and receive enough metadata to render ordinary page links. The API should keep the current Bookmark DTO contents, including Tags and Related Links, while returning only the requested page.

Use ordinary offset/limit pagination for this slice. Page size is owned by the backend and is temporarily set to `3` for verification.

## Acceptance criteria

- [ ] `GET /api/bookmarks` accepts an optional `page` query parameter.
- [ ] Missing, invalid, zero, negative, and fractional `page` values are treated as page 1.
- [ ] The Bookmark list query returns at most 3 Bookmarks.
- [ ] The Bookmark list order is deterministic: `updatedAt DESC, id DESC`.
- [ ] The response includes `bookmarks` and `pagination`.
- [ ] `pagination` includes `page`, `pageSize`, `totalCount`, `totalPages`, `hasPreviousPage`, and `hasNextPage`.
- [ ] When there are no Bookmarks, the response has `page = 1`, `totalCount = 0`, `totalPages = 0`, and both navigation flags false.
- [ ] When `page` is greater than the last page, the response has an empty `bookmarks` array and the real `totalCount` and `totalPages`.
- [ ] Existing Bookmark list DTO fields, Tags, and Related Links are still returned for page rows.
- [ ] Backend smoke/API coverage verifies page size, metadata, invalid page normalization, deep empty pages, and deterministic ordering.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.
