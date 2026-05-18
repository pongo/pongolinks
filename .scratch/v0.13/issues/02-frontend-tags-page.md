# Frontend Tags page

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.13 Implementation Plan](../plan.md)

## What to build

Add a dedicated `/tags` route and Tags management view in the frontend Tags slice.

The page should let the user filter Tags locally, navigate to Bookmark list Tag filters, edit a Tag with one field, delete a Tag after browser confirmation, and reveal Bookmarks without Tags.

## Acceptance criteria

- [ ] Add `/tags` route rendering `apps/frontend/src/features/tags/views/TagsView.vue`.
- [ ] Add a `Tags` footer link beside `Tools` on the Bookmark list.
- [ ] Keep `New bookmark` as the top primary action.
- [ ] Tags page includes a `Back to bookmarks` link.
- [ ] Page loads `GET /api/tags` on open.
- [ ] Page loads `GET /api/tags/untagged-bookmarks` on open.
- [ ] Tag list preserves backend order.
- [ ] Filter input performs client-only case-insensitive `nameLower.includes`.
- [ ] Filtered-empty and empty states use English UI text.
- [ ] Each Tag row shows `usageCount`.
- [ ] Each Tag row renders `tag.name` as a link to `${APP_BASE_PATH}/t/${encodeURIComponent(tag.nameLower)}`.
- [ ] Tag rows do not visually reuse Bookmark list Tag chip styling.
- [ ] Edit and delete lucide icon buttons appear on row hover and keyboard focus.
- [ ] Delete uses the browser confirmation dialog before calling the API.
- [ ] Edit opens an in-page dialog with one text field.
- [ ] Saving edit sends only `{ name }` to `PATCH /api/tags/:id`.
- [ ] Successful edit/delete refetches Tags.
- [ ] Successful edit/delete refetches untagged Bookmarks if the untagged block is visible.
- [ ] Untagged block initially shows count and a `Show` button, not the list.
- [ ] Pressing `Show` reveals loaded Bookmark titles on the same page.
- [ ] Untagged Bookmark titles link to `/bookmarks/:id/edit`.
- [ ] If `totalCount > bookmarks.length`, UI shows that only the first 100 are shown.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

[Backend Tag management API](./01-backend-tag-management-api.md) for mutation and untagged endpoints.
