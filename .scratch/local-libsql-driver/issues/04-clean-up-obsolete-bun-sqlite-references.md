Status: ready-for-agent

# Clean up obsolete Bun SQLite references

## Parent

`.scratch/local-libsql-driver/PRD.md`

## What to build

Remove or update stale active references to the old Bun SQLite driver after the local libSQL migration is complete. Documentation and architecture notes should no longer instruct future agents to preserve `bun:sqlite` or route repository/database tests through Bun subprocesses, while historical context can remain where it is clearly archival.

## Acceptance criteria

- [ ] Active source, test, package, and README guidance no longer points developers toward `bun:sqlite`.
- [ ] Active testing guidance no longer says repository or database tests must use Bun subprocess wrappers.
- [ ] Architecture planning notes that contradict ADR-0004 are updated or clearly marked as superseded.
- [ ] Historical references are left alone when they are not likely to guide future implementation work.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- `.scratch/local-libsql-driver/issues/01-switch-database-client-to-local-libsql.md`
- `.scratch/local-libsql-driver/issues/02-convert-db-and-bookmark-repository-tests-to-vitest.md`
- `.scratch/local-libsql-driver/issues/03-keep-api-smoke-tests-runtime-scoped.md`
