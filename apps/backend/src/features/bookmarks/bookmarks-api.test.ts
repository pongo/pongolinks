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

function runSmokeSuite(fileName: string, expectedOutput: string) {
  const result = spawnSync("bun", ["--no-env-file", `src/features/bookmarks/${fileName}`], {
    cwd: fileURLToPath(new URL("../../..", import.meta.url)),
    encoding: "utf8",
    env: smokeSuiteEnv(),
  });

  expect(result.stderr).toBe("");
  expect(result.stdout).toContain(expectedOutput);
  expect(result.status).toBe(0);
}

describe("Bookmark API", () => {
  it("passes the Bun/Elysia create API smoke suite", () => {
    runSmokeSuite("bookmarks-create-api-smoke.ts", "bookmark create api smoke passed");
  });

  it("passes the Bun/Elysia list/get API smoke suite", () => {
    runSmokeSuite("bookmarks-list-get-api-smoke.ts", "bookmark list/get api smoke passed");
  });

  it("passes the Bun/Elysia update API smoke suite", () => {
    runSmokeSuite("bookmarks-update-api-smoke.ts", "bookmark update api smoke passed");
  });

  it("passes the Bun/Elysia delete API smoke suite", () => {
    runSmokeSuite("bookmarks-delete-api-smoke.ts", "bookmark delete api smoke passed");
  });
});
