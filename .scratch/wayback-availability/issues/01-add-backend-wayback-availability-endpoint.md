Status: ready-for-agent

# Add backend Wayback availability endpoint

## Parent

.scratch/wayback-availability/PRD.md

## What to build

Add a backend API path that accepts a candidate Bookmark URL, validates it with the existing Bookmark URL rules, checks the HTTPS Wayback Availability API, and returns whether an accessible archived snapshot exists.

The slice should include a deep Wayback integration module with a small interface: given a validated Bookmark URL, return a Result containing this discriminated contract:

```ts
type WaybackAvailabilityDTO =
  | { available: false }
  | {
      available: true;
      archivedUrl: string;
      timestamp: string;
    };
```

The module owns fetch behavior, response parsing, operational error mapping, and a small in-memory `quick-lru` cache. It must use `https://archive.org/wayback/available?url=...`, must not retry Wayback failures, and must not cache operational errors.

Тесты должны использовать мок, а не обращаться напрямую к `https://archive.org/wayback/available?url=...`

примеры запросов к api wayback:

```bash
$ curl https://archive.org/wayback/available?url=https://jayconrod.com/posts/133/integration-tests-are-best-tests
{"url": "https://jayconrod.com/posts/133/integration-tests-are-best-tests", "archived_snapshots": {"closest": {"status": "200", "available": true, "url": "http://web.archive.org/web/20260212061822/https://jayconrod.com/posts/133/integration-tests-are-best-tests", "timestamp": "20260212061822"}}}

$ curl https://archive.org/wayback/available?url=https://github.com/DrKain/tidy-url
{"url": "https://github.com/DrKain/tidy-url", "archived_snapshots": {"closest": {"status": "200", "available": true, "url": "http://web.archive.org/web/20260311082645/https://github.com/DrKain/tidy-url", "timestamp": "20260311082645"}}}

$ curl https://archive.org/wayback/available?url=https://www.youtube.com/watch?v=_sOjKkBIlys
{"url": "https://www.youtube.com/watch?v=_sOjKkBIlys", "archived_snapshots": {}}
```

## Acceptance criteria

- [ ] The backend exposes a Wayback availability endpoint inside the existing API surface.
- [ ] The endpoint validates input with the same Bookmark URL rules used by Bookmark create and edit behavior.
- [ ] Available Wayback responses return `available: true` with `archivedUrl` and `timestamp`.
- [ ] Unavailable Wayback responses return `available: false` without nullable fields.
- [ ] Wayback `429`, non-OK responses, malformed payloads, and network failures return Result errors.
- [ ] Wayback failures are not retried.
- [ ] Successful available and unavailable results are cached with `quick-lru`.
- [ ] The cache uses `maxSize: 64` and `maxAge: 24 hours`.
- [ ] Cache keys use the validated normalized Bookmark URL value.
- [ ] Operational errors are not cached.
- [ ] Tests cover available, unavailable, malformed, `429`, fetch failure, invalid Bookmark URL, and cache-hit behavior.

## Blocked by

None - can start immediately

Commit message: `feat(bookmarks): add backend Wayback availability endpoint`
