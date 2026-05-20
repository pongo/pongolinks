Status: ready-for-agent

# PRD: v0.11 Bookmarklet Support

## Problem Statement

Saving the current browser page as a Bookmark is still manual. A user must copy the page URL, open pongolinks, start a new Bookmark, paste the URL, and copy or type the page title.

This manual flow also makes it easy to save noisy URLs with marketing parameters and gives the user no early warning when the captured URL is already represented in the library as a Bookmark or Related Link.

## Solution

Add a Bookmarklet that the user can drag from a Tools page to their browser bookmarks bar. When triggered, the Bookmarklet opens pongolinks in a new tab on the Bookmark creation route with the current page URL and title prefilled.

Before showing the final create form, pongolinks helps the user choose whether to save the original URL or a cleaned URL, checks whether the chosen URL is already represented in the library, and routes the user to the right next action. Exact existing Bookmarks open for editing automatically. Alternate-protocol Bookmarks and Related Link matches are shown as warnings with clear choices to edit the existing Bookmark or create a separate Bookmark anyway.

## User Stories

1. As a pongolinks user, I want a Bookmarklet, so that I can start saving the current page without copying its URL manually.
2. As a pongolinks user, I want the Bookmarklet to be available from a Tools page, so that I can find setup utilities in one predictable place.
3. As a pongolinks user, I want the Bookmarklet link to be named `PL`, so that it stays compact in my browser bookmarks bar.
4. As a pongolinks user, I want to drag the Bookmarklet from the Tools page to my browser bookmarks bar, so that setup works like a normal bookmarklet.
5. As a pongolinks user, I want a link from the Bookmark list footer to Tools, so that I can discover the Bookmarklet from the main screen.
6. As a pongolinks user, I want the Bookmarklet to open a new tab, so that the page I am saving remains open.
7. As a pongolinks user, I want the Bookmarklet to capture the current page URL, so that the new Bookmark starts with the right target.
8. As a pongolinks user, I want the Bookmarklet to capture the current page title, so that the new Bookmark starts with a useful title.
9. As a pongolinks user, I want the Bookmarklet to target my current pongolinks instance, so that it works when the app is served under its configured base path.
10. As a pongolinks user, I want manual Bookmark creation to keep using the same create route, so that there is still one obvious place to create a Bookmark.
11. As a pongolinks user, I want marketing parameters to be detected before saving, so that I can avoid saving noisy URLs.
12. As a pongolinks user, I want to compare the original and cleaned URLs, so that I understand what would change.
13. As a pongolinks user, I want the changed URL parts to be highlighted, so that I can quickly see whether cleanup is safe.
14. As a pongolinks user, I want to choose the original URL by clicking it, so that I can keep the exact page URL when needed.
15. As a pongolinks user, I want to choose the cleaned URL by clicking it, so that I can save the simpler URL when cleanup looks correct.
16. As a pongolinks user, I want to skip the cleanup choice when the cleaned URL is identical, so that the normal save flow stays fast.
17. As a pongolinks user, I want the app to check for an exact existing Bookmark before creating a new one, so that I do not create duplicates.
18. As a pongolinks user, I want an exact existing Bookmark to open for editing automatically, so that I can update the existing Bookmark without an extra confirmation step.
19. As a pongolinks user, I want to be warned when the same URL exists with the other HTTP protocol, so that I do not accidentally create a near-duplicate Bookmark.
20. As a pongolinks user, I want the alternate-protocol warning to show the existing Bookmark URL, so that I can inspect what is already saved.
21. As a pongolinks user, I want to click an alternate-protocol match to edit the existing Bookmark, so that I can update it instead of creating another one.
22. As a pongolinks user, I want a secondary option to create a separate Bookmark despite an alternate-protocol match, so that I can intentionally keep `http` and `https` versions distinct.
23. As a pongolinks user, I want the app to check whether the URL appears as a Related Link, so that I can see whether this page is already connected to existing Bookmark context.
24. As a pongolinks user, I want Related Link matches to show the containing Bookmark titles, so that I can choose the relevant existing Bookmark.
25. As a pongolinks user, I want Related Link matches to show the containing Bookmark URLs as secondary context, so that similarly titled Bookmarks can be distinguished.
26. As a pongolinks user, I want to click a Related Link match to edit the containing Bookmark, so that I can update the context that already mentions this URL.
27. As a pongolinks user, I want all matching Related Link Bookmarks to be shown, so that I can choose correctly when the same URL appears in multiple descriptions.
28. As a pongolinks user, I want Related Link matches sorted by recently updated Bookmarks first, so that the most active context appears first.
29. As a pongolinks user, I want a secondary option to create a new Bookmark despite Related Link matches, so that I can promote a Related Link into its own Bookmark.
30. As a pongolinks user, I want the create form to open when no match is found, so that I can save the captured page.
31. As a pongolinks user, I want the create form URL field prefilled from the chosen URL, so that I do not need to paste it.
32. As a pongolinks user, I want the create form title field prefilled from the captured title when it is present, so that I can save faster.
33. As a pongolinks user, I want empty captured titles to remain empty, so that the app does not invent misleading Bookmark titles.
34. As a pongolinks user, I want the Tags field focused after a valid Bookmarklet capture, so that I can immediately organize the Bookmark.
35. As a pongolinks user, I want the URL field focused during manual create, so that the normal create flow remains ergonomic.
36. As a pongolinks user, I want the URL field focused when the captured URL is invalid, so that I can fix it before saving.
37. As a pongolinks user, I want invalid captured URLs to stay visible in the form, so that I can understand and correct what was captured.
38. As a pongolinks user, I want the Bookmarklet tab to close after a successful save when possible, so that the capture flow gets out of my way.
39. As a pongolinks user, I want the app to fall back to the Bookmark list if the browser refuses to close the tab, so that I am not left on a stale create screen.
40. As a pongolinks user, I want manual Bookmark creation to navigate back to the Bookmark list after saving, so that existing behavior is preserved.
41. As an API consumer, I want URL check results to be explicit, so that the frontend can render exact Bookmark, alternate-protocol Bookmark, Related Link, and not-found states reliably.
42. As an API consumer, I want URL check validation to use the same Bookmark URL rules as creation, so that invalid URL behavior is consistent.
43. As a backend maintainer, I want URL checking in a search slice, so that this lookup behavior can grow without bloating the Bookmark editing route.
44. As a frontend maintainer, I want URL cleanup to remain a frontend create-flow behavior, so that the backend does not silently normalize user-submitted Bookmark URLs.
45. As a frontend maintainer, I want the Bookmarklet create flow modeled with explicit states, so that the multi-step UX remains testable.
46. As a maintainer, I want no database schema change for this feature, so that v0.11 stays focused on capture, cleanup, and existing URL discovery.

## Implementation Decisions

- The canonical Bookmarklet entrypoint is the existing Bookmark creation route with `url` and `title` query parameters.
- Do not introduce a shorter `/new` route for v0.11.
- The Bookmarklet opens the creation route in a new tab using `window.open`.
- The Bookmarklet passes `location.href` as `url` and `document.title` as `title`.
- The Bookmarklet href is generated by the current pongolinks instance as an absolute URL, including the app base path.
- Add a frontend-only Tools slice with a `/tools` route.
- The Tools page exposes a draggable Bookmarklet link named `PL`.
- Add a Tools link to the Bookmark list footer.
- Add `tidy-url` only as a frontend dependency.
- URL cleanup runs in the frontend before duplicate checking.
- URL cleanup is UX policy, not backend normalization and not a domain invariant.
- If cleanup changes the URL, the user chooses between original and cleaned URL by clicking one of them.
- Do not add a general text diff dependency in v0.11.
- URL diff highlighting should be URL-aware and focus on changed URL parts, especially removed or changed query parameters.
- The backend gets a search slice with a URL check endpoint inside the API group.
- The URL check endpoint accepts one candidate URL.
- The URL check endpoint validates the candidate with the same Bookmark URL value object used by Bookmark create/update behavior.
- Invalid URL check input returns existing `bookmark.url_*` operational errors.
- The URL check result is a discriminated state: exact Bookmark, alternate-protocol Bookmark, Related Link matches, or not found.
- Exact Bookmark match has highest priority.
- Alternate-protocol Bookmark match has second priority.
- Related Link matches have third priority.
- Not found is returned only when no Bookmark or Related Link match applies.
- Alternate-protocol matching is strict: only `http:` and `https:` may differ.
- Alternate-protocol matching must not treat host, path text, query, hash, or other string differences as a match.
- Bookmark URL and Related Link lookup treat a trailing slash at the end of the path as equivalent.
- Related Link checks include exact, alternate-protocol, and trailing-slash variants.
- Related Link response wording does not mention alternate protocol.
- Related Link matches can return multiple containing Bookmarks.
- Multiple Related Link matches are sorted by containing Bookmark update time descending, then id descending.
- Exact Bookmark matches automatically replace the route with the existing Bookmark edit route.
- Alternate-protocol Bookmark matches show a warning with a primary action to edit the existing Bookmark.
- Alternate-protocol Bookmark matches also show a secondary action to create a separate Bookmark with the chosen URL.
- Related Link matches show all containing Bookmarks with edit actions.
- Related Link matches also show a secondary action to create a new Bookmark anyway.
- Invalid or non-HTTP(S) incoming Bookmarklet URLs skip URL check and open the create form.
- The incoming title is trimmed before use.
- Empty or missing incoming title remains empty and is handled by normal create validation on submit.
- The Bookmark create view owns the Bookmarklet-assisted flow as an explicit state machine.
- Do not add separate routes for URL choice, duplicate warning, Related Link matches, or checking states.
- The Bookmark form accepts initial create values for Bookmarklet-assisted creation.
- The Bookmark form accepts an initial focus target for URL or Tags.
- Manual focus should use Vue refs and a manual focus call rather than HTML `autofocus`.
- Passing both an edit Bookmark and create initial values to the form is a programmer error.
- After successful Bookmarklet-assisted creation, attempt to close the window.
- If the browser does not close the window, fall back to the Bookmark list.
- Manual Bookmark creation keeps navigating to the Bookmark list after successful save.
- No database schema changes are required.
- No ADR is required for v0.11 because the decisions are understandable and reversible.

The frontend create state machine should preserve this decision shape:

```ts
type CreateBookmarkState =
  | { kind: "manual-entry" }
  | { kind: "choose-url"; originalUrl: string; cleanedUrl: string; title: string }
  | { kind: "checking"; url: string; title: string }
  | { kind: "duplicate-bookmark"; matchKind: "alternate-protocol"; bookmark: BookmarkUrlCheckBookmark }
  | { kind: "related-link-matches"; bookmarks: BookmarkUrlCheckRelatedBookmark[] }
  | { kind: "create-form"; initialUrl: string; initialTitle: string; closeAfterCreate: boolean };
```

The backend URL check contract should preserve this decision shape:

```ts
type BookmarkUrlCheckResult =
  | { status: "exact-bookmark"; bookmark: BookmarkUrlCheckBookmark }
  | { status: "alternate-protocol-bookmark"; bookmark: BookmarkUrlCheckBookmark }
  | { status: "related-link"; bookmarks: BookmarkUrlCheckRelatedBookmark[] }
  | { status: "not-found" };
```

## Testing Decisions

- Tests should assert user-visible and API-visible behavior rather than private helper implementation details.
- Backend URL check coverage should use the existing backend smoke-suite pattern.
- Backend tests should cover exact Bookmark matches.
- Backend tests should cover strict alternate-protocol Bookmark matches.
- Backend tests should cover trailing-slash equivalent Bookmark and Related Link matches.
- Backend tests should cover non-matches where only host, path text, query string, or hash differs.
- Backend tests should cover Related Link matches.
- Backend tests should cover Related Link alternate-protocol matching without exposing alternate-protocol wording in the response.
- Backend tests should cover multiple Related Link matches sorted by update time descending and id descending.
- Backend tests should cover invalid URL errors using existing Bookmark URL error codes.
- Frontend API tests should cover search response parsing and error parsing.
- Frontend tests should cover Bookmarklet href generation, including absolute pongolinks origin and app base path.
- Frontend tests should cover Bookmarklet query parsing.
- Frontend tests should cover incoming title trimming.
- Frontend tests should cover the create flow transition from cleaned URL choice to URL checking.
- Frontend tests should cover exact match redirect behavior at the create flow boundary.
- Frontend tests should cover alternate-protocol warning behavior.
- Frontend tests should cover Related Link match behavior.
- Frontend tests should cover not-found behavior opening the create form.
- Frontend tests should cover invalid captured URLs opening the create form without URL checking.
- Frontend tests should cover URL-aware diff helpers for removed query parameters.
- Frontend tests should cover URL-aware diff helpers for non-query changes.
- Frontend tests should cover Bookmark form initial values.
- Frontend tests should cover Bookmark form initial focus target behavior at the component or helper boundary.
- Existing Bookmark API and form tests are useful prior art for Result parsing and form error mapping.
- Existing backend API smoke tests are useful prior art for route-level integration coverage.
- After implementation, run `bun run typecheck`.
- After implementation, run `bun run agent:test`.
- After implementation, run `bun run format`.

## Out of Scope

- Browser extension support.
- Adding a `/new` route alias.
- Backend URL normalization.
- Saving cleaned URLs automatically without user choice.
- Changing the Bookmark URL domain invariant.
- Supporting non-HTTP(S) Bookmark URLs.
- Generating fallback titles from hostnames or URLs.
- Adding a general-purpose diff library.
- Adding a database schema migration.
- Changing Bookmark uniqueness rules.
- Treating alternate-protocol URLs as hard duplicates.
- Changing Related Link extraction behavior.
- Changing the existing manual Bookmark create success navigation.
- Deploying the app.
- Running a dev server.

## Further Notes

The domain glossary now includes Bookmarklet as a browser bookmark tool that starts saving the current page as a Bookmark.

The architecture plan for this feature is `.scratch/v0.11/add-bookmarklet-support.md`.

Commit message:
feat: add bookmarklet support
