# Add Bookmark backend foundation

Status: ready-for-agent

## Parent

.scratch/v0.2/IMPLEMENTATION_PLAN.md

## What to build

Create the backend foundation for the first database-backed **Bookmark** slice. This should establish database dependency injection for tests and runtime, response envelopes for `Result`-based API behavior, backend-local Value Objects for validated Bookmark primitives, basic editable Bookmark input validation, and explicit Bookmark API contracts without exposing raw database row shape.

Follow ADR-0002 for Value Objects. Keep the foundation inside the backend vertical slice unless the v0.2 plan explicitly calls for a backend-local shared helper.

## Acceptance criteria

- [ ] `createApp()` can receive a database dependency so tests can pass an in-memory SQLite database.
- [ ] Runtime app creation can open the configured SQLite database without running migrations at startup.
- [ ] A backend-local helper maps successful values and expected `Result` errors to JSON envelopes.
- [ ] Success envelopes use `{ ok: true, data: ... }`.
- [ ] Error envelopes use `{ ok: false, error: { message, code, data? } }`.
- [ ] `BookmarkUrl` is a class Value Object with a private constructor and a static factory returning `Result`.
- [ ] `BookmarkUrl` accepts trimmed absolute `http://` and `https://` URLs.
- [ ] `BookmarkUrl` rejects empty, relative, and non-http(s) URLs.
- [ ] `BookmarkId` is a class Value Object with a private constructor and a static factory returning `Result`.
- [ ] `BookmarkId` accepts only positive safe integer ids.
- [ ] `bookmark-validation.ts` validates title, description, and private flag input for the editable Bookmark payload.
- [ ] `BookmarkDTO` and request contract types live inside the backend Bookmark slice.
- [ ] The repository maps database rows to explicit `BookmarkDTO` values rather than returning Drizzle row shape directly.
- [ ] Unit tests cover `BookmarkUrl` and `BookmarkId` accepted and rejected values from the v0.2 plan.

## Blocked by

None - can start immediately
