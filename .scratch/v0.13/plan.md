# Add Tag Management

## Context

pongolinks is a personal Bookmark library for saving, organizing, and rediscovering links. v0.13 adds a dedicated Tag management page for reviewing popular Tags, renaming Tags, replacing Tags, deleting Tags, and finding Bookmarks that currently have no Tags.

Relevant existing behavior:

- `GET /pongolinks/api/tags` already returns Tags sorted by **Tag Popularity**.
- A **Tag** is a reusable whitespace-free token attached to Bookmarks.
- **Tag Popularity** is stored as `tags.usage_count` and maintained by database triggers on `bookmark_tags`.
- A Tag with no attached Bookmarks is removed.
- The frontend already has `/t/:tags(.*)` as a shortcut route that normalizes to Bookmark list Tag filters.
- Bookmark edit routes already live under `/bookmarks/:id/edit`.

## Problem

Tags are currently created and attached only through Bookmark forms. The user can reuse Tags through autocomplete and filter Bookmarks by Tags, but cannot manage the Tag vocabulary directly.

The v0.13 screen should solve Tag maintenance without making Tags look or behave like the compact Tag chips on the Bookmark list. This is a management page, not another Bookmark list filter UI.

## Direction

Add a dedicated frontend route:

```text
/tags
```

Keep `/t/...` as the existing frontend shortcut for strict Bookmark Tag filters. Do not repurpose `/t` for Tag management.

Add a `Tags` link to the lower navigation area next to `Tools` on the Bookmark list. Keep `New bookmark` as the primary top action because it belongs to the main Bookmark workflow. The Tag management page itself should provide a `Back to bookmarks` link, matching the Tools page pattern.

The page remains a separate Tags vertical slice. Do not build it inside the Tools feature.

## Tag List Page

When `/tags` opens:

1. Load `GET /pongolinks/api/tags`.
2. Load `GET /pongolinks/api/tags/untagged-bookmarks`.
3. Render Tags in backend order: `usageCount DESC`, then `nameLower ASC`.
4. Render a client-only filter text field above the Tag list.
5. Filter Tags with simple case-insensitive `includes` against `nameLower`.

Each Tag row should show:

- Bookmark count using `usageCount`.
- Tag display `name` as a link to:

  ```ts
  `${APP_BASE_PATH}/t/${encodeURIComponent(tag.nameLower)}`
  ```

- Edit and delete icon buttons from lucide, visible on hover/focus.

The Tag management list should not visually reuse Bookmark list Tag chips. Use a quiet row/list layout with count and actions instead of compact chips.

## Tag Edit

Use one edit dialog with one text field. Do not expose separate modes to the user.

Backend operation:

```http
PATCH /pongolinks/api/tags/:id
Content-Type: application/json

{ "name": "NewName" }
```

Rules:

- Validate `id` as a positive integer.
- Validate `name` with the Tag name invariant: non-empty and no whitespace.
- Find the source Tag or return `tag.not_found`.
- Compute `newNameLower` with `toLocaleLowerCase("und")`.
- If `newNameLower === source.nameLower`, update only `tags.name`.
- If `newNameLower !== source.nameLower`, replace the source Tag with the requested Tag.

Replace semantics:

- If the replacement Tag does not exist, update the source Tag row to the new `name` and `nameLower`.
- If the replacement Tag already exists:
  - transfer source Tag Bookmark attachments to the replacement Tag;
  - avoid duplicate `(bookmark_id, tag_id)` rows;
  - delete source Tag attachments;
  - delete the source Tag.
- The operation must be idempotent for Bookmarks that already have both Tags.
- Run replacement in a database transaction.

Example:

If Bookmark A has `tag1`, Bookmark B has `tag2`, and Bookmark C has both `tag1` and `tag2`, changing `tag1` to `tag2` should leave A, B, and C with exactly one `tag2` attachment each, then remove `tag1`.

## Tag Delete

Add:

```http
DELETE /pongolinks/api/tags/:id
```

Rules:

- Validate `id` as a positive integer.
- Find the Tag or return `tag.not_found`.
- Delete the Tag row.
- Rely on `bookmark_tags.tag_id ON DELETE CASCADE` to detach the Tag from Bookmarks.
- Do not delete Bookmarks.
- The frontend uses the browser confirmation dialog before calling the endpoint.

After successful edit or delete, the frontend should refetch `GET /api/tags`. Do not implement optimistic UI in v0.13.

If the untagged Bookmarks block has already been shown, refetch `GET /api/tags/untagged-bookmarks` after successful edit or delete because replacing or deleting Tags can change which Bookmarks have no Tags.

## Bookmarks Without Tags

Add:

```http
GET /pongolinks/api/tags/untagged-bookmarks
```

Response:

```ts
{
  totalCount: number;
  bookmarks: Array<{
    id: number;
    title: string;
  }>;
}
```

Rules:

- Return Bookmarks with no current Tag attachments.
- Sort by `updatedAt DESC`, then `id DESC`.
- Return at most 100 Bookmarks.
- `totalCount` is the full untagged Bookmark count.

The Tags page loads this endpoint when the page opens. Initially, show only the count and a `Show` button. Pressing `Show` reveals the already loaded Bookmark titles on the same page.

Each untagged Bookmark title links to:

```text
/bookmarks/:id/edit
```

If `totalCount > bookmarks.length`, show concise English text such as:

```text
Showing 100 of 137 untagged bookmarks.
```

## Error Handling

Extend the shared API error code union with Tag-specific codes:

- `tag.name_invalid`
- `tag.not_found`
- `tag.conflict`
- `tag.unexpected`

Use Result-based operational error handling. Do not throw for validation, not-found, duplicate, or persistence failures.

`tag.name_invalid` covers empty or whitespace-containing Tag names.

`tag.not_found` covers edit/delete source Tag not found.

`tag.conflict` remains available for non-recoverable Tag conflicts if implementation discovers a state that cannot be merged safely. The expected replace path should merge existing replacement Tags instead of returning conflict.

`tag.unexpected` covers unexpected persistence failures.

## Backend Scope

Add behavior inside the existing `apps/backend/src/features/tags/` slice:

```text
apps/backend/src/features/tags/
  contracts.ts
  routes.ts
  tag-name.ts
  tags-repository.ts
```

Expected work:

1. Add Tag-specific validation for a single submitted Tag name.
2. Add route param and body validation for Tag edit/delete.
3. Add `PATCH /tags/:id`.
4. Add `DELETE /tags/:id`.
5. Add `GET /tags/untagged-bookmarks`.
6. Keep `GET /tags` sorted by **Tag Popularity**.
7. Use transactions for replace/merge behavior.
8. Add route logging counts and ids without logging large Bookmark lists.

Do not move Bookmark form Tag parsing or Bookmark Tag synchronization out of the Bookmarks slice in v0.13 unless a tiny shared helper is clearly needed for the Tag name invariant.

## Frontend Scope

Add behavior inside `apps/frontend/src/features/tags/`:

```text
apps/frontend/src/features/tags/
  api.ts
  types.ts
  views/TagsView.vue
```

Expected work:

1. Add frontend API calls for list, update, delete, and untagged Bookmarks.
2. Add `/tags` to the router.
3. Add a `Tags` footer link beside `Tools` on the Bookmark list.
4. Render loading, error, empty, and filtered-empty states.
5. Add a client-side filter input using simple `includes`.
6. Render Tag rows with count, linked display name, and hover/focus edit/delete lucide icon buttons.
7. Use the browser confirmation dialog for delete.
8. Implement an in-page edit dialog with one text field.
9. Refetch Tags after successful edit/delete.
10. Refetch untagged Bookmarks after successful edit/delete if the block is visible.

User-facing UI text must be English.

## Out Of Scope

- Creating new Tags without attaching them to a Bookmark.
- Tag colors, descriptions, aliases, hierarchy, or metadata.
- Pagination for the Tag list.
- Pagination UI for untagged Bookmarks.
- Optimistic UI.
- Toast system.
- Undo for delete/replace.
- Moving `/t/...` away from Bookmark filter shortcuts.
- Dev server startup.
- Deploy.
- Git commit by the agent.

## Tests

### Backend

Add API/smoke coverage for:

1. `PATCH /api/tags/:id` updates display `name` only when `nameLower` is unchanged.
2. `PATCH /api/tags/:id` rejects empty or whitespace-containing names with `tag.name_invalid`.
3. `PATCH /api/tags/:id` returns `tag.not_found` for a missing source Tag.
4. `PATCH /api/tags/:id` replaces a Tag by updating the source row when the replacement does not exist.
5. `PATCH /api/tags/:id` merges into an existing replacement Tag without duplicate attachments.
6. Replacement removes the source Tag and preserves Bookmarks.
7. `DELETE /api/tags/:id` deletes the Tag and detaches it from Bookmarks without deleting Bookmarks.
8. `DELETE /api/tags/:id` returns `tag.not_found` for a missing Tag.
9. `GET /api/tags/untagged-bookmarks` returns `totalCount`, at most 100 Bookmarks, and `updatedAt DESC, id DESC` order.
10. Tag `usageCount` stays correct after update, replace, and delete operations.

### Frontend

Add focused tests for local helpers if extracted:

1. Client-side Tag filtering uses case-insensitive `nameLower.includes`.
2. Untagged count display text handles `0`, under-limit, and over-limit cases.
3. Tag edit payload sends a single `name` field.

Do not introduce a heavy Vue component test stack only for v0.13 if the current project does not already use one.

## Verification

Use the project root commands:

1. `bun run typecheck`
2. `bun run agent:test`
3. `bun run format`

feat: add tag management page
