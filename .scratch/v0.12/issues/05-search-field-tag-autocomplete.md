# Search field tag autocomplete

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.12 Implementation Plan](../plan.md)

## What to build

Add Tag autocomplete to the Bookmark list search field for strict Tag filter tokens.

Reuse the existing Tag suggestion logic by extracting shared helper code, but keep `BookmarkTagInput` as the Bookmark form component because the search field uses mixed syntax.

## Acceptance criteria

- [ ] Extract shared Tag token/suggestion helper code without changing existing `BookmarkTagInput` behavior.
- [ ] The search field opens Tag suggestions when the current token starts with `#`.
- [ ] The search field opens Tag suggestions when the current token starts with `-#`.
- [ ] `#sq` suggestions insert an include token such as `#sqlite `.
- [ ] `-#ol` suggestions insert an exclude token such as `-#old `.
- [ ] Plain text tokens do not open Tag suggestions.
- [ ] Domain autocomplete is not implemented in v0.12.
- [ ] Existing Bookmark form Tag autocomplete tests still pass.
- [ ] New frontend coverage verifies search-field include and exclude Tag autocomplete behavior.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

[Frontend bookmark list query state](./02-frontend-bookmark-list-query-state.md)
