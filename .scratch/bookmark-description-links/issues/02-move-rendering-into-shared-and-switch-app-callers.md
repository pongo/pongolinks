Status: ready-for-agent

# Move rendering into shared and switch app callers

## Parent

`.scratch/bookmark-description-links/PRD.md`

## What to build

Move Bookmark description HTML rendering into the shared Bookmark description module, then switch backend and frontend callers to use the shared API directly. Frontend should receive sanitized linked HTML suitable for `v-html`, while retaining ownership of CSS styling by passing a link class name into the shared renderer.

## Acceptance criteria

- [ ] The shared module exposes `renderBookmarkDescriptionHtml(description, options?)`.
- [ ] Rendering options support optional `linkClassName?: string`.
- [ ] Rendered HTML escapes existing HTML in Bookmark descriptions.
- [ ] URL text becomes links using the same URL policy as Related Link extraction.
- [ ] Rendered links include safe external-link attributes.
- [ ] Rendered links preserve visible URL prefix and trailing slash behavior.
- [ ] The provided `linkClassName` is applied to rendered links.
- [ ] Frontend imports `renderBookmarkDescriptionHtml` directly from `@pongolinks/shared/bookmark-description`.
- [ ] Frontend passes the existing Bookmark description link CSS class into the shared renderer.
- [ ] Backend imports `extractRelatedLinkUrls` directly from `@pongolinks/shared/bookmark-description`.
- [ ] Obsolete backend extraction and frontend autolink helper modules are deleted after callers are migrated.
- [ ] Rendering and migrated extraction tests live in shared unless an app-level test verifies integration behavior.

## Blocked by

- `.scratch/bookmark-description-links/issues/01-create-shared-bookmark-description-extraction-api.md`
