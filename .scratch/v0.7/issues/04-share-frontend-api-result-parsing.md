# Share frontend API Result parsing

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Remove duplicated frontend API Result parsing while keeping feature adapters responsible for feature-specific error mapping.

## Scope

- Extend `apps/frontend/src/shared/api/client.ts` to export shared frontend API helpers:
  - `apiClient`;
  - a shared Eden response type if useful;
  - `parseApiPayload`;
  - `parseEdenResponse` or a similarly small wrapper for Eden responses.
- Use `isResult` from `@pongolinks/shared/result` inside the shared payload parser.
- Remove local `isRecord`-based Result shape checks from Bookmark and Tag API adapters.
- Keep `ApiError` and `FormErrors` in `apps/frontend/src/shared/api/errors.ts`.
- Keep Bookmark-specific error code validation and `FormErrors` mapping in `features/bookmarks/api/api.ts`.
- Refactor Bookmark API adapter functions to use shared parsing helpers while preserving public functions:
  - `listBookmarks`;
  - `getBookmark`;
  - `createBookmark`;
  - `updateBookmark`.
- Refactor `apps/frontend/src/features/tags/api.ts` to use shared parsing helpers.
- Add or move tests so shared parsing behavior is covered in the shared API layer.
- Keep Bookmark-specific error mapping covered in Bookmark API adapter tests.

## Out Of Scope

- Changing backend API response contracts.
- Changing endpoint paths or Eden app typing.
- Moving Bookmark error-to-form mapping into `shared/api`.
- Adding runtime DTO validation.
- Changing UI error copy.

## Tests

- Shared API payload parsing accepts `Ok`-shaped Result payloads.
- Shared API payload parsing accepts `Err`-shaped Result payloads.
- Shared API payload parsing rejects non-Result payloads with the provided fallback error.
- Bookmark API error mapping still maps URL errors to `formErrors.url`.
- Bookmark API error mapping still maps title errors to `formErrors.title`.
- Bookmark API error mapping still maps Tag and not-found errors to `formErrors.form`.
- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.
