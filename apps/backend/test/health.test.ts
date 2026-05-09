import { describe, expect, it } from "vitest";

import { createApp } from "@/app";

describe("GET /api/health", () => {
  it("returns the backend liveness contract", async () => {
    const app = createApp();

    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
