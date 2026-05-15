import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function smokeSuiteEnv() {
  const {
    AXIOM_API_KEY: _axiomApiKey,
    AXIOM_DATASET: _axiomDataset,
    AXIOM_TOKEN: _axiomToken,
    ...env
  } = process.env;

  return {
    ...env,
    NODE_ENV: "test",
  };
}

describe("Tag API", () => {
  it("passes the Bun/Elysia API smoke suite", () => {
    const result = spawnSync("bun", ["--no-env-file", "src/features/tags/tags-api-smoke.ts"], {
      cwd: fileURLToPath(new URL("../../..", import.meta.url)),
      encoding: "utf8",
      env: smokeSuiteEnv(),
    });

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("tag api smoke passed");
    expect(result.status).toBe(0);
  });
});
