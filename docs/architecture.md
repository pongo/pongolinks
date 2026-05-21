# Architecture

This document is the compact architecture map for pongolinks. It explains where code belongs, which boundaries matter, and which documents to read before changing a part of the system.

## Overview

pongolinks is a personal bookmark library for saving, organizing, and rediscovering links.

The repository is a Bun workspace monorepo coordinated with Turborepo. The product is split into apps and shared packages, with app behavior organized as vertical feature slices.

The backend is the production entrypoint. It owns the HTTP API, the Elysia Eden contract, database access orchestration, and serving built frontend assets in production. The frontend is a Vue SPA that calls backend routes through Eden.

## Monorepo Layout

```text
/
├── apps/
│   ├── backend/        Bun/Elysia server and production entrypoint
│   └── frontend/       Vue SPA and browser UI
├── packages/
│   ├── db/             Drizzle schema, relations, database client, migrations
│   └── shared/         Stable cross-workspace TypeScript contracts and helpers
├── docs/
│   ├── adr/            Architecture Decision Records
│   ├── agents/         Agent workflow documentation
│   └── architecture.md This document
└── CONTEXT.md          Domain glossary and relationships
```

## Vertical Slices

Application behavior belongs in feature-owned vertical slices:

- Backend feature behavior lives under `apps/backend/src/features/<feature>/`.
- Frontend feature behavior lives under `apps/frontend/src/features/<feature>/`.
- Feature modules should own their route handlers, UI adapters, view logic, contracts, and tests when those concerns are specific to the feature.

Keep cross-feature composition thin. Backend HTTP composition belongs in `apps/backend/src/app.ts`. Frontend route registration belongs in `apps/frontend/src/router.ts`.

When a feature needs behavior from another feature, prefer the other feature's public API or entrypoint. Do not import private internals across feature boundaries.

## Workspace Responsibilities

### `apps/backend`

The backend owns:

- Bun/Elysia server startup and app composition.
- HTTP API routes under `/pl/api`.
- The Eden-visible app contract consumed by the frontend.
- Backend-facing orchestration around persistence.
- Mapping operational failures to shared Result responses.
- Serving built frontend assets in production.

Important entry points:

- `src/app.ts` creates and composes the Elysia app.
- `src/index.ts` starts the Bun server and re-exports the app contract.
- `src/features/*/routes.ts` files expose feature route modules.

### `apps/frontend`

The frontend owns:

- Vue route-level views.
- Browser UI and user interaction.
- Feature components and view-local workflow state.
- Eden API adapters that translate backend responses into UI-facing Results.

Important entry points:

- `src/main.ts` creates the Vue app.
- `src/router.ts` registers SPA routes.
- `src/features/*` contains feature-owned views, components, API adapters, and UI helpers.

User-facing text must be in English.

### `packages/db`

`@pongolinks/db` owns durable database concerns:

- Drizzle table definitions.
- Drizzle relations.
- Database client creation.
- Generated migrations.

Backend features may depend on this package, but durable schema and migration files should not live inside app feature folders.

### `packages/shared`

`@pongolinks/shared` is for stable TypeScript code that is genuinely shared by multiple workspaces.

Prefer keeping helpers, types, and contracts inside the owning feature until at least two workspaces need the same stable abstraction. Do not use this package as a convenience dump for app-specific code.

## Import Boundaries

Relative imports are allowed only within the same vertical slice or module.

Use aliases or workspace package imports when crossing feature, app-infrastructure, or shared-layer boundaries:

- Use `#/...` for app-local cross-boundary imports, such as `#/http/result-response.ts`, `#/db/app-db.ts`, or `#/features/tags/api.ts`.
- Use workspace package imports across package boundaries, such as `@pongolinks/shared/result` or `@pongolinks/db/schema`.

Do not deep-import another feature's private files through relative paths. If cross-feature access is necessary, expose the needed behavior through a public feature module first.

## Error Handling

Operational errors use the shared Rust-style Result pattern.

- Return `Result<T, E>` for expected failures such as validation errors, not-found cases, duplicates, persistence failures, and transport-facing errors.
- Throw exceptions for programmer errors, failed invariants, and test assertions.
- Backend API routes should return the shared Result response shape from `@pongolinks/shared/result`.
- Frontend feature adapters should translate Eden responses into UI-facing Results instead of exposing transport details to Vue components.
- API error codes are wire-level backend/frontend contracts and should live in `@pongolinks/shared/api-errors`; app-local `ApiError` classes may adapt those codes to HTTP status or UI form errors.

## Domain Language

`CONTEXT.md` is the source of truth for domain vocabulary, relationships, and rules. Use those terms in code, tests, UI labels, issue titles, and documentation.

Do not put implementation details in `CONTEXT.md`. If a term needs clarification, update the glossary. If an architecture decision needs context, add or update an ADR.

## Architecture Decisions

Use `docs/adr/` for decisions that are hard to reverse, surprising without context, and based on a real trade-off.

Current decisions include:

- ADR-0001: monorepo with a single backend entrypoint.
- ADR-0002: Value Objects for validated domain primitives.
- ADR-0003: evlog wide events for backend observability.
- ADR-0004: local libSQL driver for SQLite.

Read the relevant ADRs before changing the affected area.

## Testing and Verification

Use root commands unless intentionally narrowing the scope:

- Type checking: `bun run typecheck`
- Tests: `bun run agent:test`
- Formatting: `bun run format`

Do not start the development server as part of routine agent verification. Do not deploy. Do not create git commits unless explicitly requested.

## Adding New Code

When adding behavior:

1. Name the domain concepts using `CONTEXT.md`.
2. Put feature-specific behavior in the owning vertical slice.
3. Keep app composition files thin.
4. Promote code to `packages/shared` only after it is truly shared across workspaces.
5. Put durable schema and migrations in `packages/db`.
6. Use Results for operational errors.
7. Add focused tests close to the behavior being changed.

## Related Documentation

- `CONTEXT.md`: domain glossary and relationships.
- `docs/adr/`: architecture decisions and trade-offs.
- `docs/agents/`: agent-specific workflow documentation.
- Local `README.md` files: detailed orientation for a specific app, package, or feature.
