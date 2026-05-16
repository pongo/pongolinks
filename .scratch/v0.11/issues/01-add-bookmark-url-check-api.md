# Add Bookmark URL Check API

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.11 Bookmarklet Support PRD](../PRD.md)

## What to build

Add the backend URL check behavior needed by Bookmarklet-assisted creation. Given one candidate Bookmark URL, the API should report whether it exactly matches an existing Bookmark, matches an existing Bookmark with only the HTTP protocol changed, appears as a Related Link in one or more Bookmarks, or is not found.

This slice should deliver the backend contract and route behavior end-to-end with smoke coverage. It does not need to build the frontend Bookmarklet flow.

## Acceptance criteria

- [ ] A search URL check endpoint exists inside the existing API group.
- [ ] The endpoint accepts exactly one candidate URL.
- [ ] Candidate URL validation uses the same Bookmark URL rules as Bookmark create/update.
- [ ] Invalid candidate URLs return existing `bookmark.url_*` operational errors.
- [ ] Exact Bookmark URL matches return an `exact-bookmark` result with Bookmark id, URL, and title.
- [ ] Exact Bookmark matches take priority over all other match types.
- [ ] Alternate-protocol Bookmark matches return an `alternate-protocol-bookmark` result with Bookmark id, URL, and title.
- [ ] Alternate-protocol matching is strict: only `http:` and `https:` may differ.
- [ ] Host, path, slash shape, query string, hash, or any other string difference does not count as an alternate-protocol match.
- [ ] Related Link matches return a `related-link` result with the containing Bookmark id, URL, and title.
- [ ] Related Link matching includes exact and alternate-protocol URL variants without exposing alternate-protocol wording in the response.
- [ ] Multiple Related Link matches are sorted by containing Bookmark update time descending, then id descending.
- [ ] A `not-found` result is returned only when no Bookmark or Related Link match applies.
- [ ] Backend smoke coverage verifies exact Bookmark, alternate-protocol Bookmark, Related Link, multiple Related Link ordering, not-found, and invalid URL behavior.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

None - can start immediately.

Commit message:
feat: add bookmark url check api
