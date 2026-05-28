import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { loginTestUser, useTestAuthPassword } from "#test/api-smoke-support.ts";
import { createMigratedTestDb } from "#test/test-db.ts";

const tempDir = fileURLToPath(new URL(".tmp/frontend-dist", import.meta.url));

function authenticatedRequest(url: string, cookie: string, init?: RequestInit) {
  return new Request(url, {
    ...init,
    headers: {
      cookie,
      ...init?.headers,
    },
  });
}

describe("production frontend serving", () => {
  afterEach(() => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  it("keeps API routes and falls back non-API routes to the SPA", async () => {
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(join(tempDir, "assets"), { recursive: true });
    writeFileSync(
      join(tempDir, "index.html"),
      '<!doctype html><html><body><div id="app"></div><script type="module" src="/pl/assets/index-test.js"></script></body></html>',
    );
    writeFileSync(join(tempDir, "assets", "index-test.js"), "console.log('asset loaded');\n");
    writeFileSync(join(tempDir, "favicon.ico"), "favicon");

    useTestAuthPassword();
    const database = await createMigratedTestDb();

    try {
      const app = createApp({
        db: database.db,
        frontendDistPath: tempDir,
        serveFrontend: true,
      });
      const cookie = await loginTestUser(app);

      const healthResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/api/health`, cookie),
      );
      const fallbackResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/bookmarks/future`, cookie),
      );
      const assetResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/assets/index-test.js`, cookie),
      );
      const faviconResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/favicon.ico`, cookie),
      );
      const missingAssetResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/assets/missing.js`, cookie),
      );
      const oldApiResponse = await app.handle(new Request("http://localhost/api/health"));
      const rootResponse = await app.handle(new Request("http://localhost/"));

      expect(healthResponse.status).toBe(200);
      expect(await healthResponse.json()).toEqual({ status: "ok" });
      expect(fallbackResponse.status).toBe(200);
      expect(await fallbackResponse.text()).toContain('<div id="app"></div>');
      expect(fallbackResponse.headers.get("cache-control")).toBe("no-cache");
      expect(fallbackResponse.headers.get("last-modified")).toBeTruthy();
      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get("content-type")).toContain("text/javascript");
      expect(assetResponse.headers.get("cache-control")).toBe(
        "public, max-age=31536000, immutable",
      );
      expect(assetResponse.headers.get("last-modified")).toBeTruthy();
      expect(await assetResponse.text()).toContain("asset loaded");
      expect(faviconResponse.status).toBe(200);
      expect(faviconResponse.headers.get("content-type")).toContain("image/x-icon");
      expect(faviconResponse.headers.get("cache-control")).toBe("public, no-cache");
      expect(faviconResponse.headers.get("last-modified")).toBeTruthy();
      expect(missingAssetResponse.status).toBe(404);
      expect(await missingAssetResponse.json()).toEqual({ error: "Not Found" });
      expect(oldApiResponse.status).not.toBe(200);
      expect(rootResponse.status).not.toBe(200);
    } finally {
      database.close();
    }
  });

  it("revalidates frontend static files with Last-Modified", async () => {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(join(tempDir, "index.html"), "<!doctype html><html><body>App</body></html>");
    writeFileSync(join(tempDir, "favicon.ico"), "favicon");

    useTestAuthPassword();
    const database = await createMigratedTestDb();

    try {
      const app = createApp({
        db: database.db,
        frontendDistPath: tempDir,
        serveFrontend: true,
      });
      const cookie = await loginTestUser(app);

      const firstResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/favicon.ico`, cookie),
      );
      const lastModified = firstResponse.headers.get("last-modified");

      expect(firstResponse.status).toBe(200);
      expect(lastModified).toBeTruthy();

      const revalidatedResponse = await app.handle(
        authenticatedRequest(`http://localhost${APP_BASE_PATH}/favicon.ico`, cookie, {
          headers: {
            "if-modified-since": lastModified!,
          },
        }),
      );

      expect(revalidatedResponse.status).toBe(304);
      expect(await revalidatedResponse.text()).toBe("");
      expect(revalidatedResponse.headers.get("cache-control")).toBe("public, no-cache");
      expect(revalidatedResponse.headers.get("last-modified")).toBe(lastModified);
    } finally {
      database.close();
    }
  });
});
