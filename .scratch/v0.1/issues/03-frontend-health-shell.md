# Add frontend health shell

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Create the thin Vue SPA shell for pongolinks and prove frontend-to-backend integration through Eden. The initial route should show the application name and the backend health state loaded through the same-origin `/api` path, with Vite proxying `/api` to the backend in development.

## Acceptance criteria

- [ ] `apps/frontend` is a minimal Vue + Vue Router app.
- [ ] Frontend routes are registered explicitly with Vue Router.
- [ ] The `/` route renders a thin pongolinks shell rather than a marketing page or bookmark UI.
- [ ] The frontend calls `GET /api/health` through Eden, not raw `fetch`.
- [ ] Vite proxies `/api` to the backend in development.
- [ ] Frontend source uses local `@/*` imports where useful and cross-workspace imports only through `@pongolinks/*`.
- [ ] `bun run dev` can run backend and frontend together through Turbo once the backend health slice is present.

## Blocked by

- .scratch/v0.1/issues/01-bootstrap-monorepo-tooling.md
- .scratch/v0.1/issues/02-backend-health-slice.md
