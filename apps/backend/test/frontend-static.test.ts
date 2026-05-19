import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { TEST_BASIC_AUTH_HEADER, useTestBasicAuthCredentials } from "#test/api-smoke-support.ts";

const tempDir = fileURLToPath(new URL(".tmp/frontend-dist", import.meta.url));

function authenticatedRequest(url: string) {
  return new Request(url, {
    headers: {
      authorization: TEST_BASIC_AUTH_HEADER,
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

    useTestBasicAuthCredentials();

    const app = createApp({
      frontendDistPath: tempDir,
      serveFrontend: true,
    });

    const healthResponse = await app.handle(
      authenticatedRequest(`http://localhost${APP_BASE_PATH}/api/health`),
    );
    const fallbackResponse = await app.handle(
      authenticatedRequest(`http://localhost${APP_BASE_PATH}/bookmarks/future`),
    );
    const assetResponse = await app.handle(
      authenticatedRequest(`http://localhost${APP_BASE_PATH}/assets/index-test.js`),
    );
    const missingAssetResponse = await app.handle(
      authenticatedRequest(`http://localhost${APP_BASE_PATH}/assets/missing.js`),
    );
    const oldApiResponse = await app.handle(new Request("http://localhost/api/health"));
    const rootResponse = await app.handle(new Request("http://localhost/"));

    expect(healthResponse.status).toBe(200);
    expect(await healthResponse.json()).toEqual({ status: "ok" });
    expect(fallbackResponse.status).toBe(200);
    expect(await fallbackResponse.text()).toContain('<div id="app"></div>');
    expect(assetResponse.status).toBe(200);
    expect(assetResponse.headers.get("content-type")).toContain("text/javascript");
    expect(await assetResponse.text()).toContain("asset loaded");
    expect(missingAssetResponse.status).toBe(404);
    expect(await missingAssetResponse.json()).toEqual({ error: "Not Found" });
    expect(oldApiResponse.status).not.toBe(200);
    expect(rootResponse.status).not.toBe(200);
  });
});
