# Serve built frontend from backend

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Make the backend the single production entrypoint. A production build should compile the Vue SPA into static assets, then the Bun + Elysia backend should serve both `/api/*` and the built frontend from the same origin, including SPA fallback for non-API routes.

## Acceptance criteria

- [ ] `bun run build` builds the frontend before the backend production artifact or start target depends on it.
- [ ] Backend static serving uses the configured `FRONTEND_DIST_PATH`.
- [ ] API routes remain under `/api/*`.
- [ ] Non-API routes fall back to the frontend `index.html` in production.
- [ ] Production serving does not break `GET /api/health`.
- [ ] A smoke check or test verifies that a non-API route receives the SPA fallback after build.

## Blocked by

- .scratch/v0.1/issues/02-backend-health-slice.md
- .scratch/v0.1/issues/03-frontend-health-shell.md
