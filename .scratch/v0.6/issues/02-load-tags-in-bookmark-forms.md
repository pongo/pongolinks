# Load Tags in Bookmark Forms

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Load the read-only Tag list when opening Bookmark create/edit forms and pass it into the existing Bookmark form without blocking Bookmark editing if Tag loading fails.

## Scope

- Add `apps/frontend/src/features/tags/types.ts` with `TagSummaryDTO`.
- Add `apps/frontend/src/features/tags/api.ts` with `listTags()`.
- Load Tags when `CreateBookmarkView.vue` opens.
- Load both Bookmark and Tags when `EditBookmarkView.vue` opens.
- Keep the edit loading state tied to Bookmark loading, not Tag loading.
- If `listTags()` fails, keep the form usable and pass an empty Tag list.
- Pass Tag summaries into `BookmarkForm.vue`.
- Keep the existing Bookmark submit payload unchanged.

## Out Of Scope

- Showing a user-facing error for failed Tag list loading.
- Live-refreshing the Tag list after save.
- Adding a Tag management page or link.

## Tests

- Update or add cheap API adapter coverage for the Tags envelope if consistent with existing frontend tests.
- Do not introduce a Vue component testing stack just for this issue.

