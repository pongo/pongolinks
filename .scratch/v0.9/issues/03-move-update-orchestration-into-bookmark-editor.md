# Move update orchestration into BookmarkEditor

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.9 BookmarkEditor PRD](../PRD.md)

## What to build

Move Bookmark update orchestration behind the same `BookmarkEditor` write boundary. Updating editable Bookmark state should keep duplicate URL handling, missing Bookmark handling, Tag synchronization, Related Link synchronization, orphan Tag cleanup, telemetry counts, and post-write BookmarkDTO reload behind the editing interface.

The completed slice should let routes call one write boundary for Bookmark update without knowing the persistence choreography.

## Acceptance criteria

- [ ] Bookmark update is exposed through `BookmarkEditor`.
- [ ] Routes call `BookmarkEditor` for update while keeping request parsing and value-object construction at the application edge.
- [ ] Updating a missing Bookmark still returns the existing not-found error semantics.
- [ ] Updating to another Bookmark's URL still returns the existing duplicate URL error semantics.
- [ ] Tags attached to the Bookmark are synchronized from submitted Tag text.
- [ ] Retained Tags keep their existing attachment rows where current behavior preserves them.
- [ ] Removed Tags are detached from the edited Bookmark.
- [ ] Tags with no attached Bookmarks are removed.
- [ ] Shared Tags remain when still attached to another Bookmark.
- [ ] Related Links are synchronized from the Bookmark description.
- [ ] Retained Related Link rows remain when their URL is still present.
- [ ] Removed Related Links are deleted and new Related Links are inserted.
- [ ] Update still reloads and returns the final BookmarkDTO shape expected by the API.
- [ ] Write-path telemetry for update remains available without adding telemetry fields to the API response.
- [ ] API response shapes, error codes, and HTTP status behavior are unchanged.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- [02-introduce-bookmark-editor-create.md](./02-introduce-bookmark-editor-create.md)

