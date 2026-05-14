# Regression-test Bookmark transport validation

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Cover the v0.8 Bookmark transport validation boundary with backend regression tests.

## Scope

- Update backend Bookmark API tests.
- Add or update tests for:
  - missing create body returns `400` with `bookmark.validation_invalid`;
  - non-object create body returns `400` with `bookmark.validation_invalid`;
  - missing `url` returns `400` with `bookmark.url_required`;
  - non-string `url` returns `400` with `bookmark.url_required`;
  - missing `title` returns `400` with `bookmark.title_required`;
  - non-string `title` returns `400` with `bookmark.title_required`;
  - whitespace-only `title` returns `400` with `bookmark.title_required`;
  - wrong-type optional `description` returns `400` with `bookmark.validation_invalid`;
  - wrong-type optional `isPrivate` returns `400` with `bookmark.validation_invalid`;
  - wrong-type optional `tagsText` returns `400` with `bookmark.validation_invalid`;
  - missing optional `description`, `isPrivate`, and `tagsText` still default to `""`, `false`, and `""`;
  - invalid Bookmark id params still return `400` with `bookmark.id_invalid`;
  - non-http(s) URL strings that pass transport shape still return `bookmark.url_invalid`.
- Keep existing Bookmark create, update, Tag parsing, Related Link sync, and duplicate URL tests passing.

## Out Of Scope

- Frontend tests.
- Vue component tests.
- Response schema tests.
- OpenAPI tests.
- New product behavior.

## Tests

- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.

Do not start a dev server.
