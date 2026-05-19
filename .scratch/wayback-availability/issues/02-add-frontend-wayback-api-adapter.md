Status: ready-for-agent

# Add frontend Wayback API adapter

## Parent

.scratch/wayback-availability/PRD.md

## What to build

Add a frontend API adapter for the backend Wayback availability endpoint using the existing Eden client and Result parsing patterns. The adapter should expose a UI-facing Result for checking a Bookmark URL and should parse the backend discriminated union without weakening its invariants.

This slice does not render Wayback status in the Bookmark form yet. It only makes the endpoint consumable from frontend feature code and tests the contract boundary.

## Acceptance criteria

- [ ] The frontend has a typed helper for checking Wayback availability for a Bookmark URL.
- [ ] The helper calls the backend through the existing Eden API client pattern.
- [ ] The helper returns the discriminated availability result unchanged for successful responses.
- [ ] The helper preserves the invariant that `archivedUrl` and `timestamp` exist only when `available: true`.
- [ ] Backend Result errors are mapped to a non-blocking UI-facing API error.
- [ ] Network or transport failures return the existing fallback error style.
- [ ] Tests cover parsing `available: true`.
- [ ] Tests cover parsing `available: false`.
- [ ] Tests cover backend error parsing.
- [ ] Tests cover transport failure fallback behavior.

## Blocked by

- .scratch/wayback-availability/issues/01-add-backend-wayback-availability-endpoint.md

Commit message: `feat(bookmarks): add frontend Wayback availability adapter`
