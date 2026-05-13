# Add Related Link contract, extraction, and DB invariant

Status: ready-for-agent

## Parent

[pongolinks v0.4 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Introduce the Related Link API shape, backend extraction helper, and database invariant before wiring persistence into Bookmark create/edit flows. The backend should be able to extract the exact set of explicit `http://` and `https://` URLs from Bookmark descriptions, and the database should reject duplicate Related Link URLs for the same Bookmark.

This slice establishes the durable shape and extraction behavior that later slices will use.

## Acceptance criteria

- [ ] `autolinker` is added to backend dependencies.
- [ ] Backend `BookmarkDTO` includes `relatedLinks: { id: number; url: string }[]`.
- [ ] `extract-related-links.ts` exists inside the backend bookmarks vertical slice.
- [ ] Extraction uses `Autolinker.parse(...)`.
- [ ] Extraction only persists explicit `http://` and `https://` URL matches.
- [ ] Extraction ignores bare domains, emails, phone numbers, mentions, and hashtags.
- [ ] Extraction deduplicates repeated URLs by exact string.
- [ ] Extraction allows the Bookmark URL itself when it appears in the description.
- [ ] `packages/db/src/schema.ts` defines a unique database invariant for `related_links(bookmark_id, url)`.
- [ ] A Drizzle migration adds the unique Related Link invariant.
- [ ] Database smoke coverage verifies duplicate `related_links(bookmark_id, url)` rows are rejected.

## Blocked by

None - can start immediately
