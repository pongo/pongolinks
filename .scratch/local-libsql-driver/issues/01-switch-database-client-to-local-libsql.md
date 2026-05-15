Status: ready-for-human

# Switch database client to local libSQL

## Parent

`.scratch/local-libsql-driver/PRD.md`

## What to build

Replace the Bun-only SQLite database driver with a local `@libsql/client` Drizzle setup while preserving the current local SQLite deployment shape. The backend should continue accepting `DATABASE_PATH` as the database configuration input, and callers should keep using the database package boundary rather than learning driver internals.

## Acceptance criteria

- [x] App and package source no longer import `bun:sqlite` or `drizzle-orm/bun-sqlite`.
- [x] The database package creates a Drizzle database through `@libsql/client` for local SQLite storage.
- [x] Backend configuration remains path-based through `DATABASE_PATH` / `databasePath`; remote Turso/libSQL configuration is not introduced.
- [x] The backend database type no longer depends on `BunSQLiteDatabase`.
- [x] Existing Bookmark, Tag, Related Link, and API Result behavior is preserved.
- [x] ADR-0004 remains accurate after the implementation.

## Blocked by

None - can start immediately
