Status: ready-for-agent

# Keep API smoke tests runtime scoped

## Parent

`.scratch/local-libsql-driver/PRD.md`

## What to build

Keep Bun subprocess smoke tests only where they verify the Bun/Elysia API runtime. After database and repository coverage move to direct Vitest, the Bookmark and Tag API smoke tests should remain focused on route behavior and runtime integration rather than carrying database-driver compatibility coverage.

## Acceptance criteria

- [ ] Bookmark API smoke tests still exercise the Bun/Elysia runtime path where needed.
- [ ] Tag API smoke tests still exercise the Bun/Elysia runtime path where needed.
- [ ] API smoke tests use the migrated local libSQL test database fixture successfully.
- [ ] Repository/database-only assertions are not duplicated in API smoke scripts when direct Vitest coverage owns them.
- [ ] Public API response shapes and error codes are unchanged.

## Blocked by

- `.scratch/local-libsql-driver/issues/01-switch-database-client-to-local-libsql.md`
- `.scratch/local-libsql-driver/issues/02-convert-db-and-bookmark-repository-tests-to-vitest.md`
