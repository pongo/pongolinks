import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Bookmark editor characterization", () => {
  it("passes the Bun SQLite bookmark write characterization suite", () => {
    const result = spawnSync(
      "bun",
      ["apps/backend/src/features/bookmarks/bookmark-editor-characterization.ts"],
      {
        cwd: fileURLToPath(new URL("../../../../..", import.meta.url)),
        encoding: "utf8",
      },
    );

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("bookmark editor characterization passed");
    expect(result.status).toBe(0);
  });
});
