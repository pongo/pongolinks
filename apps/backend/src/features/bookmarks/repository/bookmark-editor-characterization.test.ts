import { describe, expect, it } from "vitest";

import { runBookmarkEditorCharacterization } from "./bookmark-editor-characterization";

describe("Bookmark editor characterization", () => {
  it("passes the bookmark write characterization suite", async () => {
    await expect(runBookmarkEditorCharacterization()).resolves.toBeUndefined();
  });
});
