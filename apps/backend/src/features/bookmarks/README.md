# Bookmarks Backend Feature

## Responsibility

This directory owns backend behavior around Bookmarks, including Bookmark HTTP routes, request validation, Result response mapping, and backend-facing orchestration for Bookmark persistence.

## Boundaries

This slice owns Bookmark list, create, read-by-id, and update behavior. It also owns the Bookmark-side rules for synchronizing Tags from submitted Tag text and Related Links from Bookmark descriptions.

Keep database schema changes in `packages/db`. Keep Tag summary/read behavior in the backend Tag feature. Keep browser UI and Vue route behavior in the frontend Bookmark feature.

## Entry Points

- `routes.ts` exposes the Bookmark HTTP route module mounted from `apps/backend/src/app.ts`.
- `bookmarks-repository.ts` persists Bookmarks, synchronizes Bookmark Tags and Related Links, and maps database rows to Bookmark DTOs.
- `domain/` contains validated Bookmark primitives and Bookmark request/response contracts.
- `utils/extract-related-links.ts` contains Bookmark description parsing used for Related Link synchronization.

## Testing

Backend API behavior is covered by `bookmarks-api.test.ts`, which runs the Bun SQLite smoke suite in `bookmarks-api-smoke.ts`. Feature-local domain and utility tests live next to the modules they verify.

## Conventions

Use `Bookmark`, `Tag`, and `Related Link` according to `CONTEXT.md`. Avoid generic names such as item, favorite, category, or attachment when they refer to established domain concepts.

Return operational errors as `Result` values. Throw only for programmer errors, failed invariants, and test assertions.
