# Add Tools Page with Bookmarklet Link

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.11 Bookmarklet Support PRD](../PRD.md)

## What to build

Add a frontend Tools page that exposes a draggable Bookmarklet link named `PL`. The Bookmarklet should open the canonical Bookmark create route in a new tab and pass the current page URL and title as query parameters.

This slice should make the Bookmarklet discoverable and installable. The target create route may still show the existing create form until later slices add cleanup and URL check behavior.

## Acceptance criteria

- [ ] A Tools route is available in the frontend.
- [ ] The Bookmark list footer links to the Tools route.
- [ ] The Tools page exposes a Bookmarklet link named `PL`.
- [ ] The Bookmarklet href is generated from the current pongolinks instance as an absolute URL.
- [ ] The generated href includes the app base path when resolving the Bookmark create route.
- [ ] When run on another page, the Bookmarklet opens pongolinks in a new tab.
- [ ] The Bookmarklet passes `location.href` as the `url` query parameter.
- [ ] The Bookmarklet passes `document.title` as the `title` query parameter.
- [ ] The Bookmarklet does not derive the pongolinks target from the origin of the page being saved.
- [ ] Tests cover Bookmarklet href generation, including absolute origin, app base path, URL parameter, and title parameter.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.

Commit message:
feat: add tools bookmarklet link
