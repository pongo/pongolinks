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

  it("skips invalid URLs", () => {
    expect(
      collectBookmarkUrls({
        url: "not a url",
        relatedLinks: [{ id: 1, url: "ftp://example.com/file" }],
      }),
    ).toEqual([]);
  });
});
