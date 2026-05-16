# Connect Bookmarklet Create Flow to URL Check Results

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.11 Bookmarklet Support PRD](../PRD.md)

## What to build

Connect the chosen Bookmarklet URL to the backend URL check API and complete the frontend decision flow. The create route should automatically edit exact existing Bookmarks, warn about alternate-protocol Bookmarks, list Related Link matches, allow create-anyway choices where appropriate, and close the Bookmarklet tab after successful creation when the browser permits it.

This slice completes the end-to-end Bookmarklet-assisted create workflow.

## Acceptance criteria

- [ ] The Bookmarklet-assisted create flow calls the URL check API with the single chosen candidate URL.
- [ ] Exact Bookmark results automatically replace the route with the existing Bookmark edit route.
- [ ] Alternate-protocol Bookmark results show a warning with the existing Bookmark URL.
- [ ] Alternate-protocol Bookmark results provide a primary action to edit the existing Bookmark.
- [ ] Alternate-protocol Bookmark results provide a secondary action to create a separate Bookmark with the chosen URL.
- [ ] Related Link results show all containing Bookmarks.
- [ ] Related Link results show each containing Bookmark title as the primary label.
- [ ] Related Link results show each containing Bookmark URL as secondary context.
- [ ] Related Link results provide edit actions for each containing Bookmark.
- [ ] Related Link results provide a secondary action to create a new Bookmark anyway.
- [ ] Not-found results open the create form with URL and title prefilled.
- [ ] Backend URL check errors are shown through the existing form/error pattern.
- [ ] Successful Bookmarklet-assisted creation attempts to close the tab with `window.close()`.
- [ ] If the browser does not close the tab, the flow falls back to the Bookmark list.
- [ ] Manual Bookmark creation still navigates to the Bookmark list after successful save.
- [ ] Tests cover exact match redirect, alternate-protocol warning, alternate-protocol create-anyway, Related Link matches, Related Link create-anyway, not-found create form, URL check error display, successful close attempt, and close fallback.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.
- [ ] `bun run format` passes.

## Blocked by

- [Add Bookmark URL Check API](01-add-bookmark-url-check-api.md)
- [Add Bookmark Form Initial Values and Focus Control](02-add-bookmark-form-initial-values-and-focus-control.md)
- [Add Clean URL Choice Step](04-add-clean-url-choice-step.md)

Commit message:
feat: complete bookmarklet create flow
