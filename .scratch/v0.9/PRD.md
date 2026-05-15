Status: ready-for-agent

# PRD: v0.9 BookmarkEditor

## Problem Statement

Сейчас backend slice для Bookmark скрывает важное поведение внутри repository-объекта, но его публичная форма все еще выглядит как CRUD persistence. При создании и обновлении Bookmark модуль не просто сохраняет строки: он проверяет уникальность URL, синхронизирует Tags из отправленного Tag text, синхронизирует Related Links из описания, удаляет orphan Tags, перезагружает итоговый BookmarkDTO и пишет telemetry counts.

Из-за этого будущему разработчику сложно увидеть главный workflow: "отредактировать Bookmark и сохранить согласованными производные связи". Если это поведение будет расти внутри repository API, routes и тесты могут начать зависеть от порядка внутренних persistence-шагов, а не от внешнего результата редактирования Bookmark.

## Solution

В v0.9 нужно выделить глубокую write-boundary `BookmarkEditor` внутри backend Bookmark slice. Эта граница должна владеть созданием и обновлением editable Bookmark state, сохраняя за собой database choreography: duplicate URL handling, persistence, Tag synchronization, Related Link synchronization, orphan Tag cleanup, post-write reload и operational error mapping.

Routes остаются application edge: они парсят HTTP input, создают value objects, формируют Result responses и добавляют logging context. `BookmarkEditor` получает уже validated editable Bookmark data и возвращает тот же результат, который сегодня ожидает API.

Read-side поведение (`list`, `findById`) не входит в editing boundary. Tag synchronization может быть вынесена только как private collaborator внутри Bookmark backend slice, если это сделает `BookmarkEditor` меньше и понятнее.

## User Stories

1. As a backend maintainer, I want Bookmark create behavior to be exposed through a `BookmarkEditor`, so that creation reads as part of the Bookmark editing workflow rather than raw persistence.
2. As a backend maintainer, I want Bookmark update behavior to be exposed through the same `BookmarkEditor`, so that create and update share one write boundary.
3. As a backend maintainer, I want duplicate Bookmark URL handling to stay behind the editing boundary, so that routes do not need to know how uniqueness is enforced.
4. As an API caller, I want duplicate Bookmark URLs to keep returning the existing error code and status, so that client behavior does not regress.
5. As an API caller, I want missing Bookmark updates to keep returning the existing not-found error, so that error handling remains stable.
6. As a backend maintainer, I want Tags attached to a Bookmark to stay synchronized from submitted Tag text during create and update, so that Bookmark organization remains consistent.
7. As a backend maintainer, I want retained Tags to keep their existing attachment rows during update, so that synchronization preserves stable relationships where possible.
8. As a backend maintainer, I want removed Tags to detach from the edited Bookmark, so that stale organization metadata is not left behind.
9. As a backend maintainer, I want Tags with no attached Bookmarks to be removed, so that orphan Tags do not pollute Tag suggestions or Tag Popularity.
10. As a backend maintainer, I want shared Tags to remain when only one Bookmark detaches them, so that Tag cleanup does not remove Tags still used elsewhere.
11. As a backend maintainer, I want Related Links to stay synchronized from the Bookmark description during create and update, so that supporting URLs reflect the current description.
12. As a backend maintainer, I want retained Related Link rows to remain when the URL is still present, so that update synchronization does not churn stable relationships.
13. As a backend maintainer, I want removed Related Links to be deleted when URLs disappear from the description, so that the Bookmark does not expose outdated supporting context.
14. As a backend maintainer, I want new Related Links to be inserted when new URLs appear in the description, so that the returned BookmarkDTO reflects the edited description.
15. As a backend maintainer, I want write-path telemetry counts to stay available, so that existing observability around Tag and Related Link synchronization is preserved.
16. As an API maintainer, I want telemetry counts to stay out of the public API response, so that operational details do not become client contracts.
17. As a route maintainer, I want routes to keep request parsing and value-object construction, so that HTTP validation remains at the application edge.
18. As a route maintainer, I want routes to call one editing boundary for create/update, so that they do not need to know the persistence choreography.
19. As a backend maintainer, I want list and find behavior to stay separate from editing, so that the new module remains named after the write workflow it owns.
20. As a backend maintainer, I want row-to-DTO mapping to remain private to persistence/editing internals, so that callers do not learn database row shapes.
21. As a backend maintainer, I want Tag synchronization extraction to be optional and private, so that v0.9 deepens Bookmark editing without prematurely creating a top-level Tag architecture boundary.
22. As a future agent, I want the v0.9 scope to explicitly exclude database driver changes, so that implementation does not mix architecture refactoring with infrastructure migration.
23. As a future agent, I want focused integration coverage around `BookmarkEditor`, so that tests describe the external behavior of the new boundary.
24. As a future agent, I want the existing API smoke coverage to keep passing, so that the refactor preserves client-visible behavior.

## Implementation Decisions

- Build a new `BookmarkEditor` write boundary inside the backend Bookmark slice.
- `BookmarkEditor` owns create and update for editable Bookmark state.
- `BookmarkEditor` receives validated editable Bookmark data, including constructed `BookmarkUrl` and parsed `TagName` values.
- HTTP request parsing, Zod validation, value-object construction, Result response formatting, and request logging setup stay in routes.
- Duplicate URL detection and duplicate URL error mapping stay inside the write workflow.
- Missing Bookmark handling for update stays inside the write workflow.
- Tag synchronization stays part of the Bookmark editing workflow for v0.9.
- Tag synchronization may be extracted as a private collaborator if that creates a deeper, clearer module.
- Tag synchronization must not become a top-level or cross-feature module in v0.9.
- Related Link synchronization stays part of the Bookmark editing workflow.
- Post-write reload of the final BookmarkDTO stays behind the editing boundary.
- Optional write-path telemetry can be passed through a `BookmarkEditor` logger/callback.
- Synchronization counts remain operational telemetry, not API response data and not domain result data.
- `list` and `findById` remain on the read-side repository path unless the write refactor absolutely requires a small internal helper.
- Low-level row-to-DTO mapping remains private to the persistence/editing implementation.
- API response shapes, error codes, and HTTP status behavior must remain unchanged.
- The Drizzle SQLite driver remains unchanged for v0.9.
- A possible move from `bun:sqlite` to `@libsql/client` is not part of this PRD.
- The deferred Tag Synchronization architecture plan should not be implemented as an independent v0.9 target.

## Testing Decisions

- Tests should assert external behavior of the editing boundary, not private helper methods or internal ordering.
- Add focused `BookmarkEditor` integration coverage for create and update behavior.
- Because Vitest runs under Node while the current database client uses `bun:sqlite`, focused integration coverage should follow the existing backend pattern: a Vitest wrapper launches a Bun script against a real migrated in-memory SQLite database.
- Keep the existing API smoke suite as regression coverage for route-level behavior.
- Cover duplicate URL rejection on create.
- Cover duplicate URL rejection on update when the URL belongs to another Bookmark.
- Cover update of a missing Bookmark.
- Cover create attaching Tags and inserting Related Links.
- Cover update retaining an existing Tag attachment row when a Tag remains submitted.
- Cover update detaching removed Tags.
- Cover update deleting only orphan Tags.
- Cover update preserving shared Tags that are still attached to other Bookmarks.
- Cover update retaining an existing Related Link row when its URL remains in the description.
- Cover update deleting removed Related Links.
- Cover update inserting new Related Links.
- After implementation, run `bun run typecheck`.
- After implementation, run `bun run agent:test`.

## Out of Scope

- Changing the SQLite/Drizzle driver.
- Moving to `@libsql/client`.
- Making Tag synchronization a top-level module.
- Making Tag synchronization a cross-feature module.
- Moving `list` into `BookmarkEditor`.
- Moving `findById` into `BookmarkEditor`.
- Moving HTTP request parsing into `BookmarkEditor`.
- Moving `BookmarkUrl` or `TagName` construction into `BookmarkEditor`.
- Changing API response shapes.
- Changing API error codes or HTTP statuses.
- Changing frontend behavior.
- Changing database schema.
- Creating an ADR for database driver choice.

## Further Notes

The domain glossary already covers the relevant terms: Bookmark, Tag, Tag Popularity, Related Link, and Private Bookmark. No glossary change is required for v0.9 because `BookmarkEditor` is an architectural boundary, not a domain term.

The architecture plan for Tag synchronization remains useful future context, but it is deferred for v0.9. In this PRD, Tag synchronization is treated as one internal rule coordinated by Bookmark editing.

Commit message:
refactor: deepen bookmark editing workflow
