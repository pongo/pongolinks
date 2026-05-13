# pongolinks v0.6 Implementation Plan

Status: draft

## Goal

Add **Tag** autocomplete to the existing Bookmark create/edit form while keeping Tag entry as a plain space-separated text field.

The v0.6 result should stay small: the backend exposes a read-only Tags feature slice that returns all existing Tags sorted by **Tag Popularity**, and the frontend filters that list locally for the current whitespace-free token in the Bookmark form.

## Decisions Already Made

- Create a separate `tags` feature slice now because future versions will add a Tag list and Tag edit/delete workflows.
- Keep v0.6 `tags` read-only.
- Do not move Bookmark Tag creation, attachment, parsing, or synchronization out of the `bookmarks` slice in v0.6.
- Keep the Bookmark form `Tags` control as a plain text input.
- Keep the existing domain rule: a **Tag** name is a single whitespace-free token, and spaces separate multiple Tags in text entry.
- Define **Tag Popularity** as the number of current Bookmarks a Tag is attached to.
- Sort the backend Tag list by `usageCount DESC`, then `nameLower ASC`.
- Return saved display `name` and normalized `nameLower`.
- Search locally on the frontend by `nameLower.includes(queryLower)`.
- Show saved display `name` in suggestions.
- Load the full Tag list when the create/edit form opens.
- Do not live-refresh the form's Tag list after saving a Bookmark.
- If the Tag list request fails, keep the Bookmark form usable and silently disable autocomplete.
- Show suggestions only when the current token is non-empty.
- Exclude an exact `nameLower` match from suggestions.
- Exclude Tags already entered in other tokens of the same input, matched by `nameLower`.
- Limit the visible suggestion list to 7 Tags.
- Selecting a suggestion replaces only the current token.
- After selection, add exactly one trailing space after the selected Tag and place the cursor after that space.
- If selection happens in the middle of the input, preserve the following text while preventing a double space between the inserted Tag and the next token.
- Support mouse selection with `mousedown.prevent`.
- Support keyboard selection:
  - `ArrowDown` opens/focuses suggestions when the current token is non-empty and suggestions exist.
  - `ArrowUp` and `ArrowDown` move the active suggestion while the list is open.
  - `Tab` or `Enter` selects the active suggestion.
  - If the list is open and no suggestion is active, `Enter` selects the first suggestion instead of submitting the form.
  - `Escape` closes the suggestion list without changing input.
  - `Space` closes the suggestion list without selecting and still inserts a space into the input.
- Add lightweight ARIA combobox/listbox attributes without introducing a dependency.
- Do not create an ADR for v0.6; the decision is small, reversible, and documented in this plan plus `CONTEXT.md`.
- Keep comments in code in English.

## Domain Documentation Updates

`CONTEXT.md` now defines **Tag Popularity** as the number of current Bookmarks a Tag is attached to.

`CONTEXT.md` also records that **Tag Popularity** is counted from a **Tag**'s current Bookmark attachments.

## Proposed Backend Structure

```txt
apps/backend/src/features/
  tags/
    contracts.ts
    routes.ts
    tags-repository.ts
```

## Proposed Frontend Structure

```txt
apps/frontend/src/features/
  tags/
    api.ts
    types.ts
  bookmarks/
    BookmarkForm.vue
    CreateBookmarkView.vue
    EditBookmarkView.vue
```

If implementation shows the autocomplete behavior becoming bulky, extract a small local helper from `BookmarkForm.vue`, such as `tag-autocomplete.ts`, inside the `bookmarks` feature. Do not introduce a shared package for this.

## Backend Scope

1. Add `apps/backend/src/features/tags/contracts.ts`.
2. Add `TagSummaryDTO`:

   ```ts
   export type TagSummaryDTO = {
     id: number;
     name: string;
     nameLower: string;
     usageCount: number;
   };
   ```

3. Add `TagsRepository` that reads Tags with current Bookmark attachment counts.
4. Count popularity from `bookmark_tags` rows.
5. Return only Tags that exist in the `tags` table.
6. Sort by `usageCount DESC`, then `nameLower ASC`.
7. Add `GET /tags` under the existing `/pongolinks/api` group.
8. Return the usual JSON envelope:

   ```ts
   {
     ok: true,
     data: {
       tags: TagSummaryDTO[],
     },
   }
   ```

9. Register `createTagRoutes({ db })` next to `createBookmarkRoutes({ db })` in `apps/backend/src/app.ts`.
10. Keep Result-based operational error handling.
11. Use `bookmark.unexpected` only if reusing the existing shared API error type is the smallest local option; otherwise add a minimal tag-specific unexpected code in the tags slice and update frontend typing only where needed.
12. Add evlog context for Tag list count, such as `{ tags: { count } }`, without logging individual Tag names.

## Backend API

### `GET /pongolinks/api/tags`

Returns all Tags sorted by current popularity.

```ts
{
  ok: true,
  data: {
    tags: [
      {
        id: 1,
        name: "Article",
        nameLower: "article",
        usageCount: 5,
      },
    ],
  },
}
```

No query params, pagination, create, update, delete, rename, or merge behavior in v0.6.

## Frontend Scope

1. Add `apps/frontend/src/features/tags/types.ts` with `TagSummaryDTO`.
2. Add `apps/frontend/src/features/tags/api.ts` with `listTags()`.
3. Load Tags when `CreateBookmarkView.vue` opens.
4. Load the Bookmark and Tags when `EditBookmarkView.vue` opens.
5. Keep edit form loading state tied to the Bookmark load; a failed Tags request must not block editing.
6. Pass loaded Tag summaries into `BookmarkForm.vue`.
7. Add local autocomplete behavior to the `Tags` input in `BookmarkForm.vue`.
8. Compute the current token from the input value and cursor position.
9. Filter suggestions by:
   - current token is non-empty;
   - `tag.nameLower.includes(currentTokenLower)`;
   - `tag.nameLower !== currentTokenLower`;
   - Tag is not already present in another token in the same input.
10. Preserve backend sort order while filtering locally, then take the first 7 suggestions.
11. Render a quiet suggestion list below the Tags input.
12. Use active-row styling for keyboard navigation.
13. Select by mouse with `mousedown.prevent`.
14. Select by `Tab` or `Enter`.
15. Close without selection by `Escape`.
16. Close without selection on `Space`, while allowing the input to receive the space.
17. After selection, replace the current token, add one trailing space, and restore cursor position after that space.
18. Add lightweight ARIA combobox/listbox attributes:
   - `role="combobox"`;
   - `aria-expanded`;
   - `aria-controls`;
   - `aria-activedescendant`;
   - `role="listbox"`;
   - `role="option"`;
   - `aria-selected`.

## Frontend UI Notes

The UI should remain a quiet working form. The suggestions should look like an extension of the text input, not a separate Tag browser.

Do not add a Tag icon, Tag management link, explanatory product copy, or a separate Tags page in v0.6.

The existing help text `Separate tags with spaces.` can remain.

User-facing UI text must be English.

## Tests

### Backend

Add tests for:

1. `GET /api/tags` returns Tags with `id`, `name`, `nameLower`, and `usageCount`.
2. `GET /api/tags` sorts Tags by `usageCount DESC`.
3. Tags with equal `usageCount` are sorted by `nameLower ASC`.
4. `usageCount` reflects current `bookmark_tags` attachments.
5. An empty Tag table returns `tags: []`.
6. Existing Bookmark create/edit Tag behavior still works after registering the `tags` slice.

### Frontend

Add cheap tests for autocomplete helper behavior if extracted:

1. Finds suggestions by substring match against `nameLower`.
2. Preserves backend popularity order while limiting to 7.
3. Excludes exact matches.
4. Excludes Tags already entered in other tokens.
5. Replaces the current token and adds exactly one trailing space.
6. Preserves following tokens without double-spacing.

If the behavior stays inside `BookmarkForm.vue`, do not introduce a Vue component testing stack only for v0.6.

## Out Of Scope

- Tag management page.
- Tag create, edit, delete, rename, or merge endpoints.
- Moving Tag parsing or Bookmark Tag synchronization out of the `bookmarks` slice.
- Server-side suggestion filtering.
- Fuzzy search.
- Highlighting matched substrings.
- Tag colors, icons, descriptions, or metadata.
- Pagination for the Tag list.
- Live-refreshing the form Tag list after save.
- Optimistic UI.
- Toast system.
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

Create after plan approval under `.scratch/v0.6/issues/`.

Commit message: feat: plan v0.6 tag autocomplete
