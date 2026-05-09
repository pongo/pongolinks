# Add database package and migrations

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Create `@pongolinks/db` as the executable source of truth for the SQLite schema. Translate `docs/schema.sql` into Drizzle schema and relations, use `bun:sqlite` for runtime access, expose a `createDb({ databasePath })` factory, and manage both generated and custom SQL migrations through Drizzle Kit.

## Acceptance criteria

- [ ] `packages/db` contains Drizzle schema translated from `docs/schema.sql`.
- [ ] `packages/db` contains Drizzle relations for bookmarks, tags, bookmark tags, and related links.
- [ ] `@pongolinks/db` exports schema, relations, and `createDb({ databasePath })`.
- [ ] `@pongolinks/db` does not read backend environment variables and does not expose a global singleton connection.
- [ ] Runtime SQLite access uses `bun:sqlite`; `better-sqlite3` is not added.
- [ ] Drizzle Kit is configured for SQLite and `.data/pongolinks.sqlite`.
- [ ] Normal tables, indexes, checks, and foreign keys are represented through Drizzle-generated migrations.
- [ ] FTS5 virtual table and sync triggers are represented as a Drizzle Kit custom SQL migration.
- [ ] Root `bun run db:migrate` applies the Drizzle Kit migrations.
- [ ] A Vitest smoke test proves migrations can create the SQLite schema in a temporary or isolated database.

## Blocked by

- .scratch/v0.1/issues/01-bootstrap-monorepo-tooling.md
