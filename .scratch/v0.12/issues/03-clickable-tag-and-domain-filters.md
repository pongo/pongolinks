# Clickable tag and domain filters

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.12 Implementation Plan](../plan.md)

## What to build

Make the displayed Bookmark URL host and attached Tags in `BookmarkList.vue` interactive so a user can quickly refine the Bookmark list.

The interactions should update the canonical `/` route query state.

## Acceptance criteria

- [ ] The displayed Bookmark URL host is rendered as an interactive control or link.
- [ ] Each displayed Tag is rendered as an interactive control or link.
- [ ] Clicking a Tag adds that include Tag filter while preserving current `q`, `domain`, and other Tag filters.
- [ ] Clicking an already active included Tag removes that include Tag filter.
- [ ] Clicking a Tag clears any active `url` lookup mode.
- [ ] Clicking a Tag resets `page`.
- [ ] Clicking a Domain sets that exact Domain filter.
- [ ] Clicking the active Domain removes the Domain filter.
- [ ] Clicking a Domain preserves current `q` and Tag filters.
- [ ] Clicking a Domain clears any active `url` lookup mode.
- [ ] Clicking a Domain resets `page`.
- [ ] Only one Domain filter is supported.
- [ ] Active Tag and Domain states are visually distinguishable if the existing UI tokens make that practical.
- [ ] Frontend coverage verifies Tag add/remove, Domain set/remove, preservation of compatible state, URL-mode clearing, and page reset.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

[Frontend bookmark list query state](./02-frontend-bookmark-list-query-state.md)
