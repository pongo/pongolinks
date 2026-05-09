- никогда не запускай dev сервер. никогда не делай deploy. никогда не делай git commit
- для проверки типов: bun run typecheck
- для тестов: bun run agent:test
- для форматирования: bun run format

- пользовательский интерфейс на английском языке

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.
