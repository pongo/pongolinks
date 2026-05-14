# Consolidate Bookmark Form Workflow

## Context

The frontend Bookmark create and edit views both coordinate the same kind of workflow:

- Load Tag suggestions.
- Track form errors.
- Track saving/loading state.
- Submit an editable Bookmark payload.
- Navigate back to the Bookmark list after a successful save.

Relevant files:

- `apps/frontend/src/features/bookmarks/views/CreateBookmarkView.vue`
- `apps/frontend/src/features/bookmarks/views/EditBookmarkView.vue`
- `apps/frontend/src/features/bookmarks/components/BookmarkForm.vue`

## Problem

The duplicated workflow is still small, but it is shallow: the interface in each view is almost the same as the implementation. As Bookmark editing grows, error handling, pending states, Tag suggestion loading, and navigation behavior are likely to diverge accidentally.

The deletion test suggests a shared workflow module would earn its keep if more Bookmark form behavior is added. Without it, changes to the editing experience must be made in multiple route screens.

## Direction

Introduce a frontend Bookmark form workflow module or composable that owns the repeated route behavior while leaving route-specific facts in the views.

The Create view should provide the create adapter and success destination. The Edit view should provide the bookmark loader, update adapter, Bookmark id, and success destination. `BookmarkForm.vue` should stay mostly presentational: editable payload in, submit payload out, errors and saving state in.

## Implementation Plan

1. Add or adjust frontend tests around existing Bookmark API payload parsing and form workflow behavior before extracting.
2. Introduce a feature-local composable for Bookmark form state, Tag suggestion loading, submit state, and form error handling.
3. Update Create and Edit views to use the composable while keeping their route-specific data loading explicit.
4. Avoid moving UI text or template structure unless the duplication remains after workflow extraction.
5. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: consolidate bookmark form workflow
