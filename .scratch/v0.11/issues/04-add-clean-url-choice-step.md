# Add Clean URL Choice Step

Status: ready-for-agent
Labels: ready-for-agent

## Parent

[v0.11 Bookmarklet Support PRD](../PRD.md)

## What to build

Add the frontend URL cleanup choice inside Bookmark creation. When the create route receives a candidate URL from the Bookmarklet and `tidy-url` produces a different URL, the user should see the original and cleaned URLs, understand the changed parts, and choose which URL to continue with.

This slice should stop after selecting a candidate URL and reaching the create form/checking boundary. It does not need to render backend URL check result screens.

## Acceptance criteria

- [ ] `tidy-url` is added as a dependency of the frontend package only.
- [ ] URL cleanup runs on the frontend when the Bookmark create route receives a `url` query parameter.
- [ ] URL cleanup does not change backend Bookmark URL validation or persistence behavior.
- [ ] If the cleaned URL is identical to the original URL, the cleanup choice screen is skipped.
- [ ] If the cleaned URL differs, the user sees both the original URL and cleaned URL.
- [ ] The user can choose the original URL by clicking it.
- [ ] The user can choose the cleaned URL by clicking it.
- [ ] URL diff highlighting is URL-aware rather than a general character diff.
- [ ] Removed or changed query parameters are highlighted clearly.
- [ ] Non-query URL part changes are highlighted coarsely.
- [ ] No general-purpose diff library is added.
- [ ] Incoming `title` query text is trimmed before becoming an initial form value.
- [ ] Empty or missing incoming title remains empty.
- [ ] Invalid or non-HTTP(S) incoming URLs skip cleanup/checking and open the create form with URL focus.
- [ ] Valid Bookmarklet-assisted create can open the create form with Tags focus after a URL is selected.
- [ ] Tests cover query parsing, title trimming, identical cleanup skip, original URL selection, cleaned URL selection, removed query parameter highlighting, non-query change highlighting, and invalid URL fallback.
- [ ] `bun run typecheck` passes.
- [ ] `bun run agent:test` passes.

## Blocked by

- [Add Bookmark Form Initial Values and Focus Control](02-add-bookmark-form-initial-values-and-focus-control.md)

Commit message:
feat: add clean bookmark url choice
