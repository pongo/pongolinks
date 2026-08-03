import { describe, expect, it } from "vitest";

import { collectBookmarkUrls } from "./url-check-cache.ts";

describe("collectBookmarkUrls", () => {
  it("deduplicates bookmark and related link URLs", () => {
    expect(
      collectBookmarkUrls(
        {
          url: "https://example.com",
          relatedLinks: [{ id: 1, url: "https://example.com/docs" }],
        },
        {
          url: "https://example.com",
          relatedLinks: [{ id: 2, url: "https://example.com/docs" }],
        },
      ),
    ).toEqual(["https://example.com", "https://example.com/docs"]);
  });
});
