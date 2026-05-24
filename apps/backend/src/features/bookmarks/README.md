# Bookmarks Backend Feature

See `/docs/architecture.md` for project-wide vertical slice, import boundary, and Result handling rules.

## Responsibility

This directory owns backend behavior around Bookmarks, including Bookmark HTTP routes, request validation, Result response mapping, and backend-facing orchestration for Bookmark persistence.

## Boundaries

This slice owns Bookmark list, create, read-by-id, update, and delete behavior. Application modules own Bookmark workflow orchestration and depend on narrow persistence adapters instead of Drizzle query details. Repository modules own Drizzle-backed persistence adapters, read repositories, loaders, and DTO mapping. The slice delegates Tag lifecycle rules to the backend Tag feature and owns the Bookmark-side rules for synchronizing Related Links from Bookmark descriptions.

Keep database schema changes in `packages/db`. Keep Tag lifecycle behavior in the backend Tag feature. Keep browser UI and Vue route behavior in the frontend Bookmark feature.

Backend API behavior is covered by `bookmarks-api.test.ts`, which runs the Bun/Elysia smoke suites for create, list/get, and update behavior.
