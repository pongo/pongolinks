import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { count, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { authSessions } from "@pongolinks/db/schema";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { TEST_AUTH_PASSWORD, loginTestUser, useTestAuthPassword } from "#test/api-smoke-support.ts";
import { createMigratedTestDb } from "#test/test-db.ts";

const tempFrontendDistPath = mkdtempSync(join(tmpdir(), "pongolinks-auth-frontend-dist-"));

function apiHealthRequest(cookie?: string) {
  return new Request(`http://localhost${APP_BASE_PATH}/api/health`, {
    headers: cookie ? { cookie } : undefined,
  });
}

function loginRequest(options: { password: string; next?: string }) {
  return new Request(`http://localhost${APP_BASE_PATH}/login`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      password: options.password,
      next: options.next ?? `${APP_BASE_PATH}/`,
    }),
  });
}

describe("cookie auth", () => {
  afterEach(() => {
    rmSync(tempFrontendDistPath, { force: true, recursive: true });
  });

  it("requires AUTH_PASSWORD at app creation", () => {
    const previousPassword = process.env.AUTH_PASSWORD;
    delete process.env.AUTH_PASSWORD;

    try {
      expect(() => createApp()).toThrow("AUTH_PASSWORD must be set");
      process.env.AUTH_PASSWORD = "   ";
      expect(() => createApp()).toThrow("AUTH_PASSWORD must be set");
    } finally {
      if (previousPassword === undefined) {
        delete process.env.AUTH_PASSWORD;
      } else {
        process.env.AUTH_PASSWORD = previousPassword;
      }
    }
  });

  it("returns 401 for unauthenticated API requests", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });

      const response = await app.handle(apiHealthRequest());

      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        isErr: true,
        error: {
          code: "auth.unauthorized",
          message: "Authentication required",
        },
      });
    } finally {
      database.close();
    }
  });

  it("redirects unauthenticated page requests to login with a safe next path", async () => {
    useTestAuthPassword();
    mkdirSync(tempFrontendDistPath, { recursive: true });
    writeFileSync(
      join(tempFrontendDistPath, "index.html"),
      "<!doctype html><html><body>App</body></html>",
    );
    const app = createApp({
      frontendDistPath: tempFrontendDistPath,
      serveFrontend: true,
    });

    const response = await app.handle(
      new Request(`http://localhost${APP_BASE_PATH}/bookmarks/future?tag=sqlite`),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      `${APP_BASE_PATH}/login?next=%2Fpl%2Fbookmarks%2Ffuture%3Ftag%3Dsqlite`,
    );

    const rootResponse = await app.handle(new Request(`http://localhost${APP_BASE_PATH}/`));

    expect(rootResponse.status).toBe(302);
    expect(rootResponse.headers.get("location")).toBe(`${APP_BASE_PATH}/login?next=%2Fpl%2F`);
  });

  it("serves the login page without a session", async () => {
    useTestAuthPassword();
    const app = createApp();

    const response = await app.handle(new Request(`http://localhost${APP_BASE_PATH}/login`));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain('name="password"');
  });

  it("redirects authenticated login page requests to the safe next path", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });
      const cookie = await loginTestUser(app);

      const response = await app.handle(
        new Request(`http://localhost${APP_BASE_PATH}/login?next=%2Fpl%2F`, {
          headers: {
            cookie,
          },
        }),
      );

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(`${APP_BASE_PATH}/`);
    } finally {
      database.close();
    }
  });

  it("rejects an invalid password without setting a session cookie", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });

      const response = await app.handle(loginRequest({ password: "wrong" }));

      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(await response.text()).toContain("Invalid password");
    } finally {
      database.close();
    }
  });

  it("creates a persistent session cookie for a valid password", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });

      const response = await app.handle(
        loginRequest({ password: TEST_AUTH_PASSWORD, next: `${APP_BASE_PATH}/tags` }),
      );
      const sessionCount = await database.db.select({ value: count() }).from(authSessions).get();

      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe(`${APP_BASE_PATH}/tags`);
      expect(response.headers.get("set-cookie")).toContain("pongolinks_session=");
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
      expect(response.headers.get("set-cookie")).toContain(`Path=${APP_BASE_PATH}/`);
      expect(sessionCount?.value).toBe(1);
    } finally {
      database.close();
    }
  });

  it("accepts API requests with a valid session cookie", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });
      const cookie = await loginTestUser(app);

      const response = await app.handle(apiHealthRequest(cookie));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: "ok" });
    } finally {
      database.close();
    }
  });

  it("rejects and deletes expired sessions", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });
      const cookie = await loginTestUser(app);
      const session = await database.db.query.authSessions.findFirst();

      expect(session).toBeTruthy();

      await database.db
        .update(authSessions)
        .set({ expiresAt: "2000-01-01 00:00:00" })
        .where(eq(authSessions.id, session!.id))
        .run();

      const response = await app.handle(apiHealthRequest(cookie));
      const sessionCount = await database.db.select({ value: count() }).from(authSessions).get();

      expect(response.status).toBe(401);
      expect(sessionCount?.value).toBe(0);
    } finally {
      database.close();
    }
  });

  it("falls back to the app root for unsafe next values", async () => {
    const database = await createMigratedTestDb();

    try {
      useTestAuthPassword();
      const app = createApp({ db: database.db });

      const absoluteResponse = await app.handle(
        loginRequest({ password: TEST_AUTH_PASSWORD, next: "https://example.com/" }),
      );
      const protocolRelativeResponse = await app.handle(
        loginRequest({ password: TEST_AUTH_PASSWORD, next: "//example.com/" }),
      );

      expect(absoluteResponse.headers.get("location")).toBe(`${APP_BASE_PATH}/`);
      expect(protocolRelativeResponse.headers.get("location")).toBe(`${APP_BASE_PATH}/`);
    } finally {
      database.close();
    }
  });
});
