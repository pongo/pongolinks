# List Bookmarks through API and frontend home

Status: ready-for-agent

## Parent

.scratch/v0.2/IMPLEMENTATION_PLAN.md

## What to build

Make the home route a real **Bookmark** list. The backend should return all Bookmarks ordered by most recently updated, and the frontend should show a compact working list with create/edit navigation. This slice also introduces Tailwind CSS 4 for the first real frontend surface.

Follow the v0.2 UI notes: the interface should be quiet, compact, English-language, and not a marketing page.

## Acceptance criteria

- [ ] Tailwind CSS 4 is added to the frontend.
- [ ] `@tailwindcss/vite` is installed and used in the Vite config.
- [ ] A global frontend stylesheet imports Tailwind and is loaded by the Vue app.
- [ ] `GET /pongolinks/api/bookmarks` returns an API success envelope with `{ bookmarks: BookmarkDTO[] }`.
- [ ] Bookmarks are ordered by `updatedAt DESC`.
- [ ] The list route adds wide event context for the list operation.
- [ ] The frontend `/` route renders the Bookmark list instead of the v0.1 health shell.
- [ ] Each list row shows title as the primary external link, URL, optional description, updated timestamp, and an edit action.
- [ ] Private Bookmarks show a small `Private` marker; public Bookmarks do not show a public marker.
- [ ] The list has a real route link to `/bookmarks/new` that can be opened in a new tab.
- [ ] The empty state includes a create action.
- [ ] The updated timestamp is formatted with `Intl.DateTimeFormat` in the browser locale.
- [ ] Backend tests cover `GET /api/bookmarks` ordering by `updatedAt DESC`.

## Blocked by

- .scratch/v0.2/issues/01-add-bookmark-backend-foundation.md
