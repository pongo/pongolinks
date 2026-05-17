# Database Package

See `/docs/architecture.md` for the project-wide architecture rules, workspace boundaries, and verification commands.

## Responsibility

`@pongolinks/db` owns durable schema definitions, Drizzle relations, database client setup, and generated migrations for the SQLite database.

Runtime database access uses Drizzle with `@libsql/client` against local SQLite storage. Callers pass `databasePath` into `createDb`; backend environment configuration remains `DATABASE_PATH`.

## Boundaries

Schema and migration changes belong here. Backend features may import the package, but they should not define durable tables, relations, or migration files inside `apps/backend`.

Do not place HTTP route logic, frontend view models, or feature UI types in this package. Only export database-level constructs that other workspaces are allowed to depend on.

Generate migrations from schema changes with the repository's existing Drizzle workflow, then review the generated SQL before treating it as final. Keep migration filenames and generated metadata together under `drizzle/migrations`.
