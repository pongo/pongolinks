# Deepen Bookmark Description Link Handling

## Context

Bookmark description link behavior is shared across backend and frontend:

- `packages/shared/src/bookmarks/bookmark-description-links.ts` defines common Autolinker parsing options.
- `apps/backend/src/features/bookmarks/utils/extract-related-links.ts` extracts Related Links from Bookmark descriptions.
- `apps/frontend/src/features/bookmarks/views/BookmarkListView/autolink-description.ts` renders safe linked Bookmark descriptions.

The shared parsing options are a good start, but callers still know Autolinker details directly.

## Problem

The current shared module is shallow: it exports configuration rather than domain behavior. Backend extraction and frontend rendering each compose Autolinker themselves, so policy is only partly centralized.

If the project changes the definition of a Related Link or how Bookmark descriptions should render URLs, the change may need to touch both app-level callers.

## Direction

Deepen the shared Bookmark description links module around domain operations:

- Extract Related Link URLs from Bookmark description text.
- Render Bookmark description text as safe linked HTML for frontend `v-html` usage.

Keep styling options explicit enough that the frontend can style links, but do not make app callers know that Autolinker is used.

This does not need a new adapter seam unless another parser or renderer appears. One adapter would be hypothetical; the immediate value is locality for Bookmark description link policy.

## Implementation Plan

1. Move backend extraction behavior into `packages/shared/src/bookmark-description/` behind `extractRelatedLinkUrls(description: string): string[]`, exported as `@pongolinks/shared/bookmark-description`.
2. Define the extraction behavior as explicit HTTP(S) URL extraction, matching the domain definition of a Related Link.
3. Move frontend-safe rendering behavior into `packages/shared/src/bookmark-description/` behind `renderBookmarkDescriptionHtml(description, { linkClassName })`, with optional `linkClassName`.
4. Make Autolinker parsing options private to the shared implementation.
5. Keep `autolinker` as a direct dependency of `@pongolinks/shared`, and remove direct `autolinker` dependencies from `@pongolinks/backend` and `@pongolinks/frontend` after their imports are gone.
6. Keep CSS styling in the frontend by passing `linkClassName` directly from the Vue component, but make the shared renderer own DOM safety, URL parsing, and external-link attributes.
7. Replace backend imports with `extractRelatedLinkUrls` from `@pongolinks/shared/bookmark-description` and delete the backend extraction wrapper.
8. Update the backend Bookmark README so it points Related Link extraction ownership at `@pongolinks/shared/bookmark-description`.
9. Move extraction and rendering tests into `packages/shared` so backend and frontend callers do not know about Autolinker.
10. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: deepen bookmark description link handling
