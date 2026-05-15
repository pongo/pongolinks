Status: ready-for-agent

# Clean dependency ownership and documentation

## Parent

`.scratch/bookmark-description-links/PRD.md`

## What to build

Clean up dependency ownership and documentation after Bookmark description extraction and rendering move into shared. Backend and frontend should no longer have direct Autolinker dependencies, and backend documentation should point future maintainers to the shared Bookmark description module.

## Acceptance criteria

- [ ] `autolinker` remains a direct dependency of `@pongolinks/shared`.
- [ ] `@pongolinks/backend` no longer declares a direct `autolinker` dependency.
- [ ] `@pongolinks/frontend` no longer declares a direct `autolinker` dependency.
- [ ] The lockfile is updated consistently with package manifest changes.
- [ ] The backend Bookmark README describes Related Link extraction as owned by `@pongolinks/shared/bookmark-description`.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- `.scratch/bookmark-description-links/issues/02-move-rendering-into-shared-and-switch-app-callers.md`
