# Log Tag edit diff context

Status: ready-for-agent

## Goal

Add request-scoped wide event context for Bookmark edit Tag synchronization.

## Context

ADR-0003 favors evlog wide events: one request event accumulates useful operation context instead of scattering routine progress across many logs. v0.5 should log the Tag diff for edit in the same style as Related Link sync, but with the exact agreed fields.

## Scope

- Update backend edit flow logging in `apps/backend/src/features/bookmarks/bookmarks-repository.ts` and/or `apps/backend/src/features/bookmarks/routes.ts`.
- For Bookmark edit, log exactly these Tag diff fields:
  - `tags.submittedCount`
  - `tags.attachedCount`
  - `tags.detachedCount`
  - `tags.retainedCount`
  - `tags.attachedNames`
  - `tags.detachedNames`
  - `tags.deletedOrphanNames`
- Use persisted Tag display names for `attachedNames`, `detachedNames`, and `deletedOrphanNames`.
- Do not log Tag IDs.
- Do not add `submittedNames` or `retainedNames`.
- Keep create logging small; v0.5 does not require create to log a full diff.

## Out Of Scope

- Changing the evlog middleware setup.
- Adding Axiom or another drain.
- Logging individual database statements.
- Changing Related Link log fields unless required to avoid regressions.

## Acceptance Criteria

- Bookmark edit logs submitted, attached, detached, and retained counts.
- Bookmark edit logs attached, detached, and deleted orphan names.
- Logged names reflect persisted Tag display names, not raw submitted casing.
- The route still logs operational errors through the existing error context shape.

## Suggested Tests

- Use the existing test logger shape or add a small fake logger to capture `log.set` calls.
- Assert edit Tag diff context contains the agreed keys.
- Assert an existing Tag `Article` submitted as `article` logs `Article` where it appears in name arrays.

