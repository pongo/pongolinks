# Add Bookmark Form Initial Values and Focus Control

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.11 Bookmarklet Support PRD](../PRD.md)

## What to build

Extend the Bookmark create form foundation so manual creation and Bookmarklet-assisted creation can share one form. The form should support initial create values and an explicit initial focus target while preserving existing edit behavior and existing manual create navigation.

This slice should make the form ready for later Bookmarklet flow states, but it does not need to add URL cleanup, URL checking, or the Tools page.

## Acceptance criteria

- [ ] The Bookmark form can receive initial create values for URL, title, description, privacy, and Tags text.
- [ ] Existing edit behavior still populates the form from the existing Bookmark.
- [ ] Passing both an existing Bookmark and initial create values is treated as a programmer error.
- [ ] Manual create continues to start from an empty form.
- [ ] Manual create focuses the URL field through an explicit focus call.
- [ ] Prefilled create can focus the Tags field through an explicit focus call.
- [ ] Invalid or non-HTTP(S) prefilled URLs can remain visible in the URL field for user correction.
- [ ] The form does not use HTML `autofocus`.
- [ ] Manual create still navigates to the Bookmark list after successful save.
- [ ] Existing create and edit behavior remains compatible with current form error handling.
- [ ] Tests cover initial values, edit values, programmer-error input, and initial focus target behavior at the component or helper boundary.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.

Commit message:
feat: support bookmark form initial focus
