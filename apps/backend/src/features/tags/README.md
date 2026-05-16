# Tags Backend Feature

## Responsibility

This directory owns backend behavior around Tag summary reads, including the Tag HTTP route, Result response mapping, and backend-facing orchestration for Tag list persistence.
Tag Popularity is stored as a denormalized counter in `tags.usage_count` and maintained by database triggers on `bookmark_tags`.

## Boundaries

This slice owns Tag list behavior and the `/api/tags` read endpoint. It reports saved Tag display names, normalized names, and current Bookmark usage counts.

Keep database schema changes in `packages/db`. Keep Bookmark create/update behavior and Tag synchronization from submitted Bookmark text in the backend Bookmark feature. Keep browser UI and Vue route behavior in the frontend Tag or Bookmark features.

## Entry Points

- `routes.ts` exposes the Tag HTTP route module mounted from `apps/backend/src/app.ts`.
- `tags-repository.ts` reads Tag summaries with usage counts and maps database rows to Tag DTOs.
- `contracts.ts` contains the Tag response contracts.

## Testing

Backend API behavior is covered by `tags-api.test.ts`, which runs the Bun/Elysia smoke suite in `tags-api-smoke.ts`. Feature-local repository or contract tests should live next to the modules they verify.

## Conventions

Use `Tag` according to `CONTEXT.md`. Avoid generic names such as category or label when they refer to the established domain concept.

Return operational errors as `Result` values. Throw only for programmer errors, failed invariants, and test assertions.
