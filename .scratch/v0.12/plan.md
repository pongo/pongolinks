# Add Bookmark Search and Filters

## Context

pongolinks is a personal Bookmark library for saving, organizing, and rediscovering links. v0.12 improves rediscovery by adding broad Bookmark Search Queries and strict Bookmark Filters to the existing Bookmark list.

Relevant existing behavior:

- The frontend home route `/` renders the Bookmark list.
- Backend Bookmark list data is returned by `GET /pongolinks/api/bookmarks`.
- Bookmark list rows already display each Bookmark URL host and attached Tags.
- Tags are reusable whitespace-free tokens attached to Bookmarks.
- Related Links are explicit HTTP(S) URLs extracted from Bookmark descriptions.
- The backend search slice already exposes `/search/check` for URL checking during create flows.
- The SQLite FTS table currently indexes Bookmark title and description only.

## Problem

The Bookmark list is browse-only. A user can see domains and Tags, but cannot click them to narrow the list. The list also has no search field for rediscovering Bookmarks by title, description, URL, Related Link, or Tag name.

There are several ambiguous concepts that must stay separate:

- A broad text search can match searchable content without requiring a strict Tag attachment.
- A Tag filter must be exact and should include or exclude Bookmarks by attached Tags.
- A domain filter should be exact to the displayed Bookmark URL hostname.
- URL lookup should reuse the existing exact, alternate-protocol, and Related Link semantics, but return full Bookmark list DTOs.

## Direction

Keep `/` as the canonical frontend Bookmark list route, including filtered and searched states:

```text
/?q=sqlite&tag=vue&tag=-old&domain=example.com
/?url=https%3A%2F%2Fexample.com%2Fpost
```

Do not redirect `/` to `/bookmarks`. The existing `/bookmarks/new` and `/bookmarks/:id/edit` routes remain create/edit routes only.

Extend `GET /pongolinks/api/bookmarks` with optional list query parameters:

```text
q=sqlite
tag=vue
tag=-old
domain=example.com
url=https%3A%2F%2Fexample.com
page=2
```

`url` is a special URL lookup mode and is mutually exclusive with `q`, `tag`, and `domain`.

## Bookmark Filters

### Tag filters

Use repeated `tag` query parameters for both include and exclude filters:

```text
/?tag=sqlite&tag=vue&tag=-old
```

Rules:

- `tag=sqlite` includes only Bookmarks that have the `sqlite` Tag.
- `tag=-old` excludes Bookmarks that have the `old` Tag.
- Multiple positive Tags use AND semantics.
- Multiple negative Tags use AND semantics.
- Positive and negative filters can be combined.
- Duplicate Tags are deduped after normalization.
- Contradictory filters, such as `tag=sqlite&tag=-sqlite`, return a validation error.

### Domain filters

Use an exact hostname filter:

```text
/?domain=example.com
```

Rules:

- Match `http://example.com`, `https://example.com`, and paths under that exact hostname.
- Match optional ports for the same hostname.
- Do not match sibling domains such as `notexample.com`.
- Do not match subdomains such as `sub.example.com`.
- Clicking a displayed domain uses the exact hostname currently shown in the list.

## Bookmark Search Query

Use `q` for broad search:

```text
/?q=sqlite
```

Searchable content in v0.12:

- Bookmark title through SQLite FTS.
- Bookmark description through SQLite FTS.
- Bookmark URL through ordinary matching.
- Related Link URL through ordinary matching.
- Tag name through ordinary matching.

Do not denormalize Tags into the FTS table in v0.12. Keep result ordering as `updatedAt desc, id desc`; do not add ranking yet.

`q` parsing:

- Split text into whitespace tokens.
- Tokens use AND semantics.
- Use prefix matching for FTS tokens.
- Escape user input before building the SQLite FTS `MATCH` expression.
- Do not support quoted phrases in v0.12.
- Do not support negative full-text words in v0.12.

## URL Lookup Mode

Use `url` for special URL lookup:

```text
/?url=https%3A%2F%2Fexample.com%2Fpost
```

Rules:

- Validate through the existing Bookmark URL value object.
- Match exact Bookmark URL first.
- Match alternate `http`/`https` protocol Bookmark URL second.
- Match exact or alternate-protocol Related Links third.
- Return full Bookmark list DTOs, pagination metadata, Tags, and Related Links.
- Do not make one backend route call another backend route.
- Reuse a shared backend lookup helper or repository method so `/search/check` and `/bookmarks?url=...` share URL matching semantics while returning different DTO shapes.
- `url` cannot be combined with `q`, `tag`, or `domain`; mixed mode returns a validation error.

## Search Field Syntax

Add a search field above the Bookmark list. The field shows a human-readable mini-query, while the URL remains structured query parameters.

Input syntax:

```text
sqlite #vue -#old @example.com
```

Maps to:

```text
/?q=sqlite&tag=vue&tag=-old&domain=example.com
```

Rules:

- Plain words become `q`.
- `#tag` becomes an include Tag filter.
- `-#tag` becomes an exclude Tag filter.
- `@example.com` becomes a Domain filter.
- A full-field HTTP(S) URL becomes `url`.
- A URL mixed with other tokens is parsed as ordinary input rather than URL lookup mode.

Mapping from URL state back to the field:

- `/?q=sqlite` shows `sqlite`.
- `/?tag=vue&tag=-old` shows `#vue -#old`.
- `/?domain=example.com` shows `@example.com`.
- `/?q=sqlite&tag=vue&tag=-old&domain=example.com` shows `sqlite #vue -#old @example.com`.
- `/?url=https%3A%2F%2Fexample.com` shows `https://example.com`.

Navigation behavior:

- Search form submit uses `router.push`.
- Submit resets `page` and omits `page=1`.
- Shortcut normalization uses `router.replace`.
- Pagination uses `router.push` and preserves active query parameters.

## Clickable List Filters

Make the displayed domain and each Tag in `BookmarkList.vue` interactive.

Tag click behavior:

- Clicking a Tag adds that include Tag filter on top of the current `q`, `domain`, and other Tag filters.
- Clicking an already active included Tag removes that include Tag filter.
- Exclude Tags are created only from the search field or `/t/` shortcut.
- Clicking a Tag clears any active `url` lookup mode.
- Clicking a Tag resets `page`.

Domain click behavior:

- Clicking a Domain sets that exact Domain filter.
- Clicking the active Domain removes it.
- Only one Domain filter is supported in v0.12.
- Clicking a Domain clears any active `url` lookup mode.
- Clicking a Domain resets `page`.

## Tag Shortcut Route

Add a manual-entry shortcut route:

```text
/t/sqlite vue -old
/t/sqlite+vue+-old
/t/sqlite/vue/-old
```

All forms are accepted and normalized with `router.replace` to:

```text
/?tag=sqlite&tag=vue&tag=-old
```

Rules:

- Split decoded input on whitespace, `+`, and `/`.
- Ignore empty tokens.
- `-tag` becomes `tag=-tag`.
- If no tokens remain, replace with `/`.
- `/t/` is only a frontend shortcut for strict Tag filters, not a backend API route.

## Autocomplete

Add Tag autocomplete to the search field:

- Suggestions open only when the current token starts with `#` or `-#`.
- `#sq` suggests matching Tags and inserts `#sqlite `.
- `-#ol` suggests matching Tags and inserts `-#old `.
- Plain text tokens do not show Tag suggestions.
- Domain autocomplete is out of scope for v0.12.

Reuse the existing Tag suggestion logic by extracting shared tokenizer/suggestion helpers. Do not reuse the full `BookmarkTagInput` component for the search field because the search field has mixed syntax.

## Empty States

Keep the UI compact:

- The search field itself reflects active filters; no separate chip bar is required for v0.12.
- When no Bookmarks exist, show the existing "No bookmarks yet" state.
- When active search/filter state has no matches, show "No matching bookmarks".
- When pagination lands beyond available results, show "No bookmarks on this page".
- Show a clear action when `q`, `tag`, `domain`, or `url` is active.
- Clear search navigates to `/`.

## Implementation Issues

1. [Backend bookmark list filters](./issues/01-backend-bookmark-list-filters.md)
2. [Frontend bookmark list query state](./issues/02-frontend-bookmark-list-query-state.md)
3. [Clickable tag and domain filters](./issues/03-clickable-tag-and-domain-filters.md)
4. [Tag shortcut route](./issues/04-tag-shortcut-route.md)
5. [Search field tag autocomplete](./issues/05-search-field-tag-autocomplete.md)

## Verification

Use the project root commands:

1. `bun run typecheck`
2. `bun run agent:test`
3. `bun run format`

feat: add bookmark search and filters
