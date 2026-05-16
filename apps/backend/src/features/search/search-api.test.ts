import { describe, expect, it } from "vitest";

import { runBackendSmokeSuite } from "#test/smoke-suite.ts";

describe("Search API", () => {
  it("passes the Bun/Elysia API smoke suite", () => {
    const result = runBackendSmokeSuite("src/features/search/search-api-smoke.ts");

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("search api smoke passed");
    expect(result.status).toBe(0);
  });
});
