# Create Bookmark through API

Status: ready-for-agent

## Parent

.scratch/v0.2/IMPLEMENTATION_PLAN.md

## What to build

Add the first write path for **Bookmark** creation through the backend API. A client should be able to submit the full editable Bookmark payload, have it validated through the backend Bookmark primitives and validation helpers, persist it through Drizzle, and receive a `BookmarkDTO` response. Duplicate URLs should be treated as expected operational errors.

Follow ADR-0003 by adding useful request-scoped wide event context for the create operation without adding Axiom integration.

## Acceptance criteria

- [ ] `POST /pongolinks/api/bookmarks` is registered from the backend app composition layer.
- [ ] The endpoint accepts `url`, `title`, `description`, and `isPrivate`.
- [ ] URL validation uses `BookmarkUrl`.
- [ ] Title and description validation use `bookmark-validation.ts`.
- [ ] A successful create returns an API success envelope containing the created `BookmarkDTO`.
- [ ] Duplicate URL create returns HTTP `409` with error code `bookmark.url_duplicate`.
- [ ] Missing or invalid URL returns HTTP `400` with `bookmark.url_required` or `bookmark.url_invalid`.
- [ ] Missing title returns HTTP `400` with error code `bookmark.title_required`.
- [ ] The repository checks for an existing URL before insert and still maps a unique constraint failure to duplicate URL if it occurs.
- [ ] The create route adds wide event context for operation, valid URL, validation outcome, duplicate outcome, and created Bookmark id.
- [ ] Backend tests cover successful create and duplicate URL create.

## Blocked by

- .scratch/v0.2/issues/01-add-bookmark-backend-foundation.md
