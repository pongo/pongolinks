Status: ready-for-agent

# PRD: Удаление Bookmark

## Problem Statement

Пользователь может создавать и редактировать Bookmark, но не может удалить Bookmark из приложения. Если Bookmark больше не нужен, он остаётся в списке, участвует в организации через Tags и сохраняет производные Related Links.

Удаление должно быть понятным в существующем edit-flow и не должно оставлять мусорные данные: Related Links, связи Bookmark-Tag и Tags без привязанных Bookmarks.

## Solution

Добавить hard delete для Bookmark из экрана редактирования. В нижнем ряду формы редактирования, где находится сохранение, справа появляется красная кнопка `Delete`. После нажатия открывается браузерный `confirm` с предупреждением, что действие нельзя отменить.

Если пользователь подтверждает удаление, frontend вызывает `DELETE /bookmarks/:id`. После успешного удаления приложение открывает главную страницу со списком Bookmarks. Если backend возвращает ошибку, она показывается в существующей области form error.

Backend удаляет Bookmark в транзакции. SQLite каскадно удаляет Related Links и связи Bookmark-Tag. После этого backend явно удаляет Tags, у которых больше нет привязанных Bookmarks.

## User Stories

1. Как пользователь, я хочу удалить Bookmark, который мне больше не нужен, чтобы библиотека оставалась актуальной.
2. Как пользователь, я хочу видеть действие удаления на экране редактирования Bookmark, чтобы удаление было доступно там, где я управляю Bookmark.
3. Как пользователь, я хочу, чтобы кнопка удаления была визуально отделена от сохранения, чтобы случайно не спутать обычное сохранение с destructive action.
4. Как пользователь, я хочу увидеть подтверждение перед удалением, чтобы случайный клик не удалил Bookmark сразу.
5. Как пользователь, я хочу понимать из подтверждения, что удаление нельзя отменить, чтобы принять осознанное решение.
6. Как пользователь, я хочу отменить browser confirm и остаться на экране редактирования, чтобы продолжить работу с Bookmark без изменений.
7. Как пользователь, я хочу после успешного удаления попасть на главную страницу, чтобы продолжить работу со списком Bookmarks.
8. Как пользователь, я хочу, чтобы удалённый Bookmark исчез из списка, чтобы я не видел устаревшую запись.
9. Как пользователь, я хочу, чтобы Related Links удалённого Bookmark тоже исчезали, чтобы приложение не хранило производные ссылки без владельца.
10. Как пользователь, я хочу, чтобы Tags, которые использовались только удалённым Bookmark, исчезали, чтобы список Tags не засорялся сиротами.
11. Как пользователь, я хочу, чтобы Tags, используемые другими Bookmarks, сохранялись, чтобы удаление одного Bookmark не ломало организацию остальных.
12. Как пользователь, я хочу, чтобы при ошибке удаления приложение показывало понятное сообщение, чтобы я понимал, что Bookmark не был удалён.
13. Как пользователь, я хочу, чтобы во время удаления нельзя было одновременно сохранить форму, чтобы не получить конфликтующие действия.
14. Как пользователь, я хочу, чтобы во время сохранения нельзя было одновременно нажать удаление, чтобы destructive action не стартовал поверх другого запроса.
15. Как пользователь, я хочу видеть pending-состояние удаления, чтобы понимать, что запрос уже выполняется.
16. Как maintainer, я хочу, чтобы удаление Bookmark использовало существующий Result-паттерн, чтобы operational errors не выбрасывались исключениями.
17. Как maintainer, я хочу, чтобы отсутствующий Bookmark возвращал существующую ошибку `bookmark.not_found`, чтобы API-контракт оставался консистентным.
18. Как backend developer, я хочу, чтобы удаление было частью write-side Bookmark workflow, чтобы транзакция и очистка связанных данных были инкапсулированы в одном месте.
19. Как frontend developer, я хочу иметь отдельный API helper для удаления Bookmark, чтобы view не знала детали Eden-вызова.
20. Как maintainer, я хочу покрыть удаление интеграционными тестами, чтобы не регрессировать каскадное удаление и очистку Tags.

## Implementation Decisions

- Удаление Bookmark является hard delete без soft delete, trash, undo или restore.
- UI-текст остаётся на английском языке: кнопка `Delete`, pending text `Deleting...`, confirm message вроде `Delete this bookmark? This action cannot be undone.`
- Кнопка `Delete` появляется только в edit-flow, не в create-flow.
- Кнопка удаления находится в нижнем ряду формы: save action слева, destructive action справа.
- Подтверждение реализуется через браузерный `confirm`, без кастомного modal component.
- Frontend вызывает `DELETE /bookmarks/:id` только после подтверждения пользователя.
- После успешного удаления frontend выполняет переход на `/`.
- Ошибки удаления показываются через существующий form error surface.
- Для сохранения и удаления используются отдельные состояния: `isSaving` и `isDeleting`.
- Пока выполняется сохранение или удаление, обе операции блокируются.
- Backend endpoint возвращает Result payload `{ deletedBookmarkId: number }` со статусом `200`.
- Для отсутствующего Bookmark используется существующая ошибка `bookmark.not_found` со статусом `404`.
- Удаление добавляется в существующую write-side границу Bookmark через метод `delete(id, log?)`.
- Метод удаления принимает валидированный Bookmark id, а parsing остаётся на route/application edge.
- Удаление выполняется в одной транзакции.
- Перед удалением backend загружает текущие Tag attachment rows удаляемого Bookmark.
- Удаление самой Bookmark row должно позволить SQLite каскадно удалить Related Links и Bookmark-Tag attachment rows.
- После удаления Bookmark backend проверяет только Tags из предварительно захваченных attachment rows.
- Tags с оставшимися Bookmark attachments сохраняются.
- Tags без оставшихся Bookmark attachments удаляются.
- Схема базы данных не меняется: существующие cascade constraints уже покрывают Related Links и attachment rows.
- ADR не нужен: решение легко изменить позже и оно не является неожиданным архитектурным trade-off.

## Testing Decisions

- Тестировать нужно внешнее поведение delete workflow, а не порядок приватных вызовов внутри реализации.
- Интеграционные backend tests должны проверить успешное удаление Bookmark.
- Интеграционные backend tests должны проверить, что Related Links удалённого Bookmark исчезают.
- Интеграционные backend tests должны проверить, что Bookmark-Tag attachment rows удалённого Bookmark исчезают.
- Интеграционные backend tests должны проверить, что single-use Tag удаляется после удаления единственного Bookmark.
- Интеграционные backend tests должны проверить, что shared Tag сохраняется, если он прикреплён к другому Bookmark.
- Интеграционные backend tests должны проверить `bookmark.not_found` и `404` для отсутствующего Bookmark.
- API smoke suite должен проверить `DELETE /bookmarks/:id` для успешного удаления.
- API smoke suite должен проверить response shape `{ deletedBookmarkId }`.
- API smoke suite должен проверить missing Bookmark case.
- Frontend API tests должны проверить parsing успешного delete payload и mapping `bookmark.not_found` в form error, если существующее покрытие не делает это достаточно явно.
- UI-level тесты не обязательны, если в проекте пока нет устойчивого prior art для Vue component tests; поведение можно покрыть через API helper и backend tests.
- После реализации нужно запустить `bun run typecheck` и `bun run agent:test`.

## Out of Scope

- Soft delete.
- Undo или restore.
- Trash/archive view.
- Custom confirmation modal.
- Массовое удаление Bookmarks.
- Удаление Bookmark из list view.
- Изменение правил синхронизации Tags при create/update.
- Изменение правил извлечения Related Links из Bookmark description.
- Изменение database schema или migrations.
- Изменение визуального дизайна формы за пределами нижнего action row.

## Further Notes

Domain glossary уже содержит нужные термины: Bookmark, Tag, Related Link и правило удаления Tag без привязанных Bookmarks. Дополнять `CONTEXT.md` для этой задачи не нужно.

Существующий architecture plan: `docs/architecture-plans/delete-bookmark.md`.

Commit message: `feat: add bookmark deletion flow`
