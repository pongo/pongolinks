import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Bookmark API", () => {
  it("passes the Bun SQLite API smoke suite", () => {
    const result = spawnSync("bun", ["src/features/bookmarks/bookmarks-api-smoke.ts"], {
      cwd: fileURLToPath(new URL("../../..", import.meta.url)),
      encoding: "utf8",
    });

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("bookmark api smoke passed");
    expect(result.status).toBe(0);
  });
});
