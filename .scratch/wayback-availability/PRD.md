Status: ready-for-agent

# PRD: Wayback Availability for Bookmark URLs

## Problem Statement

A user can create and edit Bookmarks, but pongolinks does not show whether the Bookmark URL already has an accessible archived snapshot in the Wayback Machine. When a URL is not archived, the user has no prompt to inspect or save it through Wayback before the source page changes or disappears.

The Wayback availability API is useful for this check, but it is unstable and may return rate limits or transient failures. pongolinks must avoid unnecessary requests and must not let Wayback failures block normal Bookmark creation or editing.

## Solution

Show a one-time Wayback availability status under the Bookmark URL field when the form is opened with an initial Bookmark URL. For existing Bookmarks, check once when the edit form is shown. For Bookmark creation launched with a URL query parameter, check once when the create form is shown. Empty manual creation does not check Wayback.

If Wayback has a snapshot, show that the Bookmark URL is archived and link to the archived snapshot. If Wayback has no snapshot, show that it was not found and offer a link to `https://web.archive.org/web/` so the user can inspect or save it manually. If the Wayback API returns `429`, a malformed response, or any transport failure, show a non-blocking error under the URL field and do not retry. If the user edits the URL after the status target was established, hide the Wayback status entirely.

The backend owns the Wayback integration. It validates Bookmark URLs with the existing Bookmark URL value object, calls the HTTPS Wayback Availability API, maps expected failures to Result errors, and caches successful availability results in a small in-memory LRU cache.

## User Stories

1. As a pongolinks user, I want to see whether a Bookmark URL is archived, so that I can judge whether the page has a recoverable copy.
2. As a pongolinks user, I want Wayback status to appear under the URL field, so that the status is visually tied to the URL being checked.
3. As a pongolinks user, I want existing Bookmarks to be checked once when I open the edit form, so that I can inspect archival coverage without extra clicks.
4. As a pongolinks user, I want Bookmark creation launched with a URL parameter to be checked once, so that Bookmarklet-assisted creation can surface archival coverage.
5. As a pongolinks user, I want empty manual Bookmark creation to avoid Wayback checks, so that the app does not call external services before there is a URL to check.
6. As a pongolinks user, I want Wayback status to disappear if I edit the URL, so that I do not see stale status for a different Bookmark URL.
7. As a pongolinks user, I want a successful archived status to include the archived snapshot link, so that I can open the Wayback copy directly.
8. As a pongolinks user, I want a successful archived status to include the snapshot timestamp, so that I can understand when the archived copy was captured.
9. As a pongolinks user, I want a not-archived status to offer a Wayback Machine link, so that I can manually inspect or save the URL.
10. As a pongolinks user, I want the Wayback Machine link to open `https://web.archive.org/web/`, so that I land on the normal Wayback interface rather than triggering a direct save request.
11. As a pongolinks user, I want Wayback API failures to show as text under the URL field, so that I know the check failed without losing my form work.
12. As a pongolinks user, I want Wayback failures to be non-blocking, so that I can still create or edit the Bookmark.
13. As a pongolinks user, I want pongolinks to avoid repeated Wayback checks for the same URL, so that the service remains responsive and avoids unnecessary external traffic.
14. As a backend maintainer, I want the Wayback integration behind a backend endpoint, so that CORS, rate limits, malformed responses, and transport failures are handled in one place.
15. As a backend maintainer, I want Wayback operational failures represented as Result errors, so that the project error-handling policy stays consistent.
16. As a backend maintainer, I want no retry on `429` or other Wayback failures, so that pongolinks does not amplify rate limits or unstable API behavior.
17. As a backend maintainer, I want successful Wayback availability results cached in a small LRU cache, so that repeated form openings do not repeatedly hit the Wayback API.
18. As a frontend maintainer, I want the Wayback status rendering in a separate component, so that the Bookmark form does not accumulate status presentation complexity.
19. As a frontend maintainer, I want the create and edit views to own when the one-time check starts, so that the Bookmark form stays reusable across create and edit flows.
20. As a maintainer, I want no database schema change for this feature, so that archival status remains transient external metadata rather than durable Bookmark state.

## Implementation Decisions

- The feature checks Wayback availability for the Bookmark URL only.
- Related Links are not checked by this feature.
- Do not add new domain glossary terms for this feature; Wayback availability is integration state, not a new domain entity.
- The backend owns the Wayback API integration.
- The Wayback API request uses `https://archive.org/wayback/available?url=...`.
- The backend must not use the HTTP example endpoint from the Wayback documentation.
- The backend endpoint validates candidate URLs with the existing Bookmark URL rules.
- The frontend calls the backend through the existing Eden API client pattern.
- The backend response DTO is a discriminated union:

```ts
type WaybackAvailabilityDTO =
  | { available: false }
  | {
      available: true;
      archivedUrl: string;
      timestamp: string;
    };
```

- `available: true` requires both `archivedUrl` and `timestamp`.
- `available: false` omits `archivedUrl` and `timestamp`.
- Wayback responses with `archived_snapshots.closest.available === true` produce `available: true`.
- Wayback responses with empty `archived_snapshots` produce `available: false`.
- Wayback `429`, non-OK HTTP responses, network failures, and malformed payloads produce Result errors.
- Wayback failures are not retried.
- Wayback failures are displayed as non-blocking text under the URL field.
- Successful availability results are cached in memory with `quick-lru`.
- The cache uses `maxSize: 64`.
- The cache uses `maxAge: 24 hours`.
- The cache key is the validated normalized Bookmark URL value.
- Cache failures or misses must not change the public API shape.
- The cache stores successful `available: true` and `available: false` results.
- The cache does not store operational errors.
- Bookmark creation with no initial URL does not run Wayback availability.
- Bookmark creation with an initial URL from route query parameters runs the check once when the final create form is shown.
- If the create flow first asks the user to choose between original and cleaned URLs, Wayback availability checks the chosen Bookmark URL only after that choice reaches the create form.
- Bookmark editing runs the check once after the existing Bookmark is loaded and the form is shown.
- User edits to the URL after the initial check target hide the Wayback status.
- The Wayback status does not block Create or Save.
- Add a separate frontend component for Wayback status rendering.
- The Bookmark form may receive a Wayback status view model or render slot, but the status presentation must not be embedded inline in the form template.
- The not-archived call to action links to `https://web.archive.org/web/`.
- The archived call to action links to the `archivedUrl` returned by the backend.
- User-facing UI text is English.
- No database schema changes are required.
- No deployment or dev server run is part of this work.

The backend Wayback integration should be a deep module with a small interface: given a validated Bookmark URL, return a Result containing the discriminated availability DTO. The module should encapsulate fetch behavior, response parsing, error mapping, and LRU caching.

## Testing Decisions

- Tests should assert external behavior and contracts rather than private implementation details.
- Backend tests should cover parsing an available Wayback response.
- Backend tests should cover parsing an unavailable Wayback response with empty `archived_snapshots`.
- Backend tests should cover malformed Wayback payloads returning Result errors.
- Backend tests should cover Wayback `429` returning a Result error without retry.
- Backend tests should cover network or fetch failures returning a Result error without retry.
- Backend tests should cover the LRU cache preventing duplicate Wayback calls for the same normalized Bookmark URL.
- Backend route tests should cover invalid Bookmark URL validation through the endpoint.
- Backend route tests should cover the successful `available: true` response shape.
- Backend route tests should cover the successful `available: false` response shape.
- Frontend API tests should cover parsing the discriminated availability DTO.
- Frontend API tests should cover mapping backend errors to a non-blocking UI-facing error.
- Frontend state tests should cover edit form one-time check behavior.
- Frontend state tests should cover create form with initial URL one-time check behavior.
- Frontend state tests should cover empty create form avoiding the check.
- Frontend state tests should cover hiding Wayback status after the user edits the URL.
- Frontend component tests should cover archived, not-archived, checking, and error rendering if the project has suitable Vue component test prior art; otherwise keep coverage at helper/API/view-state boundaries.
- Existing backend API smoke tests are useful prior art for route-level Result behavior.
- Existing frontend API adapter tests are useful prior art for Eden response parsing.
- Existing create Bookmark flow tests are useful prior art for create-form state transitions.
- After implementation, run `bun run typecheck`.
- After implementation, run `bun run agent:test`.
- After implementation, run `bun run format`.

## Out of Scope

- Automatically saving pages to Wayback.
- Calling `https://web.archive.org/save/...`.
- Checking Related Links.
- Persisting archival status in the database.
- Periodically refreshing Wayback status.
- Retrying Wayback failures.
- Background jobs or scheduled refreshes.
- User-configurable cache size or TTL.
- Adding a browser extension.
- Changing Bookmark URL validation rules.
- Changing Bookmark uniqueness rules.
- Blocking Bookmark create or edit when Wayback is unavailable.
- Running a dev server.
- Deploying the app.
- Creating a git commit.

## Further Notes

The Wayback documentation describes the Availability API and notes that the documentation changes frequently. The implementation must use HTTPS even though the documentation examples show HTTP in places.

Commit message: `feat(bookmarks): add Wayback availability checks for bookmark URLs`
