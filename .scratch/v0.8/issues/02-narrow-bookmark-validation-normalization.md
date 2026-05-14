# Narrow Bookmark validation normalization

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Turn `bookmark-validation.ts` from broad manual payload parsing into a thin transport error mapper and normalized request adapter.

## Scope

- Update `apps/backend/src/features/bookmarks/bookmark-validation.ts`.
- Replace broad `unknown` parsing in `validateEditableBookmarkInput` with a function that accepts the Elysia-validated editable Bookmark body shape.
- Normalize the validated body into `EditableBookmarkRequest`:
  - trim `title`;
  - trim `description`;
  - default missing `description` to `""`;
  - default missing `isPrivate` to `false`;
  - default missing `tagsText` to `""`.
- Preserve whitespace-only title handling as `bookmark.title_required`.
- Preserve current public validation error codes:
  - missing or non-object body: `bookmark.validation_invalid`;
  - invalid path id: `bookmark.id_invalid`;
  - missing, non-string, or empty normalized `url`: `bookmark.url_required`;
  - missing, non-string, or whitespace-only `title`: `bookmark.title_required`;
  - wrong type for optional fields: `bookmark.validation_invalid`.
- Keep Result-shaped operational error handling.

## Out Of Scope

- Adding new API error codes.
- Validating Bookmark URL shape in Elysia schema.
- Changing `BookmarkUrl`, `BookmarkId`, or `TagName`.
- Changing `resultResponse`.
- Changing evlog behavior beyond existing validation error logging.

## Tests

- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.

Do not start a dev server.
