# Extract Bookmark Tag input component

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Extract the Bookmark form Tags input and autocomplete behavior into a Bookmark-local component.

## Scope

- Create `apps/frontend/src/features/bookmarks/components/BookmarkTagInput/BookmarkTagInput.vue`.
- Move the Tags text input, suggestion dropdown, cursor tracking, ARIA attributes, keyboard handling, and mouse selection behavior from `BookmarkForm.vue` into `BookmarkTagInput.vue`.
- Move `tag-autocomplete.ts` into the `BookmarkTagInput` folder.
- Move `tag-autocomplete.test.ts` into the `BookmarkTagInput` folder.
- Keep `BookmarkForm.vue` responsible for:
  - the overall `EditableBookmarkPayload`;
  - URL/title/description/private fields;
  - validation errors;
  - submit button;
  - form submission.
- Pass the current `tagsText`, available Tag summaries, and update events between `BookmarkForm.vue` and `BookmarkTagInput.vue`.
- Preserve the existing Tag autocomplete behavior exactly:
  - suggestions are based on the current whitespace-free token;
  - suggestions filter by `nameLower.includes(queryLower)`;
  - exact matches and Tags already entered in other tokens are excluded;
  - the first 7 suggestions are shown in backend order;
  - `Enter` and `Tab` select;
  - `Escape` closes;
  - `Space` closes while inserting a space;
  - selecting a suggestion replaces only the current token and adds exactly one trailing space.

## Out Of Scope

- Changing Tag parsing rules.
- Moving Tag autocomplete into the shared layer.
- Adding a separate Tag management UI.
- Introducing Vue component tests solely for this refactor.
- Changing create/edit form product behavior.

## Tests

- Tag autocomplete helper tests still pass from the new component folder.
- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.
