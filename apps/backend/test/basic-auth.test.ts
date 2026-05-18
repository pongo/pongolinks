import { describe, expect, it } from "vitest";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { TEST_BASIC_AUTH_CREDENTIALS, TEST_BASIC_AUTH_HEADER } from "#test/api-smoke-support.ts";

function healthRequest(authorization?: string) {
  return new Request(`http://localhost${APP_BASE_PATH}/api/health`, {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("basic auth", () => {
  it("requires BASIC_AUTH_CREDENTIALS at app creation", () => {
    const previousCredentials = process.env.BASIC_AUTH_CREDENTIALS;
    delete process.env.BASIC_AUTH_CREDENTIALS;

    try {
      expect(() => createApp()).toThrow("BASIC_AUTH_CREDENTIALS must be set");
    } finally {
      if (previousCredentials === undefined) {
        delete process.env.BASIC_AUTH_CREDENTIALS;
      } else {
        process.env.BASIC_AUTH_CREDENTIALS = previousCredentials;
      }
    }
  });

  it("rejects requests without credentials", async () => {
    process.env.BASIC_AUTH_CREDENTIALS = TEST_BASIC_AUTH_CREDENTIALS;
    const app = createApp();

    const response = await app.handle(healthRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe('Basic realm="pongolinks"');
  });

  it("rejects requests with invalid credentials", async () => {
    process.env.BASIC_AUTH_CREDENTIALS = TEST_BASIC_AUTH_CREDENTIALS;
    const app = createApp();
    const invalidHeader = `Basic ${Buffer.from("agent:wrong").toString("base64")}`;

    const response = await app.handle(healthRequest(invalidHeader));

    expect(response.status).toBe(401);
  });

  it("accepts requests with valid credentials", async () => {
    process.env.BASIC_AUTH_CREDENTIALS = TEST_BASIC_AUTH_CREDENTIALS;
    const app = createApp();

    const response = await app.handle(healthRequest(TEST_BASIC_AUTH_HEADER));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
