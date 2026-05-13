# Edit Bookmark through API and form route

Status: ready-for-agent

## Parent

.scratch/v0.2/IMPLEMENTATION_PLAN.md

## What to build

Add the full create/edit form flow for basic **Bookmark** fields. Create and edit should be normal routes that can be opened in a new tab, share one form component, submit complete editable payloads, show field/form errors, and return the user to the list after a successful save.

The edit path should load a single Bookmark for the form, validate the route id with `BookmarkId`, and update editable fields while relying on Drizzle `$onUpdate` for `updatedAt`.

## Acceptance criteria

- [ ] `/bookmarks/new` renders a create form route.
- [ ] `/bookmarks/:id/edit` renders an edit form route.
- [ ] Create and edit routes use a shared Bookmark form component.
- [ ] Form screens include a `Back to bookmarks` link.
- [ ] The form uses normal submit behavior and disables saving while a request is in flight.
- [ ] The form includes `url`, `title`, `description`, and `Private bookmark` fields.
- [ ] Field errors are shown for URL and title validation failures.
- [ ] Form-level errors are shown for not found and unexpected backend failures.
- [ ] Successful create and edit redirect back to `/`.
- [ ] `GET /pongolinks/api/bookmarks/:id` returns one Bookmark for the edit form.
- [ ] Invalid ids return HTTP `400` with error code `bookmark.id_invalid`.
- [ ] Missing Bookmarks return HTTP `404` with error code `bookmark.not_found`.
- [ ] `PATCH /pongolinks/api/bookmarks/:id` accepts the complete editable payload.
- [ ] The update path validates route params through `BookmarkId` and URLs through `BookmarkUrl`.
- [ ] Duplicate URL update returns HTTP `409` with error code `bookmark.url_duplicate`.
- [ ] The update path relies on Drizzle `$onUpdate` for `updatedAt`.
- [ ] Get and update routes add wide event context for operation, Bookmark id, validation outcome, not-found outcome, duplicate outcome, and updated Bookmark id.
- [ ] Backend tests cover missing id/not found behavior, successful update, duplicate URL update, and `updatedAt` changing through Drizzle `$onUpdate`.

## Blocked by

- .scratch/v0.2/issues/01-add-bookmark-backend-foundation.md
- .scratch/v0.2/issues/02-create-bookmark-through-api.md
- .scratch/v0.2/issues/03-list-bookmarks-through-api-and-frontend-home.md
