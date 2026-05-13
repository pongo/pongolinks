- проект использует архитектуру вертикальных срезов
- монорепа bun workspaces и turborepo

- apps/backend — Bun/Elysia server
- apps/frontend — Vue SPA with Elysia Eden
- packages/db — drizzle orm (sqlite)

- никогда не запускай dev сервер. никогда не делай deploy. никогда не делай git commit
- для проверки типов: bun run typecheck
- для тестов: bun run agent:test
- для форматирования: bun run format

- пользовательский интерфейс на английском языке
- комментарии в коде пиши на английском языке.

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

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.
