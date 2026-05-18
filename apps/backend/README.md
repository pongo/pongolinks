# Backend

See `/docs/architecture.md` for the project-wide architecture rules, import boundaries, error handling policy, and verification commands.

## Responsibility

The backend is the production entrypoint for pongolinks. It owns the Bun/Elysia server, the HTTP API, the Eden contract consumed by the frontend, database access orchestration, and serving built frontend assets in production.

## Boundaries

Keep backend behavior in vertical feature slices under `src/features/<feature>/`. Cross-feature HTTP composition belongs in `src/app.ts`, while process startup belongs in `src/index.ts`.

Do not put Vue UI state, browser-only behavior, or frontend routing here. Do not bypass `packages/db` for durable data concerns.

API routes are grouped under `/pl/api`.
