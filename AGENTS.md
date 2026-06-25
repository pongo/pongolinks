- проект использует архитектуру вертикальных срезов
- монорепа bun workspaces и turborepo
- See `/docs/architecture.md` for the project-wide architecture rules, import boundaries, error handling policy, and verification commands

- apps/backend — Bun/Elysia server
- apps/frontend — Vue SPA with Elysia Eden
- packages/db — drizzle orm (sqlite)

- никогда не запускай dev сервер. никогда не делай deploy. никогда не делай git commit
- для проверки типов: bun run typecheck
- для тестов: bun run agent:test
- финальная проверка: `bun run typecheck && bun run agent:test`

- пользовательский интерфейс на английском языке

## Code comments

- Write comments for complex or non-trivial code where the intent is not immediately obvious. Explain why something is done, important assumptions, invariants, edge cases, and trade-offs. Avoid comments that simply describe what the code does when that is already clear from the code itself.

## Error handling

This project uses a Rust-style Result pattern for operational errors.

- Do NOT throw exceptions for operational (expected) errors.
- Use `Result<T, E>` instead.
- Throw exceptions for programmer errors, failed invariants, and test assertions.

### Example

```ts
import { Ok, Err, type Result } from "@pongolinks/shared/result";

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.findUser(id);
    if (!user) return Err("user not found", { id });
    return Ok(user);
  } catch (error) {
    return Err(`fetchUser failed: ${(error as Error).message}`, { error });
  }
}

const userResult = await fetchUser(id);
if (userResult.isErr) {
  logger.error(userResult.error.message, userResult.error.data);
  return res.json({ ok: false, error: userResult.error });
}

const user = userResult.value;
res.json({ ok: true, user });
```

## Import boundaries

- Relative imports are allowed only within the same vertical slice/module.
- Imports that cross feature, app-infrastructure, or shared-layer boundaries must use an alias or workspace package import.
- In app source code, use `#/...` for app-local cross-boundary imports, for example `#/http/result-response.ts`, `#/db/app-db.ts`, `#/features/tags/api.ts`.
- In monorepo package boundaries, use workspace package imports, for example `@pongolinks/shared/result` or `@pongolinks/db/schema`.
- Do not import another feature's private internals through deep relative paths. If cross-feature access is needed, import via the feature's public API/entrypoint when one exists.

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.
