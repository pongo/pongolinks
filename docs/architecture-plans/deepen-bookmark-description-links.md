# Deepen Bookmark Description Link Handling

## Context

Bookmark description link behavior is shared across backend and frontend:

- `packages/shared/src/bookmark-description/index.ts` extracts Related Links from Bookmark descriptions.
- `packages/shared/src/bookmark-description/index.ts` renders safe linked Bookmark descriptions.
- `apps/backend/src/features/bookmarks/repository/bookmark-editor.ts` uses the shared extraction API for Related Link synchronization.
- `apps/frontend/src/features/bookmarks/views/BookmarkListView/BookmarkListView.vue` uses the shared rendering API for `v-html`.

Autolinker is a private implementation detail of `@pongolinks/shared/bookmark-description`.

## Problem

The previous shared module was shallow: it exported configuration rather than domain behavior. Backend extraction and frontend rendering each composed Autolinker themselves, so policy was only partly centralized.

The shared Bookmark description module now owns the definition of a Related Link and how Bookmark descriptions render URLs.

## Direction

Deepen the shared Bookmark description links module around domain operations:

- Extract Related Link URLs from Bookmark description text.
- Render Bookmark description text as safe linked HTML for frontend `v-html` usage.

Keep styling options explicit enough that the frontend can style links, but do not make app callers know that Autolinker is used.

This does not need a new adapter seam unless another parser or renderer appears. One adapter would be hypothetical; the immediate value is locality for Bookmark description link policy.

## Implementation Plan

1. Move backend extraction behavior into `packages/shared/src/bookmark-description/` behind `extractRelatedLinkUrls(description: string): string[]`, exported as `@pongolinks/shared/bookmark-description`. Done.
2. Define the extraction behavior as explicit HTTP(S) URL extraction, matching the domain definition of a Related Link. Done.
3. Move frontend-safe rendering behavior into `packages/shared/src/bookmark-description/` behind `renderBookmarkDescriptionHtml(description, { linkClassName })`, with optional `linkClassName`. Done.
4. Make Autolinker parsing options private to the shared implementation. Done.
5. Keep `autolinker` as a direct dependency of `@pongolinks/shared`, and remove direct `autolinker` dependencies from `@pongolinks/backend` and `@pongolinks/frontend` after their imports are gone. Done.
6. Keep CSS styling in the frontend by passing `linkClassName` directly from the Vue component, but make the shared renderer own DOM safety, URL parsing, and external-link attributes. Done.
7. Replace backend imports with `extractRelatedLinkUrls` from `@pongolinks/shared/bookmark-description` and delete the backend extraction wrapper. Done.
8. Update the backend Bookmark README so it points Related Link extraction ownership at `@pongolinks/shared/bookmark-description`. Done.
9. Move extraction and rendering tests into `packages/shared` so backend and frontend callers do not know about Autolinker. Done.
10. Re-run `bun run typecheck` and `bun run agent:test`. Done.

refactor: deepen bookmark description link handling
