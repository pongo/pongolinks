# Add backend health slice

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Add the first backend vertical slice: a minimal Bun + Elysia application with explicit route registration and a server-liveness health endpoint under the `/api` namespace. The backend should have a small `Bun.env`-backed config module, but it must not open a SQLite connection in v0.1.

## Acceptance criteria

- [ ] `apps/backend` runs a minimal Elysia app on the configured `PORT`.
- [ ] Backend config reads `PORT`, `DATABASE_PATH`, and `FRONTEND_DIST_PATH` from `Bun.env` with sensible defaults.
- [ ] Feature routes are registered explicitly from the backend app composition root.
- [ ] `GET /api/health` returns exactly `{ "status": "ok" }`.
- [ ] The health endpoint does not check or open the database.
- [ ] Backend source uses local `@/*` imports where useful and cross-workspace imports only through `@pongolinks/*`.
- [ ] A Vitest integration test verifies the health endpoint contract.

## Blocked by

- .scratch/v0.1/issues/01-bootstrap-monorepo-tooling.md
