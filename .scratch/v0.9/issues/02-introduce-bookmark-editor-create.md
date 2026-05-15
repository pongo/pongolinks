# Introduce BookmarkEditor for create flow

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.9 BookmarkEditor PRD](../PRD.md)

## What to build

Introduce `BookmarkEditor` as the backend Bookmark slice write boundary and route Bookmark creation through it. Creation should still accept validated editable Bookmark data from the route layer, preserve duplicate URL handling, attach Tags, insert Related Links, reload the final BookmarkDTO, and keep existing telemetry behavior.

The completed slice should make Bookmark creation read as part of the editing workflow rather than raw repository persistence, while preserving all current API behavior.

## Acceptance criteria

- [ ] A `BookmarkEditor` write boundary exists inside the backend Bookmark slice.
- [ ] Bookmark creation is exposed through `BookmarkEditor`.
- [ ] Routes keep HTTP request parsing, value-object construction, Result response formatting, and request logging setup.
- [ ] `BookmarkEditor` receives validated editable Bookmark data, including constructed `BookmarkUrl` and parsed `TagName` values.
- [ ] Duplicate Bookmark URL creation still returns the existing error code and status semantics.
- [ ] Create still attaches submitted Tags.
- [ ] Create still inserts Related Links extracted from the Bookmark description.
- [ ] Create still reloads and returns the final BookmarkDTO shape expected by the API.
- [ ] Write-path telemetry for create remains available without adding telemetry fields to the API response.
- [ ] `list` and `findById` are not moved into `BookmarkEditor`.
- [ ] The SQLite/Drizzle driver is unchanged.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- [01-add-bookmark-editor-characterization.md](./01-add-bookmark-editor-characterization.md)

