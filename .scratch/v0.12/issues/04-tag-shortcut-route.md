# Tag shortcut route

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.12 Implementation Plan](../plan.md)

## What to build

Add a frontend-only `/t/` shortcut route for fast manual entry of strict Tag filters. The route should normalize to the canonical `/` Bookmark list route with repeated `tag` query parameters.

## Acceptance criteria

- [ ] Add a frontend route that accepts `/t/:tags(.*)`.
- [ ] `/t/sqlite vue -old` is accepted after URL decoding.
- [ ] `/t/sqlite+vue+-old` is accepted.
- [ ] `/t/sqlite/vue/-old` is accepted.
- [ ] Shortcut input is split on whitespace, `+`, and `/`.
- [ ] Empty tokens are ignored.
- [ ] `-tag` becomes an exclude Tag filter.
- [ ] Non-prefixed tokens become include Tag filters.
- [ ] Empty shortcut input redirects or replaces to `/`.
- [ ] Non-empty shortcut input uses `router.replace` to `/?tag=...`.
- [ ] The shortcut does not introduce a backend route.
- [ ] Frontend coverage verifies whitespace, plus, slash, exclude Tag, empty input, and replace target behavior.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

[Frontend bookmark list query state](./02-frontend-bookmark-list-query-state.md)
