import { APP_BASE_PATH, createApp } from "#/app.ts";
import { createMigratedTestDb } from "#test/test-db.ts";

export type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
}

export async function withApp(
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();

  try {
    await run({
      app: createApp({ db: database.db }),
      db: database.db,
    });
  } finally {
    database.close();
  }
}
