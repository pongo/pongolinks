Status: ready-for-agent

# PRD: Углубить обработку ссылок в описании Bookmark

## Problem Statement

Поведение ссылок в описании Bookmark сейчас разделено между backend, frontend и shared-пакетом. Shared экспортирует только настройки Autolinker, а backend и frontend самостоятельно собирают parsing/rendering logic вокруг этих настроек.

Из-за этого приложения знают технические детали Autolinker и частично дублируют policy: backend решает, какие URL становятся Related Links, а frontend отдельно решает, какие URL превращаются в безопасный HTML для `v-html`. Если изменится определение Related Link или правила отображения URL в описании Bookmark, изменение может потребовать правок в нескольких app-level местах.

## Solution

Сделать обработку ссылок в описании Bookmark глубоким shared-модулем с небольшим публичным API. Backend должен получать из shared список URL для синхронизации Related Links. Frontend должен получать из shared готовый безопасный HTML для отображения описания Bookmark через `v-html`.

Autolinker должен стать implementation detail shared-пакета. Backend и frontend не должны импортировать Autolinker напрямую и не должны знать его match types, parsing options или rendering options.

## User Stories

1. As a backend developer, I want to extract Related Link URLs through a shared Bookmark description API, so that backend synchronization follows the domain definition of Related Link.
2. As a frontend developer, I want to render Bookmark descriptions through a shared Bookmark description API, so that frontend rendering follows the same URL policy as backend extraction.
3. As a maintainer, I want Autolinker to be hidden inside shared code, so that changing the parser does not require app-level refactors.
4. As a maintainer, I want Related Link extraction to mean explicit HTTP(S) URLs only, so that bare domains, emails, phone numbers, mentions, hashtags, and unsupported schemes are not accidentally persisted as Related Links.
5. As a user viewing Bookmarks, I want URLs in descriptions to become clickable links, so that nearby supporting context is easy to open.
6. As a user viewing Bookmarks, I want existing HTML in descriptions to be escaped, so that saved text cannot inject markup into the page.
7. As a user viewing Bookmarks, I want linked description URLs to preserve their visible prefix and trailing slash, so that the text I saved remains recognizable.
8. As a user opening description links, I want them to open as external links safely, so that browsing away from pongolinks does not disrupt the current page.
9. As a frontend developer, I want to pass a CSS class name into the shared renderer, so that frontend styling remains owned by the Vue app.
10. As a maintainer, I want backend and frontend package manifests to avoid unused direct Autolinker dependencies, so that dependency ownership matches the code boundary.
11. As a maintainer, I want extraction and rendering tests to live in shared, so that behavior is tested where the policy is owned.
12. As a maintainer, I want the backend Bookmark README to describe shared ownership of Related Link extraction, so that future agents do not recreate backend-local parsing.

## Implementation Decisions

- Create a focused shared module for Bookmark description behavior, exported as `@pongolinks/shared/bookmark-description`.
- Expose `extractRelatedLinkUrls(description: string): string[]` as the domain API for extracting Related Link URL strings from Bookmark descriptions.
- Expose `renderBookmarkDescriptionHtml(description, options?)` as the rendering API for producing sanitized linked HTML suitable for frontend `v-html` usage.
- Use an options object for rendering configuration. The only planned option is `linkClassName?: string`.
- Keep CSS styling in the frontend. The Vue component passes the link class name directly into the shared renderer.
- Keep DOM safety, URL parsing, external-link attributes, prefix stripping behavior, and trailing slash behavior inside shared.
- Make Autolinker parsing/rendering options private to the shared implementation.
- Keep `autolinker` as a direct dependency of `@pongolinks/shared`.
- Remove direct `autolinker` dependencies from `@pongolinks/backend` and `@pongolinks/frontend` after their imports are removed.
- Replace backend usage of the local extraction helper with `extractRelatedLinkUrls` from `@pongolinks/shared/bookmark-description`.
- Delete the backend extraction wrapper after all callers use shared directly.
- Replace frontend usage of the local autolink helper with direct usage of `renderBookmarkDescriptionHtml` from `@pongolinks/shared/bookmark-description`.
- Delete the frontend autolink helper after the Vue component imports shared directly.
- Update the backend Bookmark README so it points Related Link extraction ownership at `@pongolinks/shared/bookmark-description`.
- Do not create a new adapter abstraction around Autolinker unless a second parser or renderer appears.
- Do not create an ADR for this change. The decision is documented in the architecture plan and is not hard enough to reverse to justify an ADR.

## Testing Decisions

- Test external behavior of the shared module, not Autolinker internals.
- Shared extraction tests should verify that explicit `http://` and `https://` URLs are extracted.
- Shared extraction tests should verify that bare domains, emails, phone numbers, mentions, hashtags, and unsupported schemes are ignored.
- Shared extraction tests should verify exact-string deduplication.
- Shared rendering tests should verify that existing HTML is escaped.
- Shared rendering tests should verify that URL text becomes links.
- Shared rendering tests should verify that `linkClassName` is applied when provided.
- Shared rendering tests should verify safe external-link attributes.
- Shared rendering tests should verify that emails, phone numbers, mentions, and hashtags are not linked.
- Existing backend extraction tests and frontend autolink tests are prior art and should be moved or rewritten into shared tests.
- App-level tests should only remain if they cover app integration behavior rather than shared parsing/rendering policy.
- Run `bun run typecheck` and `bun run agent:test` after implementation.

## Out of Scope

- Changing the persisted Related Link schema.
- Changing the definition that a URL can identify at most one Bookmark.
- Adding support for bare domains as Related Links.
- Adding support for non-HTTP(S) schemes as Related Links.
- Building a parser/renderer adapter seam before there is a second implementation.
- Changing frontend visual styling beyond wiring the existing link class through the shared renderer.
- Creating an ADR for this refactor.

## Further Notes

The domain glossary defines Related Link as a secondary explicit HTTP(S) URL automatically extracted from a Bookmark description because it provides nearby or supporting context. The implementation should preserve that language.

The existing architecture plan is `docs/architecture-plans/deepen-bookmark-description-links.md`.

Commit message: `refactor: deepen bookmark description link handling`
