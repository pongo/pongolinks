Нашёл 5 deepening opportunities. Код не менял, тесты не запускал.

1. **Tag lifecycle module**

**Files**: [tag-name.ts](apps/backend/src/features/bookmarks/domain/tag-name.ts:5), [bookmark-editor.ts](apps/backend/src/features/bookmarks/repository/bookmark-editor.ts:296), [tags-repository.ts](apps/backend/src/features/tags/tags-repository.ts:66), [routes.ts](apps/backend/src/features/tags/routes.ts:77)

**Problem**: Tag rules are split across Bookmark editing and Tag management. Bookmark editing owns `TagName`, attach/detach, orphan deletion, and find-or-create. Tag management owns rename/merge/delete. The same Tag invariant is also reimplemented as `parseTagName` in the Tag routes. The current modules are shallow around the actual concept: callers still need to understand too much of Tag identity, normalized name, attachment cleanup, and replacement behavior.

**Solution**: Deepen the Tag lifecycle into one Tag-owned module that owns Tag name validation, normalized identity, attachment synchronization, orphan removal, and rename/merge behavior. Bookmark editing should ask for Tag synchronization, not implement Tag lifecycle rules directly.

**Benefits**: Better locality for Tag bugs: changing “what happens to orphan Tags?” or “how normalized Tag identity works?” happens in one place. Better leverage for tests: Tag lifecycle tests can cover Bookmark attachment sync and Tag rename/merge through the same interface instead of asserting pieces across two repositories.

2. **Bookmark URL lookup module**

**Files**: [bookmark-url-lookup-repository.ts](apps/backend/src/repository/bookmark-url-lookup-repository.ts:108), [search-repository.ts](apps/backend/src/features/search/search-repository.ts:26), [bookmark-read-repository.ts](apps/backend/src/features/bookmarks/repository/bookmark-read-repository.ts:91), [create-bookmark-flow.ts](apps/frontend/src/features/bookmark-editor/views/CreateBookmarkView/create-bookmark-flow.ts:112)

**Problem**: Bookmark URL lookup is a real seam because two backend callers use it, but the interface is still low-level: it returns status plus Bookmark IDs, so each caller must know how to hydrate/order Bookmarks and interpret exact, alternate-protocol, and Related Link matches. The frontend create flow also encodes the same status meanings.

**Solution**: Deepen Bookmark URL lookup so the module owns the full lookup meaning: trailing slash equivalence, alternate protocol matching, Related Link matching, ordering, and the caller-facing match shape. Callers should not need to reconstruct the same interpretation from IDs.

**Benefits**: More leverage from one tested Bookmark URL lookup module. Better locality for future lookup rules, especially because `CONTEXT.md` already gives Bookmark URL lookup a domain rule. Tests can target lookup behavior once instead of spreading expectations through search, list filtering, and create flow tests.

3. **Bookmark Filter module**

**Files**: [bookmark-list-filters-query.ts](apps/backend/src/features/bookmarks/bookmark-list-filters-query.ts:60), [bookmark-read-repository.ts](apps/backend/src/features/bookmarks/repository/bookmark-read-repository.ts:22), [bookmark-list-query-state.ts](apps/frontend/src/features/bookmarks/utils/bookmark-list-query-state.ts:3), [api.ts](apps/frontend/src/features/bookmarks/api/api.ts:52)

**Problem**: Bookmark Filter behavior is spread through frontend route state, frontend request shaping, backend query parsing, and backend SQL construction. Several rules are important but not locally obvious: URL lookup mode cannot mix with filters, Tag filters can include/exclude, contradictory Tags are rejected, domain text is normalized, page reset behavior lives elsewhere.

**Solution**: Deepen Bookmark Filter into a domain-shaped module that owns parsing, normalization, incompatibility rules, and conversion into persistence conditions. The route and Vue code can still own UI state, but the Bookmark Filter rules should not be rediscovered at every layer.

**Benefits**: Better locality for filter changes and fewer mismatches between frontend and backend behavior. Better test leverage: tests can exercise Bookmark Filter normalization and invalid combinations directly, while list route tests focus on route behavior.

4. **Create Bookmark flow module**

**Files**: [CreateBookmarkView.vue](apps/frontend/src/features/bookmark-editor/views/CreateBookmarkView/CreateBookmarkView.vue:34), [create-bookmark-flow.ts](apps/frontend/src/features/bookmark-editor/views/CreateBookmarkView/create-bookmark-flow.ts:10), [check-url/api.ts](apps/frontend/src/features/check-url/api.ts:35), [create-bookmark-success.ts](apps/frontend/src/features/bookmark-editor/views/CreateBookmarkView/create-bookmark-success.ts)

**Problem**: Some pure transition functions were extracted, but the actual Create Bookmark flow still lives partly in the Vue view: async URL check, duplicate handling, Related Link handling, navigation to edit, save, close-after-create, and form error placement. This is the “pure functions for testability but bugs hide in how they are called” shape.

**Solution**: Deepen the Create Bookmark flow into a frontend module that owns the workflow and exposes a smaller interface to the view. The view should render state and forward commands; the module should own transitions and side effects around Bookmark URL check and create success.

**Benefits**: Better locality for Bookmarklet-driven creation bugs. More leverage in tests because the whole user flow can be tested through one interface instead of separately testing pure helpers and manually trusting the Vue orchestration.

5. **Frontend Result adapter module**

**Files**: [shared/api/client.ts](apps/frontend/src/shared/api/client.ts:19), [bookmark-editor/api.ts](apps/frontend/src/features/bookmark-editor/api.ts:17), [bookmarks/api.ts](apps/frontend/src/features/bookmarks/api/api.ts:18), [wayback/api.ts](apps/frontend/src/features/bookmark-editor/components/BookmarkForm/wayback/api.ts:16)

**Problem**: The shared Eden parsing module has some depth, but each feature adapter repeats fallback errors, parse wrappers, `try/catch`, and field error mapping. Deleting the feature wrappers would scatter the same Result and form-error ceremony across views; keeping them as-is still leaves too much repeated interface knowledge in every adapter.

**Solution**: Deepen the frontend Result adapter module so feature slices declare only their endpoint call and feature-specific error mapping. The shared adapter should own Eden response parsing, fallback behavior, and operational failure conversion.

**Benefits**: Better locality for transport/result parsing changes. More leverage for feature adapters: less repeated code per endpoint, and tests can focus on feature-specific error mapping instead of re-testing the same Result plumbing.

Which of these would you like to explore?
