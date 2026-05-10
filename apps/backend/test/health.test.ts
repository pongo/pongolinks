import { describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "@/app";

describe(`GET ${APP_BASE_PATH}/api/health`, () => {
  it("returns the backend liveness contract", async () => {
    const app = createApp();

    const response = await app.handle(new Request(`http://localhost${APP_BASE_PATH}/api/health`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
