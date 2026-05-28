import { APP_BASE_PATH, createApp } from "#/app.ts";
import { createMigratedTestDb } from "#test/test-db.ts";

export type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

export const TEST_AUTH_PASSWORD = "secret";

let currentSessionCookie: string | undefined;

export function useTestAuthPassword() {
  process.env.AUTH_PASSWORD = TEST_AUTH_PASSWORD;
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function loginTestUser(app: ReturnType<typeof createApp>) {
  const response = await app.handle(
    new Request(`http://localhost${APP_BASE_PATH}/login`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        password: TEST_AUTH_PASSWORD,
        next: `${APP_BASE_PATH}/`,
      }),
    }),
  );

  assert(response.status === 302, "Expected test login to redirect");

  const setCookie = response.headers.get("set-cookie");
  assert(setCookie, "Expected test login to set a session cookie");

  const sessionCookie = setCookie.split(";")[0];
  assert(sessionCookie, "Expected test login to include a session cookie value");

  return sessionCookie;
}

export function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    ...init,
    headers: {
      ...(currentSessionCookie ? { cookie: currentSessionCookie } : {}),
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

export async function withApp(
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();
  const previousSessionCookie = currentSessionCookie;

  try {
    useTestAuthPassword();
    const app = createApp({ db: database.db });
    currentSessionCookie = await loginTestUser(app);

    await run({
      app,
      db: database.db,
    });
  } finally {
    currentSessionCookie = previousSessionCookie;
    database.close();
  }
}
