# pongolinks v0.8 Implementation Plan

Status: approved

## Goal

Standardize Bookmark request and params validation on Elysia `t` at the transport layer while preserving the existing Bookmark domain validation, Result-shaped API errors, and product behavior.

The v0.8 result should stay small: Bookmark routes should no longer use broad manual `unknown` payload parsing for transport shape, while `BookmarkUrl`, `BookmarkId`, and `TagName` continue to own domain invariants.

## Decisions Already Made

- Keep v0.8 backend-only.
- Use `import { t } from "elysia"` for Bookmark route body and params validation.
- Do not add Zod.
- Keep Elysia `t` schemas close to `apps/backend/src/features/bookmarks/routes.ts`.
- Do not introduce a separate `bookmark-schemas.ts` file in v0.8.
- Keep `bookmark-validation.ts`, but narrow its responsibility.
- Remove broad manual `unknown` payload parsing from `validateEditableBookmarkInput`.
- Keep `bookmark-validation.ts` responsible for Elysia validation error mapping and normalized Bookmark request data.
- Keep `url` and `title` as required strings in the Elysia body schema.
- Keep `description`, `isPrivate`, and `tagsText` optional in the Elysia body schema.
- Treat wrong types for optional fields as transport validation errors instead of silently defaulting them.
- Keep post-schema normalization:
  - trim `title`;
  - trim `description`;
  - default missing `description` to `""`;
  - default missing `isPrivate` to `false`;
  - default missing `tagsText` to `""`.
- Keep whitespace-only `title` as `bookmark.title_required`.
- Keep URL validity in `BookmarkUrl.from(...)`, not in the Elysia body schema.
- Keep path id parsing through the existing `BookmarkId.from(...)` domain Value Object after Elysia params validation.
- Keep `t.Numeric({ minimum: 1 })` for Bookmark id route params.
- Preserve existing public API error codes where practical:
  - missing or non-object body: `bookmark.validation_invalid`;
  - invalid path id: `bookmark.id_invalid`;
  - missing, non-string, or empty normalized `url`: `bookmark.url_required`;
  - missing, non-string, or whitespace-only `title`: `bookmark.title_required`;
  - wrong type for optional fields: `bookmark.validation_invalid`.
- Keep Result-shaped API responses from `@pongolinks/shared/result`.
- Do not add Elysia response schemas in v0.8.
- Do not change Bookmark API paths, response DTOs, frontend code, database schema, repository behavior, Tag parsing rules, or Related Link behavior.
- Do not create an ADR for v0.8; the decision is reversible and follows the existing Elysia/Eden direction from ADR-0001.
- Keep comments in code in English.

## Domain Documentation Updates

No `CONTEXT.md` updates are required for v0.8.

The clarified terms are implementation concerns, not domain terms:

- Transport validation is the HTTP request body and params shape validation performed by Elysia before a route handler runs.
- Domain validation remains the Value Object validation for Bookmark-specific invariants such as URL, id, and Tag name rules.

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

No new files are required for v0.8.

## Backend Scope

1. Strengthen the Bookmark editable body schema in `routes.ts`:
   - `url: t.String()`;
   - `title: t.String()`;
   - `description: t.Optional(t.String())`;
   - `isPrivate: t.Optional(t.Boolean())`;
   - `tagsText: t.Optional(t.String())`.
2. Keep the Bookmark id params schema as Elysia `t` validation.
3. Replace broad `unknown` parsing in `validateEditableBookmarkInput` with a function that accepts the Elysia-validated body shape.
4. Normalize the Elysia-validated body into `EditableBookmarkRequest`.
5. Preserve whitespace-only title handling as `bookmark.title_required`.
6. Preserve URL required handling for missing or non-string URL validation errors and empty normalized URL if implementation still reaches the normalizer.
7. Keep `BookmarkUrl.from(...)`, `BookmarkId.from(...)`, and `parseTagNames(...)` in the route handlers.
8. Update `bookmarkValidationErrorResponse` so Elysia validation failures keep the agreed API error codes.
9. Keep the response envelope and `resultResponse` behavior unchanged.
10. Keep evlog context behavior unchanged except for any validation error context naturally produced by existing `logError`.

## Backend API

No API path or response shape changes.

Existing Bookmark endpoints keep their paths:

- `GET /pongolinks/api/bookmarks`
- `POST /pongolinks/api/bookmarks`
- `GET /pongolinks/api/bookmarks/:id`
- `PATCH /pongolinks/api/bookmarks/:id`

`POST` and `PATCH` still accept the complete editable Bookmark payload:

```ts
{
  url: string;
  title: string;
  description?: string;
  isPrivate?: boolean;
  tagsText?: string;
}
```

Handlers continue to normalize the payload to:

```ts
{
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
}
```

## API Error Codes

Keep existing Bookmark validation codes:

- `bookmark.url_required`
- `bookmark.url_invalid`
- `bookmark.url_duplicate`
- `bookmark.title_required`
- `bookmark.id_invalid`
- `bookmark.tags_invalid`
- `bookmark.not_found`
- `bookmark.unexpected`
- `bookmark.validation_invalid`

v0.8 should not add new error codes.

## Frontend Scope

No frontend changes.

The existing frontend API adapters and form error mapping should continue to work with the preserved Bookmark error codes.

## Tests

### Backend

Add or update tests for:

1. Missing create body returns `400` with `bookmark.validation_invalid`.
2. Non-object create body returns `400` with `bookmark.validation_invalid`.
3. Missing `url` returns `400` with `bookmark.url_required`.
4. Non-string `url` returns `400` with `bookmark.url_required`.
5. Missing `title` returns `400` with `bookmark.title_required`.
6. Non-string `title` returns `400` with `bookmark.title_required`.
7. Whitespace-only `title` returns `400` with `bookmark.title_required`.
8. Wrong-type optional `description` returns `400` with `bookmark.validation_invalid`.
9. Wrong-type optional `isPrivate` returns `400` with `bookmark.validation_invalid`.
10. Wrong-type optional `tagsText` returns `400` with `bookmark.validation_invalid`.
11. Missing optional `description`, `isPrivate`, and `tagsText` still default to `""`, `false`, and `""`.
12. Invalid Bookmark id params still return `400` with `bookmark.id_invalid`.
13. Existing URL Value Object validation still returns `bookmark.url_invalid` for non-http(s) strings that pass transport shape.
14. Existing Bookmark create, update, Tag parsing, Related Link sync, and duplicate URL behavior still pass.

### Frontend

No frontend tests are required for v0.8 because API paths, response DTOs, and public error codes remain compatible.

## Out Of Scope

- Adding Zod.
- Adding Elysia response schemas.
- Moving schemas into a new file.
- Changing Bookmark API response DTOs.
- Changing frontend API adapters or UI.
- Changing repository behavior.
- Changing database schema or migrations.
- Changing Value Object rules for `BookmarkUrl`, `BookmarkId`, or `TagName`.
- Changing Tag parsing or synchronization.
- Changing Related Link extraction or synchronization.
- Adding OpenAPI documentation.
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

1. [Strengthen Bookmark route schemas](./issues/01-strengthen-bookmark-route-schemas.md)
2. [Narrow Bookmark validation normalization](./issues/02-narrow-bookmark-validation-normalization.md)
3. [Regression-test Bookmark transport validation](./issues/03-regression-test-bookmark-transport-validation.md)

Commit message: refactor: plan v0.8 bookmark transport validation
