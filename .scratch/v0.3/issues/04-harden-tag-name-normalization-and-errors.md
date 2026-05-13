# Harden Tag name normalization and errors

Status: ready-for-agent

## Parent

[pongolinks v0.3 Implementation Plan](../IMPLEMENTATION_PLAN.md)

## What to build

Finish the Tag domain rules for v0.3 by making Tag name validation explicit, preserving existing display casing when Tags are reused, and mapping invalid Tag input to the existing API error envelope style. This slice should keep operational errors Result-based and add useful request-scoped logging context without introducing noisy per-Tag logs.

## Acceptance criteria

- [ ] A backend-local `TagName` Value Object accepts non-empty whitespace-free names.
- [ ] `TagName` computes `nameLower` with `name.toLocaleLowerCase("und")`.
- [ ] `TagName` accepts examples such as `article`, `lang-ru`, and `структуры-данных`.
- [ ] `TagName` rejects empty and whitespace-containing names.
- [ ] Invalid Tag input returns `bookmark.tags_invalid` with HTTP `400`.
- [ ] The frontend maps `bookmark.tags_invalid` to a form-level error.
- [ ] Reusing an existing Tag by `nameLower` preserves that Tag's existing display `name`.
- [ ] If inserting a Tag hits the `nameLower` unique constraint, the repository looks it up again and reuses it.
- [ ] Bookmark request logging records Tag count and validation outcome without per-Tag log spam.
- [ ] `bun run typecheck`, `bun run agent:test`, and `bun run format` pass.

## Blocked by

- [02-create-bookmark-with-tags.md](./02-create-bookmark-with-tags.md)
- [03-edit-bookmark-tags-with-replace-all.md](./03-edit-bookmark-tags-with-replace-all.md)
