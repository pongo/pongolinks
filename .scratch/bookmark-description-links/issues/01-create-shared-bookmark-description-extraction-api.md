Status: ready-for-agent

# Create the shared Bookmark description extraction API

## Parent

`.scratch/bookmark-description-links/PRD.md`

## What to build

Create the focused shared Bookmark description module and expose a domain API for extracting Related Link URL strings from Bookmark descriptions. The API should hide Autolinker from app callers and make explicit HTTP(S) URL extraction the shared behavior used by backend synchronization.

## Acceptance criteria

- [ ] `@pongolinks/shared/bookmark-description` is exported as a package subpath.
- [ ] The shared module exposes `extractRelatedLinkUrls(description: string): string[]`.
- [ ] Autolinker parsing configuration is private to the shared implementation.
- [ ] Extraction returns explicit `http://` and `https://` URLs.
- [ ] Extraction ignores bare domains, emails, phone numbers, mentions, hashtags, and unsupported URL schemes.
- [ ] Extraction deduplicates URLs by exact string.
- [ ] Shared tests cover the extraction behavior without asserting Autolinker internals.

## Blocked by

None - can start immediately.
