import { describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { TEST_BASIC_AUTH_HEADER, useTestBasicAuthCredentials } from "#test/api-smoke-support.ts";

describe(`GET ${APP_BASE_PATH}/api/health`, () => {
  it("returns the backend liveness contract", async () => {
    useTestBasicAuthCredentials();
    const app = createApp();

    const response = await app.handle(
      new Request(`http://localhost${APP_BASE_PATH}/api/health`, {
        headers: {
          authorization: TEST_BASIC_AUTH_HEADER,
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
