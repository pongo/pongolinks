# pongolinks v0.4 Implementation Plan

Status: approved

## Goal

Add derived **Related Links** for Bookmarks by extracting explicit web URLs from Bookmark descriptions after create and edit.

The v0.4 result should stay small: Related Links are persisted and returned through the existing Bookmark API, while the Bookmark list simply renders description URLs as safe clickable links.

## Decisions Already Made

- A **Related Link** is a secondary URL automatically extracted from a Bookmark description.
- Keep v0.4 limited to derived Related Links from `description`.
- Do not add manual Related Link add/edit/delete controls.
- Do not add separate Related Link screens or API endpoints.
- Persisted Related Links come only from explicit `http://` and `https://` URLs.
- Bare domains such as `example.com` may be autolinked in the UI if Autolinker matches them, but they are not persisted as Related Links in v0.4.
- Use `autolinker` for URL extraction and display.
- Backend uses `Autolinker.parse(...)` to extract Related Links for persistence.
- Frontend uses `Autolinker.link(...)` to display clickable Bookmark descriptions.
- Disable email, phone, mention, and hashtag parsing in both backend extraction and frontend display.
- For persisted extraction, configure Autolinker URLs with `schemeMatches: true`, `tldMatches: false`, and `ipV4Matches: false`.
- Deduplicate extracted Related Links per Bookmark by exact URL string.
- Preserve the first-seen order while computing the extracted set, but do not add a `position` column in v0.4.
- A self-link is allowed: if the Bookmark URL appears in the description, it may be stored as a Related Link.
- On edit, synchronize Related Links by diff:
  - insert newly extracted URLs;
  - delete URLs no longer present;
  - keep unchanged rows as-is, including their existing `id`.
- Return Related Links ordered by `id ASC`.
- Add a database-level unique constraint or unique index for `(bookmark_id, url)`.
- Extend `BookmarkDTO` with `relatedLinks: RelatedLinkDTO[]`.
- Do not show a separate Related Links block in the Bookmark list in v0.4.
- Render Bookmark descriptions with `v-html` only from a local helper that calls Autolinker with `sanitizeHtml: true`.
- Use Autolinker defaults for `target="_blank"` and `rel="noopener noreferrer"`.
- Add a link CSS class through Autolinker `className`, without custom `replaceFn` in v0.4.
- Do not create an ADR for v0.4; the decisions are documented in `CONTEXT.md` and this plan.

## Domain Documentation Updates

`CONTEXT.md` now defines **Related Link** as an automatically extracted secondary URL from a Bookmark description.

`CONTEXT.md` also records the synchronization rule: Related Links are synchronized from the Bookmark description by adding newly extracted URLs and removing URLs that are no longer present.

## Proposed Backend Structure

```txt
apps/backend/src/features/bookmarks/
  bookmark-id.ts
  bookmark-url.ts
  bookmark-validation.ts
  bookmarks-repository.ts
  contracts.ts
  extract-related-links.ts
  routes.ts
  tag-name.ts
```

## Proposed Frontend Structure

```txt
apps/frontend/src/features/bookmarks/
  api.ts
  autolink-description.ts
  BookmarkListView.vue
  types.ts
```

## Backend Scope

1. Add `autolinker` to backend dependencies.
2. Add `RelatedLinkDTO` to the bookmarks contract:

   ```ts
   export type RelatedLinkDTO = {
     id: number;
     url: string;
   };
   ```

3. Extend `BookmarkDTO` with `relatedLinks: RelatedLinkDTO[]`.
4. Add `extract-related-links.ts` in the bookmarks vertical slice.
5. Configure extraction to parse only explicit `http://` and `https://` URL matches:
   - `urls: { schemeMatches: true, tldMatches: false, ipV4Matches: false }`;
   - `email: false`;
   - `phone: false`;
   - `mention: false`;
   - `hashtag: false`.
6. Normalize extracted URL matches to the exact URL string returned by Autolinker for URL matches.
7. Deduplicate extracted URLs by exact string while preserving first-seen computation order.
8. Add a unique database constraint or unique index for `related_links(bookmark_id, url)`.
9. Update Drizzle schema and migrations for the unique Related Link invariant.
10. Update repository read paths to include Related Links for list and get.
11. Return Related Links ordered by `id ASC`.
12. On Bookmark create, insert the Bookmark, extract Related Links from the validated description, insert the unique Related Links, attach Tags, and return the full Bookmark DTO.
13. On Bookmark update, update editable Bookmark fields and Tags as before, then synchronize Related Links by diff inside the same transaction.
14. Keep unchanged Related Link rows untouched when their URL remains present after edit.
15. Delete existing Related Link rows whose URL is no longer extracted from the description.
16. Insert Related Link rows for newly extracted URLs.
17. Add evlog context for extracted, inserted, deleted, and retained Related Link counts without logging individual URLs.
18. Keep Result-based operational error handling; do not throw for expected extraction or persistence failures.

## Backend API

Existing Bookmark endpoints keep their paths and request payloads.

### `GET /pongolinks/api/bookmarks`

Returns Bookmarks ordered by `updatedAt DESC`, each with sorted Tags and Related Links ordered by `id ASC`.

```ts
{
  ok: true,
  data: {
    bookmarks: BookmarkDTO[],
  },
}
```

### `GET /pongolinks/api/bookmarks/:id`

Returns one Bookmark with sorted Tags and Related Links ordered by `id ASC`.

### `POST /pongolinks/api/bookmarks`

Creates a Bookmark and derives Related Links from `description`.

```ts
{
  url: string,
  title: string,
  description: string,
  isPrivate: boolean,
  tagsText: string,
}
```

### `PATCH /pongolinks/api/bookmarks/:id`

Updates the complete editable Bookmark payload, replaces Tags using v0.3 semantics, and synchronizes Related Links by diff from the new `description`.

```ts
{
  url: string,
  title: string,
  description: string,
  isPrivate: boolean,
  tagsText: string,
}
```

## Frontend Scope

1. Add `autolinker` to frontend dependencies.
2. Extend frontend `BookmarkDTO` with `relatedLinks: RelatedLinkDTO[]`.
3. Update API adapter tests to expect `relatedLinks`.
4. Add `autolink-description.ts` in the bookmarks vertical slice.
5. Configure display autolinking with:
   - `sanitizeHtml: true`;
   - `newWindow: true`;
   - `className: "bookmark-description-link"`;
   - `email: false`;
   - `phone: false`;
   - `mention: false`;
   - `hashtag: false`.
6. Render Bookmark descriptions in `BookmarkListView.vue` with `v-html` only from `autolinkBookmarkDescription(bookmark.description)`.
7. Preserve `whitespace-pre-wrap` description behavior.
8. Add quiet link styling for `.bookmark-description-link`.
9. Do not add a separate Related Links section, count, chip list, or empty state.

## Frontend UI Notes

The Bookmark list remains a compact working interface. Description links should look like normal inline text links and should not visually compete with Bookmark titles or Tags.

The UI must use English user-facing text. No explanatory product copy is needed for Related Links in v0.4 because extraction is automatic.

## Tests

### Backend

Add tests for:

1. Related Link extraction returns only explicit `http://` and `https://` URLs.
2. Related Link extraction ignores bare domains, emails, phone numbers, mentions, and hashtags.
3. Related Link extraction deduplicates repeated URLs by exact string.
4. `POST /api/bookmarks` creates Related Links from description URLs and returns `relatedLinks`.
5. `POST /api/bookmarks` allows the Bookmark URL itself to appear as a Related Link when present in the description.
6. `GET /api/bookmarks` returns each Bookmark with `relatedLinks: []` when none exist.
7. `GET /api/bookmarks/:id` returns Related Links ordered by `id ASC`.
8. `PATCH /api/bookmarks/:id` inserts newly extracted Related Links.
9. `PATCH /api/bookmarks/:id` deletes Related Links removed from the description.
10. `PATCH /api/bookmarks/:id` preserves the `id` of an unchanged Related Link URL.
11. The database rejects duplicate `related_links(bookmark_id, url)` rows.
12. Existing Bookmark URL, Tag, and `updatedAt` behavior still works after Related Link synchronization is added.

### Frontend

Add or update cheap tests for:

1. API adapter/envelope parsing handles successful Bookmark responses with `relatedLinks`.
2. `autolinkBookmarkDescription` escapes existing HTML when `sanitizeHtml: true`.
3. `autolinkBookmarkDescription` turns URL text into links.
4. `autolinkBookmarkDescription` does not link emails, phone numbers, mentions, or hashtags.

Do not introduce a Vue component testing stack in v0.4.

## Out Of Scope

- Manual Related Link creation.
- Manual Related Link editing.
- Manual Related Link deletion.
- Separate Related Link API endpoints.
- Separate Related Link UI sections, chips, counters, or detail pages.
- Related Link titles, notes, statuses, previews, favicons, or metadata fetching.
- Related Link ordering through a `position` column.
- URL canonicalization beyond exact Autolinker output.
- Bare-domain persistence.
- Search or filtering by Related Link.
- Delete Bookmark workflow.
- Import/export.
- Browser extension.
- Dev server startup.
- Deploy.
- Git commit by the agent.

## Verification

Run:

```bash
bun run typecheck
bun run agent:test
bun run format
```

Do not run a dev server as part of agent verification.

## Implementation Issues

1. [Add Related Link contract, extraction, and DB invariant](./issues/01-add-related-link-contract-extraction-and-db-invariant.md)
2. [Create and list Bookmarks with Related Links](./issues/02-create-and-list-bookmarks-with-related-links.md)
3. [Synchronize Related Links by diff on Bookmark edit](./issues/03-synchronize-related-links-by-diff-on-edit.md)
4. [Autolink Bookmark descriptions in the frontend](./issues/04-autolink-bookmark-descriptions-in-frontend.md)

Commit message: feat: plan v0.4 related links
