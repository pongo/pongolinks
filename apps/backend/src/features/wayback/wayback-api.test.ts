import { describe, expect, it } from "vitest";

import { runBackendSmokeSuite } from "#test/smoke-suite.ts";

describe("Wayback API", () => {
  it("passes the Bun/Elysia wayback availability API smoke suite", () => {
    const result = runBackendSmokeSuite("src/features/wayback/wayback-api-smoke.ts");

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("wayback api smoke passed");
    expect(result.status).toBe(0);
  });
});
