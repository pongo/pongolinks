# pongolinks v0.1 Implementation Plan

Status: draft

## Goal

Initialize a thin but runnable monorepo skeleton for a personal single-user bookmark service.

The v0.1 result should prove the project shape, development commands, backend/frontend integration, and database package boundaries without implementing full bookmark CRUD yet.

## Decisions Already Made

- Use a single repository.
- Use `apps/backend` for the Bun + Elysia server.
- Use `apps/frontend` for the Vue + Vue Router SPA.
- Use `packages/db` for Drizzle schema, migrations, and SQLite connection concerns.
- Treat `docs/schema.sql` as historical input after v0.1 bootstrap; `packages/db` owns the executable schema and migrations.
- Use `packages/shared` for small cross-runtime primitives that are not owned by Eden or the database package.
- The backend is the only production entrypoint.
- The backend serves both the HTTP API and the built frontend static assets.
- Use Turborepo as a thin monorepo task runner.
- Keep vertical slices inside apps rather than turning each feature into its own package.
- Reserve a future `apps/extension` name for a browser extension, but do not create it in v0.1.
- Store the development SQLite database at `.data/pongolinks.sqlite`.
- Include applicable Drizzle Kit migrations in v0.1.
- Serve the built frontend from the backend in production mode.
- Wire the frontend to the backend through Eden in v0.1 using the health endpoint.
- Use `health` as the first real vertical slice and keep `bookmarks` as a documented placeholder in v0.1.
- Use Vitest for v0.1 tests.
- Use Bun workspaces in the root `package.json`.
- Use `bun:sqlite` as the SQLite driver.
- Use the `@pongolinks/*` package scope for workspace package names.
- Use a root `tsconfig.base.json` inherited by each app and package.
- Add formatting through `oxfmt`, but do not add linting in v0.1.
- Register backend feature routes explicitly in `apps/backend/src/app.ts`.
- Register frontend routes explicitly with Vue Router.
- Add a minimal backend config module backed by `Bun.env` defaults.
- Use Vite proxy for `/api` in frontend development.
- Use local `@/*` path aliases inside workspaces and `@pongolinks/*` names across workspaces.
- Expose `createDb({ databasePath })` from `@pongolinks/db` instead of a global database singleton.
- Do not open a database connection from the backend in v0.1.

## Proposed Project Structure

```txt
apps/
  backend/
    src/
      features/
        health/
        bookmarks/
      static/
      app.ts
      index.ts
    package.json
    tsconfig.json
  frontend/
    src/
      features/
        bookmarks/
      router/
      App.vue
      main.ts
    index.html
    package.json
    tsconfig.json
    vite.config.ts
packages/
  db/
    src/
      schema.ts
      relations.ts
      client.ts
    drizzle/
      migrations/
    drizzle.config.ts
    package.json
    tsconfig.json
  shared/
    src/
      index.ts
    package.json
    tsconfig.json
package.json
turbo.json
tsconfig.base.json
```

## v0.1 Scope

1. Initialize Bun workspaces and root package scripts.
2. Add Turborepo with minimal `dev`, `build`, `typecheck`, `test`, and `format` tasks.
3. Add a root `tsconfig.base.json` and per-workspace `tsconfig.json` files.
4. Create `apps/backend` with a minimal Elysia app.
5. Add `apps/backend/src/config.ts` for `PORT`, `DATABASE_PATH`, and `FRONTEND_DIST_PATH`.
6. Add a health endpoint that confirms the backend is running.
7. Create `apps/frontend` with a minimal Vue SPA and Vue Router setup.
8. Wire development commands so backend and Vite can run together.
9. Add Eden client wiring from the frontend to the backend health endpoint.
10. Create `packages/db` with Drizzle schema translated from `docs/schema.sql`.
11. Keep FTS5 setup as a Drizzle Kit custom SQL migration because Drizzle does not model SQLite virtual tables directly.
12. Add Drizzle Kit migrations that can create `.data/pongolinks.sqlite`.
13. Add a root `db:migrate` command that runs `drizzle-kit migrate`.
14. Create `packages/shared` with an empty public entrypoint and usage boundaries.
15. Configure backend static serving for `apps/frontend/dist` in production.
16. Add SPA fallback for non-API routes.
17. Add `.data/` to `.gitignore` for local SQLite files.
18. Add a working `health` vertical slice in backend and frontend.
19. Add a placeholder `bookmarks` vertical slice in backend and frontend without implementing full CRUD.
20. Add Vitest smoke tests for the backend health endpoint and database migrations.
21. Split the finalized v0.1 plan into small implementation issues under `.scratch/v0.1/issues/`.
22. Document the first follow-up issues after the skeleton runs.

## Out Of Scope

- Authentication and multi-user support.
- Full bookmark CRUD.
- Browser extension.
- Import/export flows.
- Search UI.
- Tag management UI.
- Deployment automation.
- Remote Turbo cache.

## Architecture Notes

The backend owns the Eden-compatible Elysia routes and is the deployable process. The frontend is a browser SPA that runs through Vite in development and builds into static assets served by the backend in production.

API routes should live under `/api/*`. Non-API routes should fall back to the frontend `index.html` in production so Vue Router can own client-side navigation.

The frontend should call the backend health endpoint through Eden in v0.1. This is an integration smoke test for the chosen stack, not the start of bookmark CRUD.

The health endpoint contract is `GET /api/health -> { status: "ok" }`. It should prove server liveness only and should not perform database checks in v0.1.

The initial frontend route `/` should be a thin pongolinks shell. It should show the application name and backend health state loaded through Eden, without bookmark UI or marketing content.

The frontend should call the backend through same-origin `/api` paths. In development, Vite should proxy `/api` to the backend; in production, the backend serves both `/api/*` and frontend static assets from the same origin.

Each workspace may use a local `@/*` alias for imports inside its own source tree. Cross-workspace imports should use package names such as `@pongolinks/db` and `@pongolinks/shared`.

`docs/schema.sql` is the source input for bootstrapping v0.1. After the Drizzle schema and migrations exist, `packages/db` should be treated as the executable source of truth for database structure.

Use Drizzle Kit for both generated and custom SQL migrations. Normal tables, indexes, checks, and foreign keys should come from the Drizzle schema via `drizzle-kit generate`. FTS5 virtual table and sync triggers should live in a custom Drizzle Kit migration generated with `drizzle-kit generate --custom`, then applied through the same `drizzle-kit migrate` flow.

Use `bun:sqlite` for runtime SQLite access. Do not add `better-sqlite3` in v0.1 unless `bun:sqlite` blocks a required Drizzle workflow.

`@pongolinks/db` should export schema, relations, and a `createDb({ databasePath })` factory. The database package should not read backend environment variables or expose a global singleton connection.

The backend should not create a SQLite connection at startup in v0.1 because the health endpoint does not need the database. Runtime database wiring should be introduced with the first real bookmarks endpoint.

Backend config should live in `apps/backend/src/config.ts`, read from `Bun.env`, and provide defaults for `PORT`, `DATABASE_PATH`, and `FRONTEND_DIST_PATH`. Do not add a validation library in v0.1.

The `health` feature should be the first concrete vertical slice. The `bookmarks` feature should exist only as a README-backed placeholder in v0.1 so the project shape is visible without prematurely designing CRUD.

Vitest should be the test runner for v0.1. The initial test surface should stay small: one backend integration test for `/api/health` and one database smoke test proving migrations can create the SQLite schema.

The root `package.json` should define Bun workspaces for `apps/*` and `packages/*`. Do not add a second workspace manifest such as `pnpm-workspace.yaml`.

Workspace packages should use the `@pongolinks/*` scope: `@pongolinks/backend`, `@pongolinks/frontend`, `@pongolinks/db`, and `@pongolinks/shared`.

TypeScript settings should start from a root `tsconfig.base.json`. Each app and package should extend it and keep only runtime-specific differences locally.

v0.1 should include formatting through `oxfmt`. Do not add ESLint, Biome linting, or another lint layer yet; quality gates should be `typecheck`, `test`, and `build`.

Backend feature routes should be registered explicitly from `apps/backend/src/app.ts`. Avoid filesystem-based route discovery in v0.1 so the Eden app type remains straightforward and easy for agents to follow.

Frontend routes should be registered explicitly in the Vue Router setup. Avoid file-based routing in v0.1.

The database package owns schema and migration concerns, but feature behavior should stay in app-level vertical slices. Shared packages should not become dumping grounds for business logic.

`packages/shared` should stay intentionally empty in v0.1 except for its package entrypoint. Later it may contain cross-runtime primitives with stable semantics, but it should not duplicate Eden-inferred API types, own database schema types, or collect feature-specific business logic.

## Open Questions

No open v0.1 architecture questions yet.

## Implementation Issues

1. [Bootstrap monorepo tooling](./issues/01-bootstrap-monorepo-tooling.md)
2. [Add backend health slice](./issues/02-backend-health-slice.md)
3. [Add frontend health shell](./issues/03-frontend-health-shell.md)
4. [Add database package and migrations](./issues/04-database-package-and-migrations.md)
5. [Serve built frontend from backend](./issues/05-production-single-entrypoint.md)
6. [Add bookmarks placeholder and follow-up slices](./issues/06-bookmarks-placeholder-and-followups.md)

## First Follow-Up Slices

1. Create bookmark.
2. List bookmarks by `updated_at DESC`.
3. View bookmark details with related links and tags.
4. Edit bookmark metadata.
5. Add FTS-backed search.

Commit message: chore: plan v0.1 monorepo skeleton
