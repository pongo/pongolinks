Status: ready-for-agent

# Run one-time Wayback checks in Bookmark forms

## Parent

.scratch/wayback-availability/PRD.md

## What to build

Wire Wayback availability into the create and edit Bookmark flows with strict one-time behavior. Edit forms check once after the existing Bookmark is loaded and the form is shown. Create forms check once only when creation starts with an initial URL from route query parameters and the final create form is shown.

Manual empty creation must not call Wayback. If the user edits the URL after the initial check target was established, the status must disappear entirely rather than showing stale availability for the old URL.

## Acceptance criteria

- [ ] Editing an existing Bookmark starts one Wayback check after the Bookmark is loaded and the form is shown.
- [ ] Creating a Bookmark with an initial URL from route query parameters starts one Wayback check when the final create form is shown.
- [ ] If the create flow asks the user to choose between original and cleaned URLs, only the chosen final Bookmark URL is checked.
- [ ] Empty manual Bookmark creation does not call the Wayback availability API.
- [ ] The same form lifecycle does not repeatedly call Wayback for the same initial URL.
- [ ] Editing the URL after the initial check target was established hides the Wayback status entirely.
- [ ] Wayback success, unavailable, and error results are all non-blocking for Create and Save actions.
- [ ] Existing create and edit form behavior remains unchanged when no Wayback check runs.
- [ ] Tests cover edit one-time check behavior.
- [ ] Tests cover create-with-initial-URL one-time check behavior.
- [ ] Tests cover empty create avoiding the check.
- [ ] Tests cover hiding status after URL edit.

## Blocked by

- .scratch/wayback-availability/issues/03-render-bookmark-url-wayback-status.md

Commit message: `feat(bookmarks): run one-time Wayback checks in forms`
