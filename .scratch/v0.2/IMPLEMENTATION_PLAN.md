# pongolinks v0.2 Implementation Plan

Status: draft

## Goal

Implement the first database-backed Bookmark workflow: add, edit, and list basic Bookmarks.

The v0.2 result should keep the product small while proving the real path through SQLite, backend vertical slices, Eden typing, Vue routes, Tailwind CSS 4 UI, and request-scoped wide events.

## Decisions Already Made

- Keep v0.2 limited to basic **Bookmark** fields: `url`, `title`, `description`, `isPrivate`, `createdAt`, and `updatedAt`.
- Keep **Tags**, **Related Links**, search, filtering, pagination, delete, import/export, and metadata fetching out of scope.
- A URL can identify at most one **Bookmark**.
- Accept only trimmed absolute `http://` and `https://` Bookmark URLs.
- Follow [ADR-0002](../../docs/adr/0002-value-objects-for-validated-domain-primitives.md) by using Value Objects for validated domain primitives.
- Use backend-local Value Objects for `BookmarkUrl` and `BookmarkId` in v0.2.
- Use `class` Value Objects with private constructors and static factories returning `Result`.
- Do not introduce a shared domain package or generic `EntityId<T>` abstraction in v0.2.
- Keep request DTOs and `BookmarkDTO` inside the backend bookmark vertical slice.
- Expose `id: number` in API DTOs while parsing route params through `BookmarkId`.
- Use `BookmarkUrl.from(input): Result<BookmarkUrl>`.
- Use `BookmarkId.from(input): Result<BookmarkId>` for positive safe integer ids.
- Validate `title` as trimmed non-empty text.
- Validate `description` as trimmed optional text, allowing an empty string.
- Keep `isPrivate` as the existing boolean field.
- Let Drizzle `$onUpdate` update `updatedAt`; do not manually set `updatedAt` in the repository unless implementation proves `$onUpdate` is not applied.
- Use explicit duplicate URL checks before insert/update, with the SQLite unique constraint as a safety net.
- Do not test a concurrent duplicate-create race in v0.2.
- Use a backend-local helper for API response envelopes and `Result` to HTTP mapping.
- Use JSON response envelopes:
  - success: `{ ok: true, data: ... }`
  - error: `{ ok: false, error: { message, code, data? } }`
- Use meaningful HTTP statuses: `400` validation, `404` not found, `409` duplicate URL, `500` unexpected errors.
- Follow [ADR-0003](../../docs/adr/0003-evlog-wide-events-for-backend-observability.md) by using evlog wide events for backend observability.
- Add evlog to the backend without Axiom integration in v0.2.
- Initialize evlog from backend startup, not as a side effect of importing the app.
- Log bookmark API routes with wide events and exclude health from noisy request logging.
- Pass a database dependency into `createApp({ db })` for tests and allow runtime app creation to open the configured SQLite database.
- Do not run database migrations at backend startup.
- In tests, pass an in-memory SQLite database.
- Add Tailwind CSS 4 to the frontend and install/use `@tailwindcss/vite`.
- Use real route links for create/edit so they can be opened in a new tab.
- Use one shared Bookmark form component for create and edit screens.
- Redirect to the list after successful create/edit.
- Do not add optimistic UI, toast system, localStorage drafts, hotkeys, or a global 404 page in v0.2.

## Proposed Backend Structure

```txt
apps/backend/src/
  app.ts
  observability.ts
  http/
    result-response.ts
  features/
    bookmarks/
      bookmark-id.ts
      bookmark-url.ts
      bookmark-validation.ts
      bookmarks-repository.ts
      contracts.ts
      routes.ts
```

## Proposed Frontend Structure

```txt
apps/frontend/src/
  style.css
  features/
    bookmarks/
      api.ts
      BookmarkForm.vue
      BookmarkListView.vue
      CreateBookmarkView.vue
      EditBookmarkView.vue
      types.ts
```

## Backend Scope

1. Add `evlog` to backend dependencies.
2. Add `observability.ts` with explicit logger initialization for backend startup.
3. Register `evlog()` middleware in the Elysia app and log bookmark API requests as wide events.
4. Exclude the health route from bookmark-focused logging noise.
5. Extend `createApp()` so tests can pass an in-memory database dependency.
6. Open the configured SQLite database for runtime app creation without running migrations at startup.
7. Add backend-local API envelope helpers for success and error responses.
8. Add `BookmarkUrl` Value Object.
9. Add `BookmarkId` Value Object.
10. Add `bookmark-validation.ts` for basic editable Bookmark input validation.
11. Add `BookmarkDTO` and request contract types inside the bookmark slice.
12. Add `bookmarks-repository.ts` using Drizzle.
13. Add `GET /pongolinks/api/bookmarks`.
14. Add `POST /pongolinks/api/bookmarks`.
15. Add `GET /pongolinks/api/bookmarks/:id`.
16. Add `PATCH /pongolinks/api/bookmarks/:id`.
17. Register bookmark routes explicitly from the backend app composition layer.

## Backend API

### `GET /pongolinks/api/bookmarks`

Returns all Bookmarks ordered by `updatedAt DESC`.

```ts
{
  ok: true,
  data: {
    bookmarks: BookmarkDTO[],
  },
}
```

### `POST /pongolinks/api/bookmarks`

Creates a Bookmark from the full editable field set.

```ts
{
  url: string,
  title: string,
  description: string,
  isPrivate: boolean,
}
```

### `GET /pongolinks/api/bookmarks/:id`

Returns one Bookmark for the edit form. Invalid ids return `400`; missing Bookmarks return `404`.

### `PATCH /pongolinks/api/bookmarks/:id`

Updates the full editable field set: `url`, `title`, `description`, and `isPrivate`.

Although the endpoint uses `PATCH`, v0.2 clients send the complete editable payload.

## API Error Codes

- `bookmark.url_required`
- `bookmark.url_invalid`
- `bookmark.url_duplicate`
- `bookmark.title_required`
- `bookmark.id_invalid`
- `bookmark.not_found`
- `bookmark.unexpected`

## evlog Wide Events

Use request-scoped wide events for bookmark API operations. Add context progressively in handlers/repository orchestration, such as:

- operation name: list, create, get, update
- parsed Bookmark id when present
- parsed Bookmark URL when valid
- validation outcome
- duplicate URL outcome
- not found outcome
- created or updated Bookmark id

Do not add Axiom drain integration in v0.2. Do not use background `log.fork` because v0.2 has no background work.

## Frontend Scope

1. Add Tailwind CSS 4 and `@tailwindcss/vite`.
2. Add a global frontend stylesheet entry using Tailwind.
3. Replace the v0.1 health-only home route with a Bookmark list route at `/`.
4. Add `/bookmarks/new` for Bookmark creation.
5. Add `/bookmarks/:id/edit` for Bookmark editing.
6. Use real links for create/edit navigation so routes can open in a new tab.
7. Add a compact Bookmark list UI:
   - title as the primary external link
   - URL underneath
   - optional description
   - `Private` marker only for private Bookmarks
   - short localized updated timestamp
   - edit action per row
   - top create action
   - empty state with create action
8. Add a shared Bookmark form component for create and edit.
9. Add `Back to bookmarks` navigation on form screens.
10. Use normal form submit behavior.
11. Show loading/disabled state while saving.
12. Show field errors for URL and title.
13. Show form-level errors for not found and unexpected backend failures.
14. Redirect to `/` after successful create/edit.

## Frontend UI Notes

The UI should be a quiet working interface, not a marketing page. Use English user-facing text. Keep the layout compact and scannable. Do not use preview thumbnails, decorative hero sections, or card-heavy marketing composition.

Private/public should be represented by a `Private bookmark` control in the form and a small `Private` marker in list rows only when `isPrivate` is true.

Timestamps should be formatted on the frontend with `Intl.DateTimeFormat` using the browser locale. The API may return the SQLite timestamp string as stored.

## Tests

### Backend

Add tests for:

1. `BookmarkUrl` accepts trimmed absolute `http://` and `https://` URLs.
2. `BookmarkUrl` rejects empty, relative, and non-http(s) URLs.
3. `BookmarkId` accepts positive safe integer ids.
4. `BookmarkId` rejects empty, non-numeric, zero, negative, and unsafe ids.
5. `POST /api/bookmarks` creates a Bookmark.
6. Duplicate URL create returns `409`.
7. `GET /api/bookmarks` returns Bookmarks by `updatedAt DESC`.
8. `GET /api/bookmarks/:id` returns `404` for a missing Bookmark.
9. `PATCH /api/bookmarks/:id` updates editable fields.
10. `PATCH /api/bookmarks/:id` rejects duplicate URLs.
11. `PATCH /api/bookmarks/:id` changes `updatedAt` through Drizzle `$onUpdate`.

### Frontend

Add small tests only where they are cheap in the current setup:

1. API adapter/envelope parsing for successful responses.
2. API adapter/envelope parsing for field and form errors.

Do not introduce a heavy Vue component testing stack in v0.2.

## Out Of Scope

- Tags UI or API behavior.
- Related Links UI or API behavior.
- Search, filtering, sorting controls, or pagination.
- Delete Bookmark.
- Bookmark detail page.
- Metadata fetching from saved URLs.
- Background jobs or `log.fork`.
- Axiom drain integration.
- Authentication and multi-user behavior.
- Browser extension.
- Import/export.
- Local draft persistence.
- Optimistic UI.
- Toast system.
- Global frontend 404 page.
- Automatic migrations at backend startup.
- Git commit by the agent.
- Dev server startup by the agent.

## Verification

Run:

```bash
bun run typecheck
bun run agent:test
bun run format
```

Do not run a dev server as part of agent verification.

## Implementation Issues

1. [Add Bookmark backend foundation](./issues/01-add-bookmark-backend-foundation.md)
2. [Create Bookmark through API](./issues/02-create-bookmark-through-api.md)
3. [List Bookmarks through API and frontend home](./issues/03-list-bookmarks-through-api-and-frontend-home.md)
4. [Edit Bookmark through API and form route](./issues/04-edit-bookmark-through-api-and-form-route.md)
5. [Finish observability and verification pass](./issues/05-finish-observability-and-verification-pass.md)

Commit message: feat: plan v0.2 bookmark CRUD
