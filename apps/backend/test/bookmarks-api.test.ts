import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Bookmark API", () => {
  it("passes the Bun SQLite API smoke suite", () => {
    const result = spawnSync("bun", ["test/bookmarks-api-smoke.ts"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
    });

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("bookmark api smoke passed");
    expect(result.status).toBe(0);
  });

  it("keeps bookmark validation mapping inside the bookmarks slice", () => {
    const appSource = readFileSync(
      fileURLToPath(new URL("../src/app.ts", import.meta.url)),
      "utf8",
    );

    expect(appSource).not.toContain("bookmarkValidationErrorResponse");
    expect(appSource).not.toContain("validationErrorResponse");
  });
});
