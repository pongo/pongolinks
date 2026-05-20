# Add LRU Cache For Search Check

## Summary

Add a small in-memory LRU cache around `GET /search/check`. Use conservative invalidation: clear the whole search cache after successful bookmark create/update/delete. This avoids stale exact, alternate-protocol, related-link, and not-found results without coupling bookmarks internals to search internals.

## Implementation Changes

- Add `lru-cache` to `apps/backend` dependencies.
- Introduce a backend-local search cache abstraction, likely under `apps/backend/src/features/search/`, with:
  - key: normalized validated `BookmarkUrl.value()`
  - value: successful `BookmarkUrlCheckResult`
  - bounded `max` and short `ttl`
  - methods like `get`, `set`, `clear`
- Create one cache instance in `apps/backend/src/app.ts` inside `createApiRoutes`.
- Pass it into `createSearchRoutes({ db, cache })` and `createBookmarkRoutes({ db, searchCacheInvalidation })`.
- In `SearchRepository` or `routes.ts`, read cache after URL validation and before DB lookup; write only successful `Ok` results.
- In bookmark create/update/delete handlers, call `searchCache.clear()` only after the editor returns `Ok`.

## Public Interfaces / Types

- Extend route factory options:
  - `SearchRoutesOptions` gets an optional or required search cache dependency.
  - `BookmarkRoutesOptions` gets an optional invalidation dependency, e.g. `{ clearSearchCheckCache: () => void }`.
- Do not expose cache state over HTTP.
- Do not change frontend-facing response shapes.

## Test Plan

- Add/extend backend smoke tests for `/search/check`:
  - repeated same URL returns same correct result with cache enabled
  - cached exact match is invalidated after bookmark delete
  - cached not-found is invalidated after bookmark create
  - cached related-link result is invalidated after bookmark update/delete
- Run:
  - `bun run typecheck`
  - `bun run agent:test`
  - `bun run format`

## Assumptions

- Whole-cache invalidation is acceptable because this is a personal bookmark library and search-check cache size should be modest.
- Precise per-URL invalidation is not worth the extra coupling yet; it would require tracking bookmark URL, flipped URL, old/new related links, and cached not-found keys.
- UI text is unaffected.

Commit message: `feat(backend): cache search URL checks with invalidation`
