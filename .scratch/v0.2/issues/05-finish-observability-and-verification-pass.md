# Finish observability and verification pass

Status: ready-for-agent

## Parent

.scratch/v0.2/IMPLEMENTATION_PLAN.md

## What to build

Polish the v0.2 Bookmark workflow so the architecture decisions are consistently applied and the final verification commands pass. This should close gaps left by the implementation slices: evlog startup wiring, route include/exclude behavior, frontend API adapter error parsing where cheap, and repo-wide type/test/format cleanup.

Do not start a dev server, deploy, or commit changes.

for evlog see: @docs/vendor/evlog/elysia.md @docs/vendor/evlog/wide-events.md

## Acceptance criteria

- [ ] Backend startup explicitly initializes evlog observability without making app imports perform logger initialization.
- [ ] Bookmark API routes use evlog wide events consistently with ADR-0003.
- [ ] Health logging noise is excluded from the bookmark-focused v0.2 logging setup.
- [ ] No Axiom drain integration is added.
- [ ] No background `log.fork` behavior is added.
- [ ] Frontend API adapter tests cover success envelope parsing where cheap in the current setup.
- [ ] Frontend API adapter tests cover field/form error envelope parsing where cheap in the current setup.
- [ ] No heavy Vue component testing stack is introduced.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.
- [ ] `bun run format` has been run.
- [ ] The implementation keeps Tags, Related Links, search, filtering, pagination, delete, metadata fetching, local drafts, optimistic UI, toasts, and global frontend 404 behavior out of scope.

## Blocked by

- .scratch/v0.2/issues/02-create-bookmark-through-api.md
- .scratch/v0.2/issues/03-list-bookmarks-through-api-and-frontend-home.md
- .scratch/v0.2/issues/04-edit-bookmark-through-api-and-form-route.md
