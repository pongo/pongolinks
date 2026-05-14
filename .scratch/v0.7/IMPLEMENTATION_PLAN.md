# pongolinks v0.7 Implementation Plan

Status: approved

## Goal

Clean up the frontend Bookmark workflow implementation without changing product behavior.

The v0.7 result should keep the app visually and behaviorally the same while making colors, Bookmark form Tag autocomplete, Bookmark feature file structure, and frontend API Result parsing easier to maintain.

## Decisions Already Made

- Keep v0.7 frontend-only.
- Do not add new backend routes, DTO fields, database changes, or user-facing product behavior.
- Keep the existing **Tag** domain rule: a Tag name is a single whitespace-free token, and spaces separate multiple Tags in text entry.
- Keep Tag autocomplete as part of the Bookmark edit workflow, not as a shared Tag management component.
- Extract the Tags input and autocomplete dropdown from `BookmarkForm.vue` into a Bookmark-local component.
- Name the component `BookmarkTagInput.vue`.
- Keep Tag autocomplete helper logic private to `BookmarkTagInput`.
- Group Bookmark feature files by responsibility:
  - API adapter files under `bookmarks/api/`;
  - reusable Bookmark UI under `bookmarks/components/`;
  - route-level screens under `bookmarks/views/`.
- Use a component folder for `BookmarkTagInput` because it owns both Vue markup and autocomplete helper logic.
- Move Bookmark list description autolinking next to `BookmarkListView` because it is currently private to that view.
- Keep small Bookmark feature types in `bookmarks/types.ts`.
- Centralize current frontend colors as CSS custom properties and semantic classes/utilities.
- Do not introduce a full component library, Button/Input abstractions, or broad design system in v0.7.
- Replace currently used Tailwind color classes and literal CSS colors only in the existing frontend surfaces touched by v0.7.
- Do not change spacing, typography scale, layout, or interaction behavior as part of the color cleanup.
- Keep the frontend UI in English.
- Keep code comments in English.
- Refactor duplicated frontend API Result parsing into `apps/frontend/src/shared/api/client.ts`.
- Use `isResult` from `@pongolinks/shared/result` for Result shape checks instead of local `isRecord` checks.
- Keep feature API adapters responsible for feature-specific error mapping, including Bookmark form field errors.
- Do not create an ADR for v0.7; these changes are reversible housekeeping and not surprising enough to require architecture history.

## Domain Documentation Updates

No `CONTEXT.md` updates are required for v0.7.

The clarified terms are implementation terms, not domain terms:

- `BookmarkTagInput` is a frontend component for editing Bookmark Tag text.
- Frontend color tokens are presentation concerns.
- Frontend API parsing is an implementation concern around the existing Result-shaped backend contract.

## Proposed Frontend Structure

```txt
apps/frontend/src/
  shared/
    api/
      client.ts
      errors.ts
  features/
    bookmarks/
      api/
        api.ts
        api.test.ts
      components/
        BookmarkForm.vue
        BookmarkTagInput/
          BookmarkTagInput.vue
          tag-autocomplete.ts
          tag-autocomplete.test.ts
      views/
        BookmarkListView/
          BookmarkListView.vue
          autolink-description.ts
          autolink-description.test.ts
        CreateBookmarkView.vue
        EditBookmarkView.vue
      types.ts
      README.md
    tags/
      api.ts
      types.ts
```

## Frontend Scope

1. Add frontend color tokens in `apps/frontend/src/style.css` for the currently used palette.
2. Add semantic CSS classes or Tailwind CSS 4 utilities for repeated UI roles such as page text, muted text, primary action, danger message, input border/focus, subtle border, and white surface.
3. Replace current literal CSS colors and Tailwind color utility usage in existing frontend views/components with the new token-backed semantic classes/utilities.
4. Keep visual output intentionally equivalent to the current UI.
5. Move `BookmarkForm.vue` into `apps/frontend/src/features/bookmarks/components/`.
6. Create `apps/frontend/src/features/bookmarks/components/BookmarkTagInput/BookmarkTagInput.vue`.
7. Move the current Tag input, suggestion list, cursor tracking, ARIA attributes, keyboard handling, and mouse selection behavior from `BookmarkForm.vue` into `BookmarkTagInput.vue`.
8. Keep `BookmarkForm.vue` responsible for the overall editable Bookmark payload, validation errors, submit button, and form submission.
9. Move `tag-autocomplete.ts` and `tag-autocomplete.test.ts` into the `BookmarkTagInput` component folder.
10. Preserve the existing Tag autocomplete behavior:
    - suggestions are based on the current whitespace-free token;
    - suggestions filter by `nameLower.includes(queryLower)`;
    - exact matches and Tags already entered in other tokens are excluded;
    - the first 7 suggestions are shown in backend order;
    - `Enter` and `Tab` select;
    - `Escape` closes;
    - `Space` closes while inserting a space;
    - selecting a suggestion replaces only the current token and adds exactly one trailing space.
11. Move `BookmarkListView.vue` into `apps/frontend/src/features/bookmarks/views/BookmarkListView/`.
12. Move `autolink-description.ts` and `autolink-description.test.ts` into the `BookmarkListView` folder.
13. Move `CreateBookmarkView.vue` and `EditBookmarkView.vue` into `apps/frontend/src/features/bookmarks/views/`.
14. Move `api.ts` and `api.test.ts` into `apps/frontend/src/features/bookmarks/api/`.
15. Update router, view, component, and test imports after the file moves.
16. Update `apps/frontend/src/features/bookmarks/README.md` so its structure description matches the real v0.7 layout.
17. Extend `apps/frontend/src/shared/api/client.ts` to export shared frontend API helpers:
    - `apiClient`;
    - a shared Eden response type if useful;
    - `parseApiPayload`;
    - `parseEdenResponse` or a similarly small wrapper for Eden responses.
18. Use `isResult` from `@pongolinks/shared/result` inside the shared payload parser.
19. Keep `ApiError` and `FormErrors` in `apps/frontend/src/shared/api/errors.ts`.
20. Keep Bookmark-specific error code validation and `FormErrors` mapping in the Bookmark API adapter.
21. Refactor `apps/frontend/src/features/bookmarks/api/api.ts` to use shared API parsing helpers while preserving its public functions:
    - `listBookmarks`;
    - `getBookmark`;
    - `createBookmark`;
    - `updateBookmark`.
22. Refactor `apps/frontend/src/features/tags/api.ts` to use shared API parsing helpers and remove its duplicated Result parsing.
23. Update API tests so shared parsing behavior is covered in the shared API layer and Bookmark-specific error mapping remains covered in the Bookmark API adapter tests.

## Frontend UI Notes

The UI should remain a quiet working interface. v0.7 should make the implementation more coherent without making the app look newly redesigned.

The color cleanup should produce semantic names that describe UI role rather than raw color intent. Prefer names such as `--ui-text`, `--ui-text-muted`, `--ui-action`, `--ui-danger-text`, and `--ui-border` over component-specific names when the same value is reused across screens.

Do not add visible explanatory copy for the refactor. User-facing text must remain English.

## API Refactor Notes

ADR-0001 says the frontend should keep one shared Eden client for backend connectivity, while vertical slices own their own API adapter functions and UI-facing error mapping. v0.7 should reinforce that boundary:

- `shared/api/client.ts` owns Eden connectivity and generic Result envelope parsing.
- `features/bookmarks/api/api.ts` owns Bookmark endpoint calls and Bookmark error-to-form mapping.
- `features/tags/api.ts` owns Tag endpoint calls and Tag-specific fallback behavior.

The shared parser should not know that `bookmark.url_required` maps to the URL field. That belongs to the Bookmark feature adapter.

## Tests

Add or update frontend tests for:

1. Shared API payload parsing accepts `Ok`-shaped Result payloads.
2. Shared API payload parsing accepts `Err`-shaped Result payloads.
3. Shared API payload parsing rejects non-Result payloads with the provided fallback error.
4. Shared API parsing uses `isResult` from `@pongolinks/shared/result`.
5. Bookmark API error mapping still maps URL errors to `formErrors.url`.
6. Bookmark API error mapping still maps title errors to `formErrors.title`.
7. Bookmark API error mapping still maps Tag and not-found errors to `formErrors.form`.
8. Tag autocomplete helper tests still pass from the new `BookmarkTagInput` folder.
9. Bookmark description autolinking tests still pass from the new `BookmarkListView` folder.

Do not introduce a Vue component testing stack in v0.7.

## Out Of Scope

- Backend changes.
- Database changes.
- New Bookmark, Tag, or Related Link behavior.
- Tag management screens.
- Changing Tag parsing rules.
- Changing Tag autocomplete behavior.
- Changing API response contracts.
- Adding a component library.
- Adding Button, Input, Card, or form-control abstractions.
- Broad redesign of the frontend.
- Dark mode.
- Runtime theme switching.
- Tailwind plugin changes beyond token-backed local utilities/classes if needed.
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

1. [Centralize frontend color tokens](./issues/01-centralize-frontend-color-tokens.md)
2. [Restructure Bookmark frontend slice](./issues/02-restructure-bookmark-frontend-slice.md)
3. [Extract Bookmark Tag input component](./issues/03-extract-bookmark-tag-input-component.md)
4. [Share frontend API Result parsing](./issues/04-share-frontend-api-result-parsing.md)

Commit message: refactor: plan v0.7 frontend cleanup
