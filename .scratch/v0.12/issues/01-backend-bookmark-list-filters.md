# Backend bookmark list filters

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.12 Implementation Plan](../plan.md)

## What to build

Extend the Bookmark list backend API so `GET /api/bookmarks` can return paginated Bookmark list results for broad search, strict Tag filters, exact Domain filters, and special URL lookup mode.

Keep this behavior in the Bookmarks vertical slice because the endpoint returns Bookmark list DTOs, pagination metadata, Tags, and Related Links. Do not make backend HTTP routes call each other.

## Acceptance criteria

- [ ] `GET /api/bookmarks` accepts optional `q`, repeated `tag`, `domain`, `url`, and `page` query parameters.
- [ ] `url` is mutually exclusive with `q`, `tag`, and `domain`.
- [ ] Mixed `url` mode returns a validation error.
- [ ] `url` validates through the existing Bookmark URL value object.
- [ ] URL lookup matches exact Bookmark URL, alternate-protocol Bookmark URL, and exact or alternate-protocol Related Links.
- [ ] URL lookup returns full Bookmark list DTOs with Tags and Related Links.
- [ ] `/search/check` and `/bookmarks?url=...` share URL matching semantics through a common helper or repository method, not an internal HTTP call.
- [ ] `q` searches Bookmark title, description, URL, Related Link URL, and Tag name.
- [ ] `q` uses AND semantics across whitespace tokens.
- [ ] `q` uses prefix matching for FTS title/description tokens and escapes user input before `MATCH`.
- [ ] `q` does not support quoted phrases or negative full-text words.
- [ ] Positive repeated `tag` filters use AND semantics.
- [ ] Negative `tag=-name` filters exclude Bookmarks with that Tag.
- [ ] Duplicate Tags are deduped after normalization.
- [ ] Contradictory include/exclude Tags return a validation error.
- [ ] `domain` filters by exact Bookmark URL hostname for both `http` and `https`.
- [ ] `domain` does not match sibling domains or subdomains.
- [ ] Pagination metadata reflects the filtered result set.
- [ ] Result ordering remains `updatedAt DESC, id DESC`.
- [ ] Backend API/smoke coverage verifies search, include Tags, exclude Tags, contradictory Tags, exact Domain matching, URL lookup, mixed URL mode validation, pagination counts, and ordering.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.
