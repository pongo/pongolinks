# Database Package

## Responsibility

`@pongolinks/db` owns durable schema definitions, Drizzle relations, database client setup, and generated migrations for the SQLite database.

Runtime database access uses Drizzle with `@libsql/client` against local SQLite storage. Callers pass `databasePath` into `createDb`; backend environment configuration remains `DATABASE_PATH`.

## Boundaries

Schema and migration changes belong here. Backend features may import the package, but they should not define durable tables, relations, or migration files inside `apps/backend`.

Do not place HTTP route logic, frontend view models, or feature UI types in this package. Only export database-level constructs that other workspaces are allowed to depend on.

## Entry Points

- `src/schema.ts` defines Drizzle tables.
- `src/relations.ts` defines Drizzle relations.
- `src/client.ts` creates database access.
- `src/index.ts` is the public package export.
- `drizzle.config.ts` points Drizzle Kit at the schema and migrations directory.

## Testing

Use the root commands unless you are intentionally narrowing scope:

- `bun run typecheck`
- `bun run agent:test`

Migration and database smoke tests live under `packages/db/test/`.

## Conventions

Generate migrations from schema changes with the repository's existing Drizzle workflow, then review the generated SQL before treating it as final. Keep migration filenames and generated metadata together under `drizzle/migrations`.

Use domain names from `CONTEXT.md` in table and relation naming where they represent domain concepts.
