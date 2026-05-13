[$grill-with-docs](C:\Users\pavel\Documents\Projects\pongolinks.agents\skills\grill-with-docs\SKILL.md) Хочу спланировать v0.2 для pongolinks.

Контекст:

- v0.1 уже должен быть тонким runnable skeleton по `.scratch/v0.1/IMPLEMENTATION_PLAN.md`;
- доменный язык в `CONTEXT.md`;
- архитектурное решение про monorepo/backend entrypoint в `docs/adr/0001-monorepo-with-single-backend-entrypoint.md`;
- issues v0.1 лежат в `.scratch/v0.1/issues/`;
- схема БД и миграции живут в `packages/db`;
- frontend/backend используют vertical slices.

Цель v0.2:

- добавление/редактирование закладки
- отображение списка закладок

backend:

- хочу использовать wide events при помощи evlog (пока что без интеграции с axiom) @docs/vendor/evlog/wide-events.md @docs/vendor/evlog/elysia.md

frontend:

- используется tailwindcss 4

Пожалуйста:

- уточняй scope v0.2, чтобы он был маленьким;
- обновляй `CONTEXT.md`, если мы уточняем доменные термины;
- предложи ADR только если решение реально трудно откатить;
- в конце создай `.scratch/v0.2/IMPLEMENTATION_PLAN.md`;
- после утверждения нарежь план на issues в `.scratch/v0.2/issues/`;

---

Используй AGENTS.md и реализуй pongolinks v0.2 по .scratch/v0.2/IMPLEMENTATION_PLAN.md.

Работай по issues в .scratch/v0.2/issues/ в порядке зависимостей:

1. 01-add-bookmark-backend-foundation.md
2. 02-create-bookmark-through-api.md
3. 03-list-bookmarks-through-api-and-frontend-home.md
4. 04-edit-bookmark-through-api-and-form-route.md
5. 05-finish-observability-and-verification-pass.md

Важные ограничения:

- не запускай dev server;
- не делай deploy;
- не делай git commit;
- UI text на английском;
- code comments на английском;
- operational errors через Result, не throw;
- используй Value Objects согласно docs/adr/0002-value-objects-for-validated-domain-primitives.md;
- используй evlog wide events согласно docs/adr/0003-evlog-wide-events-for-backend-observability.md;
- Tailwind CSS 4 подключай через @tailwindcss/vite;
- не добавляй out-of-scope функции: tags, related links, search, pagination, delete, metadata fetching, toasts, optimistic UI.

После реализации проверь:

- bun run typecheck
- bun run agent:test
- bun run format

[IMPLEMENTATION_PLAN.md](.scratch/v0.2/IMPLEMENTATION_PLAN.md) [issues](.scratch/v0.2/issues) [0002-value-objects-for-validated-domain-primitives.md](docs/adr/0002-value-objects-for-validated-domain-primitives.md) [0003-evlog-wide-events-for-backend-observability.md](docs/adr/0003-evlog-wide-events-for-backend-observability.md)
