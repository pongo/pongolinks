$grill-with-docs
хочу спланировать v0.4

Context:

- v0.1 skeleton: .scratch/v0.1/IMPLEMENTATION_PLAN.md
- v0.2 basic Bookmark add/edit/list: .scratch/v0.2/IMPLEMENTATION_PLAN.md
- v0.3 Bookmark Tags plan: .scratch/v0.3/IMPLEMENTATION_PLAN.md
- domain language: CONTEXT.md
- ADRs:
  - docs/adr/0001-monorepo-with-single-backend-entrypoint.md
  - docs/adr/0002-value-objects-for-validated-domain-primitives.md
  - docs/adr/0003-evlog-wide-events-for-backend-observability.md

Цель:

добавить Related Links. они определяются так:

- после создания или редактирования закладки из ее описания извлекаются ссылки - это и есть related links
- для извлечения предлагаю использовать библиотеку autolinker https://github.com/gregjacobs/Autolinker.js
- у нее есть функция autolinker.link; в ее опциях нужно указать, что нам не нужно парсить email, phone, mention, hashtag
- а в списке закладок предлагаю использовать autolinker.link для отображения ссылок в описании закладок. в опциях библиотеки нужно обязательно включить sanitizeHtml
- после редактирования закладки нужно заново проверить ее описание и сравнить новый и старый список ссылок: новые ссылки добавить, удаленные -- удалить

Please:

- clarify v0.4 scope so it stays small;
- check ideas against CONTEXT.md and existing ADRs;
- update CONTEXT.md if we clarify domain terms;
- propose an ADR only if the decision is hard to reverse, surprising without context, and has a real trade-off;
- create .scratch/v0.4/IMPLEMENTATION_PLAN.md after the scope is agreed;
- after I approve the plan, split it into issues under .scratch/v0.4/issues/;
- at the end of the Implementation Plan, include a one-line Conventional Commits commit message in English.

---

$triage
Use .scratch/v0.4/IMPLEMENTATION_PLAN.md as the approved plan.

Implement pongolinks v0.4 Related Links by working through the issues under .scratch/v0.4/issues/ in order:

1. 01-add-related-link-contract-extraction-and-db-invariant.md
2. 02-create-and-list-bookmarks-with-related-links.md
3. 03-synchronize-related-links-by-diff-on-edit.md
4. 04-autolink-bookmark-descriptions-in-frontend.md

Follow AGENTS.md:

- vertical slice architecture;
- Bun workspaces + Turborepo;
- Result<T, E> for operational errors;
- English code comments;
- English UI text;
- never run dev server;
- never deploy;
- never git commit.

Important v0.4 decisions:

- Related Links are automatically extracted from Bookmark descriptions.
- Persist only explicit http:// and https:// URLs.
- Use Autolinker.parse on backend for extraction.
- Use Autolinker.link on frontend for display with sanitizeHtml: true.
- Disable email, phone, mention, and hashtag parsing.
- Related Links are unique per Bookmark by exact URL string.
- Add DB unique invariant for related_links(bookmark_id, url).
- On edit, synchronize by diff: insert new URLs, delete removed URLs, preserve unchanged row ids.
- Do not add manual Related Link UI or separate Related Link endpoints.
- Do not create an ADR unless a new hard-to-reverse trade-off appears.

After implementation, run:
bun run typecheck
bun run agent:test
bun run format

Report changed files, verification results, and any migration notes. Do not commit.
