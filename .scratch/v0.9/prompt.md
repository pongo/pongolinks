Нужно реализовать .scratch/v0.9/issues/01-add-bookmark-editor-characterization.md

Перед началом прочитай:

- `AGENTS.md`
- `.scratch/v0.9/PRD.md`
- указанный issue
- связанные architecture plans:
  - `docs/architecture-plans/deepen-bookmark-editing-module.md`
  - `docs/architecture-plans/deepen-tag-synchronization-module.md`

Следуй scope из issue. Не делай соседние issues заранее. Не меняй SQLite/Drizzle driver, не запускай dev server, не делай deploy, не делай git commit.

После реализации запусти:

- `bun run typecheck`
- `bun run agent:test`

Если issue просит форматирование или ты менял форматируемые файлы, также запусти:

- `bun run format`

В конце кратко напиши:

- что изменено
- какие проверки запускались и их результат
- если что-то не удалось проверить, почему

---

$grill-with-docs хочу спланировать v0.9

сфокусировавшись на этих двух возможных планах об архитектуре:

[deepen-bookmark-persistence-module.md](docs/architecture-plans/deepen-bookmark-persistence-module.md) [deepen-tag-synchronization-module.md](docs/architecture-plans/deepen-tag-synchronization-module.md)
