import { describe, expect, it } from "vitest";

import { runBackendSmokeSuite } from "../../../test/smoke-suite";

function runSmokeSuite(fileName: string, expectedOutput: string) {
  const result = runBackendSmokeSuite(`src/features/bookmarks/${fileName}`);

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
