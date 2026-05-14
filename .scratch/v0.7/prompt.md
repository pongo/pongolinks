grill
спланируй v0.7

First read:

- AGENTS.md
- CONTEXT.md
- docs/adr/0001-monorepo-with-single-backend-entrypoint.md
- docs/adr/0002-value-objects-for-validated-domain-primitives.md
- docs/adr/0003-evlog-wide-events-for-backend-observability.md
- .scratch/v0.1/IMPLEMENTATION_PLAN.md
- .scratch/v0.2/IMPLEMENTATION_PLAN.md
- .scratch/v0.3/IMPLEMENTATION_PLAN.md
- .scratch/v0.4/IMPLEMENTATION_PLAN.md
- .scratch/v0.5/IMPLEMENTATION_PLAN.md
- .scratch/v0.6/IMPLEMENTATION_PLAN.md

Goal:

работа над frontend:

1. хочется все используемые цвета (включая указанные классами tailwind) вынести в общее место
2. в @apps/frontend/src/features/bookmarks/BookmarkForm.vue текстовое поле для тегов с автокомплитом хочется выделить в отдельный компонент (но оставить его в рамках bookmarks)
3. внутри @apps/frontend/src/features/bookmarks/ хочется как-то "прибраться", сгруппировать код в папки
4. оба @api.apps/frontend/src/features/tags/api.ts @api.apps/frontend/src/features/bookmarks/api.ts стоит отрефакторить и выделить общий код в @apps/frontend/src/shared/api/client.ts, в частности вместо isRecord стоит использовать isResult из "@pongolinks/shared/result"

Please:

- clarify v0.7 scope so it stays small;
- challenge ideas against CONTEXT.md and existing ADRs;
- ask one question at a time and include your recommended answer;
- update CONTEXT.md inline if we clarify domain terms;
- propose an ADR only if the decision is hard to reverse, surprising without context, and has a real trade-off;
- create .scratch/v0.7/IMPLEMENTATION_PLAN.md after the scope is agreed;
- after I approve the plan, split it into issues under .scratch/v0.7/issues/;
- at the end of the Implementation Plan, include a one-line Conventional Commits commit message in English.
