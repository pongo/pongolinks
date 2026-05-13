# Backend

## Responsibility

The backend is the production entrypoint for pongolinks. It owns the Bun/Elysia server, the HTTP API, the Eden contract consumed by the frontend, database access orchestration, and serving built frontend assets in production.

## Boundaries

Keep backend behavior in vertical feature slices under `src/features/<feature>/`. Cross-feature HTTP composition belongs in `src/app.ts`, while process startup belongs in `src/index.ts`.

Do not put Vue UI state, browser-only behavior, or frontend routing here. Do not bypass `packages/db` for durable data concerns.

## Entry Points

- `src/app.ts` creates the Elysia app, mounts `/pongolinks/api`, and exports the Eden-visible app types.
- `src/index.ts` starts the Bun server and re-exports the app contract.
- `src/features/*/routes.ts` files own feature route definitions before they are mounted by `src/app.ts`.

## Testing

Use the root commands unless you are intentionally narrowing scope:

- `bun run typecheck`
- `bun run agent:test`

Backend-specific tests live under `apps/backend/test/`.

## Conventions

API routes are grouped under `/pongolinks/api`. Feature routes should expose domain behavior using terms from `CONTEXT.md`; for example, use `Bookmark` instead of generic alternatives such as item or favorite.

Keep route modules small and feature-owned. When adding a new feature, add the route implementation in that feature directory first, then mount it from the app composition layer.
