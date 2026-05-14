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
- Render Bookmark description text as safe linked HTML for the frontend.

Keep rendering-specific options explicit enough that the frontend can style links, but do not make app callers reconstruct the parsing policy.

This does not need a new adapter seam unless another parser or renderer appears. One adapter would be hypothetical; the immediate value is locality for Bookmark description link policy.

## Implementation Plan

1. Move backend extraction behavior into `packages/shared/src/bookmarks/` behind a domain-named function.
2. Move frontend-safe rendering behavior into the same shared area only if the package can cleanly own Autolinker rendering without pulling frontend-only concerns into shared code.
3. Keep CSS class names and UI styling in the frontend if moving rendering would make the shared interface too presentation-specific.
4. Add shared tests for extraction policy and frontend tests for rendered HTML safety/class behavior if rendering remains frontend-local.
5. Re-run `bun run typecheck` and `bun run agent:test`.

refactor: deepen bookmark description link handling
