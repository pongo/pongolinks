/grill-with-docs
Хочу спланировать v0.3.

Контекст:

- v0.1: runnable skeleton по @.scratch/v0.1/IMPLEMENTATION_PLAN.md
- v0.2: базовый Bookmark add/edit/list по @.scratch/v0.2/IMPLEMENTATION_PLAN.md
- доменный язык в @CONTEXT.md
- ADR:
  - @docs/adr/0001-monorepo-with-single-backend-entrypoint.md
  - @docs/adr/0002-value-objects-for-validated-domain-primitives.md
  - @docs/adr/0003-evlog-wide-events-for-backend-observability.md
- схема БД и миграции живут в packages/db;
- frontend/backend используют vertical slices;
- проект использует Bun workspaces и Turborepo;
- backend: Bun/Elysia + Eden;
- frontend: Vue SPA + Tailwind CSS 4;
- operational errors через Result.

Цель v0.3:

- добавление/редактирование тегов к закладкам. пока что взаимодействие только через форму создания/редактирования закладки
- на странице списка закладок теги отображаются справа от домена закладки. визуально как на скриншоте во вложении
- на форме создания/редактирования закладки теги отображаются как простое поле ввода, теги разделены пробелами

обрати внимание, что, согласно @packages/db/src/schema.ts nameLower должен приложением делаться. нужно хорошо это продумать. возможно нужен ValueObject или Entity

Пожалуйста:

- уточняй scope v0.3, чтобы он был маленьким;
- проверяй идеи против CONTEXT.md и существующих ADR;
- обновляй CONTEXT.md, если мы уточняем доменные термины;
- предлагай ADR только если решение трудно откатить и есть реальный trade-off;
- в конце создай @.scratch/v0.3/IMPLEMENTATION_PLAN.md
- после утверждения нарежь план на issues в .scratch/v0.3/issues/

---

/triage
Implement pongolinks v0.3 from .scratch/v0.3/IMPLEMENTATION_PLAN.md.

Use the local issues in .scratch/v0.3/issues/ as the implementation breakdown, in order:

1. 01-add-tag-contract-and-list-display.md
2. 02-create-bookmark-with-tags.md
3. 03-edit-bookmark-tags-with-replace-all.md
4. 04-harden-tag-name-normalization-and-errors.md

Respect AGENTS.md:

- Do not start a dev server.
- Do not deploy.
- Do not commit.
- UI text must be English.
- Code comments must be English.
- Use Result<T, E> for operational errors.
- Preserve vertical slice architecture.
- Keep frontend/backend changes inside the existing bookmarks slices unless the plan requires otherwise.

After implementation, verify with:
bun run typecheck
bun run agent:test
bun run format

Return a concise summary of changed behavior, tests run, and any unresolved risks.
