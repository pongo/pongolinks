import { APP_BASE_PATH, createApp } from "#/app.ts";
import { createMigratedTestDb } from "#test/test-db.ts";

export type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

export const TEST_BASIC_AUTH_CREDENTIALS = "agent:secret";
export const TEST_BASIC_AUTH_HEADER = `Basic ${Buffer.from(TEST_BASIC_AUTH_CREDENTIALS).toString("base64")}`;

export function useTestBasicAuthCredentials() {
  process.env.BASIC_AUTH_CREDENTIALS = TEST_BASIC_AUTH_CREDENTIALS;
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    ...init,
    headers: {
      authorization: TEST_BASIC_AUTH_HEADER,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

export async function withApp(
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();

  try {
    useTestBasicAuthCredentials();

    await run({
      app: createApp({ db: database.db }),
      db: database.db,
    });
  } finally {
    database.close();
  }
}
