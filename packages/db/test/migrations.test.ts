import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("database migrations", () => {
  it("creates the v0.1 SQLite schema through bun:sqlite", () => {
    const result = spawnSync("bun", ["test/run-migrations-smoke.ts"], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      encoding: "utf8",
    });

    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});
