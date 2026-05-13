# Bookmarks Backend Feature

## Responsibility

This directory is reserved for backend behavior around Bookmarks, including Bookmark HTTP routes, request/response handling, and backend-facing orchestration for Bookmark persistence.

## Boundaries

Full Bookmark CRUD is out of scope for v0.1, and no routes from this feature are currently registered.

Keep database schema changes in `packages/db`. Keep browser UI and Vue route behavior in the frontend Bookmark feature.

## Entry Points

Add future Bookmark route modules here, then mount them from the backend app composition layer when the behavior is ready.

## Testing

Add backend tests for Bookmark API behavior under `apps/backend/test/` or next to this feature if the test stays feature-local.

## Conventions

Use `Bookmark`, `Tag`, and `Related Link` according to `CONTEXT.md`. Avoid generic names such as item, favorite, category, or attachment when they refer to established domain concepts.
