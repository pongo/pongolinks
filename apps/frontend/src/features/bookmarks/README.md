# Bookmarks Frontend Feature

## Responsibility

This directory owns frontend behavior around Bookmarks, including route-level screens, reusable Bookmark UI, Bookmark API adapters, and Bookmark-specific helper logic.

## Boundaries

Keep durable schema and migration changes in `packages/db`. Keep backend HTTP route behavior in the backend Bookmark feature. Keep Tag feature behavior in `features/tags`; Bookmark views may consume Tag summaries for the Bookmark editing workflow.

## Entry Points

- `api/` contains frontend API adapter functions for Bookmark endpoints.
- `components/` contains reusable Bookmark UI that is not a route screen.
- `views/` contains route-level Bookmark screens registered from `src/router/index.ts`.
- `views/BookmarkListView/` contains the Bookmark list screen and helpers private to that screen.
- `types.ts` contains small Bookmark DTO and editable payload types shared within the slice.
- `tag-autocomplete.ts` contains Bookmark form Tag autocomplete helpers until the Tag input is extracted into its own component folder.

## Testing

Add frontend tests next to the Bookmark component or adapter they verify, or use an app-level test location if the behavior crosses feature boundaries.

## Conventions

User-facing text must be in English. Use `Bookmark`, `Tag`, and `Related Link` according to `CONTEXT.md`.
