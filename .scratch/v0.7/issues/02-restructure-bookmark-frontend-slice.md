# Restructure Bookmark frontend slice

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Reorganize `apps/frontend/src/features/bookmarks/` by responsibility while preserving current behavior.

## Scope

- Move Bookmark API adapter files:
  - from `features/bookmarks/api.ts` to `features/bookmarks/api/api.ts`;
  - from `features/bookmarks/api.test.ts` to `features/bookmarks/api/api.test.ts`.
- Move reusable Bookmark UI:
  - `BookmarkForm.vue` to `features/bookmarks/components/BookmarkForm.vue`.
- Move route-level Bookmark screens:
  - `CreateBookmarkView.vue` to `features/bookmarks/views/CreateBookmarkView.vue`;
  - `EditBookmarkView.vue` to `features/bookmarks/views/EditBookmarkView.vue`;
  - `BookmarkListView.vue` to `features/bookmarks/views/BookmarkListView/BookmarkListView.vue`.
- Move Bookmark list autolinking next to the list view:
  - `autolink-description.ts` to `features/bookmarks/views/BookmarkListView/autolink-description.ts`;
  - `autolink-description.test.ts` to `features/bookmarks/views/BookmarkListView/autolink-description.test.ts`.
- Update router, view, component, test, and local imports after the moves.
- Update `apps/frontend/src/features/bookmarks/README.md` so it describes the v0.7 layout.

## Out Of Scope

- Extracting the Tags input into `BookmarkTagInput.vue`; that is covered by a separate issue.
- Changing Bookmark list rendering behavior.
- Changing Bookmark API behavior.
- Moving `types.ts` out of the Bookmark slice root.
- Moving Tags feature files.

## Tests

- Existing Bookmark API tests still run from their new path.
- Existing Bookmark description autolinking tests still run from their new path.
- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.
