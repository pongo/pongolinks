# Clarify read/write boundary after extraction

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.9 BookmarkEditor PRD](../PRD.md)

## What to build

Clean up the extracted Bookmark editing boundary so the backend slice clearly separates write orchestration from read-side repository behavior. This slice should make the final v0.9 shape easy for a future maintainer to navigate without expanding scope into database driver changes, API changes, schema changes, or a top-level Tag synchronization module.

## Acceptance criteria

- [ ] Naming and imports consistently present `BookmarkEditor` as the create/update write boundary.
- [ ] `list` remains outside `BookmarkEditor`.
- [ ] `findById` remains outside `BookmarkEditor`.
- [ ] Tag synchronization is either still private to the editing implementation or extracted only as a private collaborator inside the Bookmark backend slice.
- [ ] Tag synchronization is not made a top-level or cross-feature module.
- [ ] Row-to-DTO mapping remains private to persistence/editing internals unless another real adapter already exists.
- [ ] HTTP request parsing and value-object construction remain outside `BookmarkEditor`.
- [ ] No frontend behavior is changed.
- [ ] No database schema changes are introduced.
- [ ] No SQLite/Drizzle driver changes are introduced.
- [ ] API response shapes, error codes, and HTTP statuses are unchanged.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.
- [ ] `bun run format` passes.

## Blocked by

- [03-move-update-orchestration-into-bookmark-editor.md](./03-move-update-orchestration-into-bookmark-editor.md)

