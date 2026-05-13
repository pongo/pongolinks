# pongolinks v0.3 Implementation Plan

Status: draft

## Goal

Add basic **Tag** attachment to **Bookmarks** through the existing Bookmark create/edit form and show attached Tags in the Bookmark list.

The v0.3 result should stay small: Tags are editable only as a space-separated text field on Bookmark forms, stored through the existing `tags` and `bookmark_tags` tables, and rendered as compact chips next to the Bookmark domain.

## Decisions Already Made

- Keep v0.3 limited to attaching Tags to Bookmarks through the existing Bookmark create/edit workflow.
- Do not add separate Tag management screens or Tag API endpoints.
- Do not add Tag filtering, search, autocomplete, colors, rename, merge, delete, or orphan cleanup.
- A **Tag** name is a single whitespace-free token. Spaces in text entry separate multiple Tags.
- Do not add a max length rule for Tag names in v0.3.
- Add a backend-local `TagName` Value Object in the bookmarks vertical slice.
- `TagName` accepts non-empty names that contain no whitespace.
- `TagName` computes `nameLower` in the app layer with `name.toLocaleLowerCase("und")`.
- Parse form input by splitting `tagsText` on whitespace, trimming tokens, and ignoring empty tokens.
- Deduplicate submitted Tags by `nameLower`.
- Reuse existing Tags by `nameLower`.
- When reusing an existing Tag, preserve the existing display `name` instead of changing casing to match the latest input.
- For create/edit, use transactional replace-all semantics for Bookmark Tags.
- Editing a Bookmark with an empty `tagsText` clears all Tag links for that Bookmark.
- Do not delete orphan rows from `tags` in v0.3.
- Return Tags sorted by `tags.nameLower ASC`.
- Extend `BookmarkDTO.tags` to include `{ id, name, nameLower }[]`.
- Frontend displays Tag `name`, not `nameLower`.
- API errors remain Result-based operational errors.
- Add `bookmark.tags_invalid` for invalid Tag input.
- Treat invalid Tag input as a form-level error in the frontend.
- Keep comments in code in English.

## Proposed Backend Structure

```txt
apps/backend/src/features/bookmarks/
  bookmark-id.ts
  bookmark-url.ts
  bookmark-validation.ts
  bookmarks-repository.ts
  contracts.ts
  routes.ts
  tag-name.ts
```

## Proposed Frontend Structure

```txt
apps/frontend/src/features/bookmarks/
  api.ts
  BookmarkForm.vue
  BookmarkListView.vue
  types.ts
```

## Backend Scope

1. Add `TagDTO` to the bookmarks contract:

   ```ts
   export type TagDTO = {
     id: number;
     name: string;
     nameLower: string;
   };
   ```

2. Extend `BookmarkDTO` with `tags: TagDTO[]`.
3. Extend `EditableBookmarkRequest` with `tagsText: string`.
4. Add backend-local `TagName` Value Object:
   - private constructor;
   - `TagName.from(input): Result<TagName, ApiError>`;
   - rejects empty names;
   - rejects names containing whitespace;
   - exposes `name()` and `nameLower()`.
5. Update bookmark input validation to normalize missing/non-string `tagsText` to `""`.
6. Parse `tagsText` after basic request validation and before repository persistence.
7. Return `bookmark.tags_invalid` with HTTP `400` if Tag parsing fails.
8. Update `BookmarksRepository` to read Tags when listing and fetching Bookmarks.
9. Add repository logic to find-or-create Tags by `nameLower`:
   - lookup first by `tags.nameLower`;
   - insert `{ name, nameLower }` if missing;
   - if insert hits the unique constraint, lookup again and reuse the existing Tag.
10. Wrap Bookmark create/update plus Tag link replacement in database transactions.
11. On create, insert the Bookmark, find-or-create Tags, insert `bookmark_tags` links, and return the Bookmark DTO with sorted Tags.
12. On update, verify the Bookmark exists, update editable Bookmark fields, delete existing `bookmark_tags` links, find-or-create Tags, insert new links, and return the Bookmark DTO with sorted Tags.
13. Keep duplicate Bookmark URL checks and unique-constraint fallback behavior from v0.2.
14. Add evlog context for Tag count and Tag validation outcome without introducing noisy per-Tag logging.

## Backend API

### `GET /pongolinks/api/bookmarks`

Returns Bookmarks ordered by `updatedAt DESC`, each with sorted Tags.

```ts
{
  ok: true,
  data: {
    bookmarks: BookmarkDTO[],
  },
}
```

### `GET /pongolinks/api/bookmarks/:id`

Returns one Bookmark with sorted Tags.

### `POST /pongolinks/api/bookmarks`

Creates a Bookmark and attaches Tags from `tagsText`.

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

Updates the complete editable Bookmark payload and replaces all attached Tags.

```ts
{
  url: string,
  title: string,
  description: string,
  isPrivate: boolean,
  tagsText: string,
}
```

## API Error Codes

Keep existing v0.2 codes and add:

- `bookmark.tags_invalid`

## Frontend Scope

1. Extend frontend `BookmarkDTO` with `tags: TagDTO[]`.
2. Extend `EditableBookmarkPayload` with `tagsText: string`.
3. Add a `Tags` single-line input to `BookmarkForm.vue`.
4. On create, initialize `tagsText` to `""`.
5. On edit, initialize `tagsText` from `bookmark.tags.map((tag) => tag.name).join(" ")`.
6. Use placeholder text such as `article lang-ru learning`.
7. Add concise help text: `Separate tags with spaces.`
8. Submit `tagsText` as entered; backend owns parsing and normalization.
9. Map `bookmark.tags_invalid` to a form-level error.
10. Update `BookmarkListView.vue` to show Tags as compact bordered chips to the right of the Bookmark domain.
11. Keep the domain first in the metadata row.
12. Hide Tag chips when a Bookmark has no Tags.
13. Use wrapping layout so Tags move cleanly on narrow viewports.
14. Display `tag.name`, not `tag.nameLower`.

## Frontend UI Notes

The list should remain a quiet working interface. Tags should look like small bordered chips similar to the reference screenshot: compact, neutral, and secondary to the Bookmark title.

The Bookmark form should not become a Tag editor. It should expose only a plain text input where spaces separate Tags.

## Tests

### Backend

Add tests for:

1. `TagName` accepts `article`, `lang-ru`, and `структуры-данных`.
2. `TagName` rejects empty and whitespace-containing names.
3. `POST /api/bookmarks` with `tagsText: "article lang-ru article"` creates/reuses Tags and returns unique Tags sorted by `nameLower`.
4. Existing Tag casing is preserved when a Tag is reused by `nameLower`.
5. `GET /api/bookmarks` returns each Bookmark with `tags: { id, name, nameLower }[]`.
6. `GET /api/bookmarks/:id` returns sorted Tags.
7. `PATCH /api/bookmarks/:id` replaces all Tag links.
8. `PATCH /api/bookmarks/:id` with empty `tagsText` clears all Tag links.
9. Bookmark URL duplicate behavior still works after Tag persistence is added.

### Frontend

Add or update cheap tests for:

1. API adapter/envelope parsing handles successful Bookmark responses with `tags`.
2. API error mapping handles `bookmark.tags_invalid` as a form-level error.

Do not introduce a Vue component testing stack in v0.3.

## Out Of Scope

- Separate Tag management UI.
- Separate Tag API endpoints.
- Tag filtering.
- Tag search.
- Tag autocomplete.
- Tag colors.
- Tag rename, merge, or delete.
- Orphan Tag cleanup.
- Preserving user-defined Tag order.
- Adding `position` or other metadata to `bookmark_tags`.
- Related Links.
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

1. [Add Tag contract and list display](./issues/01-add-tag-contract-and-list-display.md)
2. [Create Bookmark with Tags](./issues/02-create-bookmark-with-tags.md)
3. [Edit Bookmark Tags with replace-all semantics](./issues/03-edit-bookmark-tags-with-replace-all.md)
4. [Harden Tag name normalization and errors](./issues/04-harden-tag-name-normalization-and-errors.md)

Commit message: feat: plan v0.3 bookmark tags
