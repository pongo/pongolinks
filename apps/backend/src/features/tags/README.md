# Tags Backend Feature

See `/docs/architecture.md` for project-wide vertical slice, import boundary, and Result handling rules.

## Responsibility

This directory owns backend behavior around Tag summary reads, including the Tag HTTP route, Result response mapping, and backend-facing orchestration for Tag list persistence.
Tag Popularity is stored as a denormalized counter in `tags.usage_count` and maintained by database triggers on `bookmark_tags`.

## Boundaries

This slice owns Tag list behavior and the `/api/tags` read endpoint. It reports saved Tag display names, normalized names, and current Bookmark usage counts.

Keep database schema changes in `packages/db`. Keep Bookmark create/update behavior and Tag synchronization from submitted Bookmark text in the backend Bookmark feature. Keep browser UI and Vue route behavior in the frontend Tag or Bookmark features.

Backend API behavior is covered by `tags-api.test.ts`, which runs the Bun/Elysia smoke suite in `tags-api-smoke.ts`.
