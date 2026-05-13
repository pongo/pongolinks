# Bookmarks Frontend Feature

## Responsibility

This directory is reserved for frontend behavior around Bookmarks, including Bookmark views, UI components, route-level screens, and frontend API adapters.

## Boundaries

Full Bookmark CRUD is out of scope for v0.1, and no Bookmark UI routes are currently registered.

Keep durable schema and migration changes in `packages/db`. Keep backend HTTP route behavior in the backend Bookmark feature.

## Entry Points

Add future Bookmark views, components, and API adapters here, then register route-level screens from `src/router/index.ts` when product behavior exists.

## Testing

Add frontend tests next to the Bookmark component or adapter they verify, or use an app-level test location if the behavior crosses feature boundaries.

## Conventions

User-facing text must be in English. Use `Bookmark`, `Tag`, and `Related Link` according to `CONTEXT.md`.
