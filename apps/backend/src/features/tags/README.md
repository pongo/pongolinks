# Tags Backend Feature

See `/docs/architecture.md` for project-wide vertical slice, import boundary, and Result handling rules.

## Responsibility

This directory owns backend behavior around Tag lifecycle, including Tag name validation, Bookmark Tag attachment synchronization, Tag summary reads, Tag rename/merge/delete use cases, the Tag HTTP route, Result response mapping, and backend-facing orchestration for Tag persistence.
Tag Popularity is stored as a denormalized counter in `tags.usage_count` and maintained by database triggers on `bookmark_tags`.

## Boundaries

This slice owns Tag lifecycle behavior and the `/api/tags` endpoints. It reports saved Tag display names, normalized names, and current Bookmark usage counts.

Keep database schema changes in `packages/db`. Keep Bookmark create/update/delete transaction orchestration in the backend Bookmark feature, but delegate Tag attachment replacement and orphan cleanup to this feature. Keep browser UI and Vue route behavior in the frontend Tag or Bookmark features.

Backend API behavior is covered by `tags-api.test.ts`, which runs the Bun/Elysia smoke suite in `tags-api-smoke.ts`.
