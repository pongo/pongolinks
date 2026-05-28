import { describe, expect, it } from "vitest";

import { APP_BASE_PATH } from "#/app.ts";
import { request, withApp } from "#test/api-smoke-support.ts";

describe(`GET ${APP_BASE_PATH}/api/health`, () => {
  it("returns the backend liveness contract", async () => {
    await withApp(async ({ app }) => {
      const response = await app.handle(request("/api/health"));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ status: "ok" });
    });
  });
});
