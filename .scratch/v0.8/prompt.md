спланируй v0.8

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
- .scratch/v0.7/IMPLEMENTATION_PLAN.md

Goal:

@apps/backend/src/features/bookmarks/routes.ts использует встроенную в elysiajs валидацию для транспортного уровня

нужно разобраться с валидацией в @apps/backend/src/features/bookmarks/bookmark-validation.ts — здесь используется ручная валидация. хотелось бы переделать или на import { t } from 'elysia' или на какой-нибудь zod

документация: https://elysiajs.com/patterns/typebox.html

Please:

- clarify v0.8 scope so it stays small;
- challenge ideas against CONTEXT.md and existing ADRs;
- ask one question at a time and include your recommended answer;
- update CONTEXT.md inline if we clarify domain terms;
- propose an ADR only if the decision is hard to reverse, surprising without context, and has a real trade-off;
- create .scratch/v0.8/IMPLEMENTATION_PLAN.md after the scope is agreed;
- after I approve the plan, split it into issues under .scratch/v0.8/issues/;
- at the end of the Implementation Plan, include a one-line Conventional Commits commit message in English.
