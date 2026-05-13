[$grill-with-docs](C:\Users\pavel\Documents\Projects\pongolinks.agents\skills\grill-with-docs\SKILL.md)
хочу спланировать v0.5

Context:

- domain language: CONTEXT.md
- ADRs:
  - docs/adr/0001-monorepo-with-single-backend-entrypoint.md
  - docs/adr/0002-value-objects-for-validated-domain-primitives.md
  - docs/adr/0003-evlog-wide-events-for-backend-observability.md
- previous plans:
  - .scratch/v0.1/IMPLEMENTATION_PLAN.md
  - .scratch/v0.2/IMPLEMENTATION_PLAN.md
  - .scratch/v0.3/IMPLEMENTATION_PLAN.md
  - .scratch/v0.4/IMPLEMENTATION_PLAN.md

Цель:

добавить немного работы с тегами:

- сейчас при редактировании закладки используется replace-all для тегов. я хочу, чтобы для тегов был diff.
- и нужно добавить лог по аналогии с syncRelatedLinks

Please:

- first read the domain docs, ADRs, and previous implementation plans;
- clarify v0.5 scope so it stays small;
- challenge ideas against CONTEXT.md and existing ADRs;
- ask one question at a time and include your recommended answer;
- update CONTEXT.md inline if we clarify domain terms;
- propose an ADR only if the decision is hard to reverse, surprising without context, and has a real trade-off;
- create .scratch/v0.5/IMPLEMENTATION_PLAN.md after the scope is agreed;
- after I approve the plan, split it into issues under .scratch/v0.5/issues/;
- at the end of the Implementation Plan, include a one-line Conventional Commits commit message in English.

---

Implement pongolinks v0.5 from the approved plan.

Read first:

- CONTEXT.md
- docs/adr/0001-monorepo-with-single-backend-entrypoint.md
- docs/adr/0002-value-objects-for-validated-domain-primitives.md
- docs/adr/0003-evlog-wide-events-for-backend-observability.md
- .scratch/v0.5/IMPLEMENTATION_PLAN.md
- .scratch/v0.5/issues/\*.md

Scope:

- Backend-only.
- Replace Bookmark edit Tag replace-all behavior with diff-style synchronization.
- Delete detached Tags that become orphaned.
- Add the agreed Tag diff evlog context.
- Do not change API payloads, DTOs, or frontend UI.
- Do not run a dev server, deploy, or commit.

Follow project rules:

- Use Result<T, E> for operational errors.
- Code comments in English.
- UI text stays English if touched, but frontend should not be touched unless tests require type updates.
- Architecture is vertical slices.
- Monorepo uses bun workspaces and turborepo.

Verification:

- bun run typecheck
- bun run agent:test
- bun run format
