# Add bookmarks placeholder and follow-up slices

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Reserve the `bookmarks` feature area without implementing CRUD. The v0.1 skeleton should make the future vertical slice location obvious for both backend and frontend agents, while keeping product behavior limited to the health shell. Document the first follow-up bookmark slices after v0.1.

## Acceptance criteria

- [ ] Backend has a documented `bookmarks` feature placeholder with no routes registered.
- [ ] Frontend has a documented `bookmarks` feature placeholder with no bookmark UI routes registered.
- [ ] Placeholder documentation explains that full bookmark CRUD is out of scope for v0.1.
- [ ] Follow-up slices are documented for creating bookmarks, listing bookmarks by `updated_at DESC`, viewing bookmark details, editing bookmark metadata, and adding FTS-backed search.
- [ ] No bookmark behavior is exposed in the v0.1 UI or API.

## Blocked by

- .scratch/v0.1/issues/01-bootstrap-monorepo-tooling.md
