import { describe, expect, it } from "vitest";

import { runBackendSmokeSuite } from "../../../test/smoke-suite";

describe("Tag API", () => {
  it("passes the Bun/Elysia API smoke suite", () => {
    const result = runBackendSmokeSuite("src/features/tags/tags-api-smoke.ts");

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("tag api smoke passed");
    expect(result.status).toBe(0);
  });
});
