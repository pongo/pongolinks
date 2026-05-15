Status: ready-for-agent

# Convert DB and Bookmark repository tests to direct Vitest

## Parent

`.scratch/local-libsql-driver/PRD.md`

## What to build

Move migration smoke coverage and Bookmark editor characterization coverage onto the local libSQL-backed migrated test database fixture so they run directly as Vitest tests. These tests should verify database and repository behavior without spawning Bun, while still using real migrated SQLite schema behavior.

## Acceptance criteria

- [ ] The migrated test database helper uses the local libSQL-backed database creation path.
- [ ] Migration smoke coverage runs as a normal Vitest test without `spawnSync("bun")`.
- [ ] Migration smoke coverage still checks migrated tables, FTS triggers, foreign keys, uniqueness behavior, and `updated_at` behavior.
- [ ] Bookmark editor characterization runs as a normal Vitest suite without a standalone Bun script wrapper.
- [ ] Bookmark editor coverage still verifies duplicate Bookmark URLs, unique submitted Tags, sorted returned Tags, Related Link extraction, duplicate update errors, missing update errors, Tag attach/detach/orphan deletion, shared Tag preservation, and Related Link insert/delete/retain behavior.
- [ ] Tests assert durable behavior and returned Results, not private helper call order.

## Blocked by

- `.scratch/local-libsql-driver/issues/01-switch-database-client-to-local-libsql.md`
