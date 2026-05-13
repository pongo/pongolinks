# Add read-only Tags API

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Create a read-only `tags` backend feature slice that returns all existing Tags sorted by current **Tag Popularity**.

## Scope

- Add `apps/backend/src/features/tags/contracts.ts`.
- Add `TagSummaryDTO`:

  ```ts
  export type TagSummaryDTO = {
    id: number;
    name: string;
    nameLower: string;
    usageCount: number;
  };
  ```

- Add `apps/backend/src/features/tags/tags-repository.ts`.
- Count `usageCount` from current `bookmark_tags` attachments.
- Sort by `usageCount DESC`, then `nameLower ASC`.
- Add `apps/backend/src/features/tags/routes.ts`.
- Expose `GET /pongolinks/api/tags`.
- Return `{ ok: true, data: { tags } }`.
- Register `createTagRoutes({ db })` from `apps/backend/src/app.ts` next to bookmark routes.
- Keep Result-style operational error handling.
- Add request-scoped evlog context for returned Tag count without logging Tag names.

## Out Of Scope

- Tag create, edit, delete, rename, or merge endpoints.
- Query params, pagination, or server-side suggestion filtering.
- Moving Bookmark Tag parsing or synchronization out of the `bookmarks` slice.

## Tests

- `GET /api/tags` returns `id`, `name`, `nameLower`, and `usageCount`.
- Tags are sorted by `usageCount DESC`.
- Tags with equal `usageCount` are sorted by `nameLower ASC`.
- `usageCount` reflects current `bookmark_tags` attachments.
- Empty Tag table returns `tags: []`.

