import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "@/app";

const tempDir = fileURLToPath(new URL(".tmp/frontend-dist", import.meta.url));

describe("production frontend serving", () => {
  afterEach(() => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  it("keeps API routes and falls back non-API routes to the SPA", async () => {
    mkdirSync(tempDir, { recursive: true });
    writeFileSync(
      join(tempDir, "index.html"),
      '<!doctype html><html><body><div id="app"></div></body></html>',
    );

    const app = createApp({
      frontendDistPath: tempDir,
      serveFrontend: true,
    });

    const healthResponse = await app.handle(
      new Request(`http://localhost${APP_BASE_PATH}/api/health`),
    );
    const fallbackResponse = await app.handle(
      new Request(`http://localhost${APP_BASE_PATH}/bookmarks/future`),
    );
    const oldApiResponse = await app.handle(new Request("http://localhost/api/health"));
    const rootResponse = await app.handle(new Request("http://localhost/"));

    expect(healthResponse.status).toBe(200);
    expect(await healthResponse.json()).toEqual({ status: "ok" });
    expect(fallbackResponse.status).toBe(200);
    expect(await fallbackResponse.text()).toContain('<div id="app"></div>');
    expect(oldApiResponse.status).not.toBe(200);
    expect(rootResponse.status).not.toBe(200);
  });
});
