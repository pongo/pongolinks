import { describe, expect, it } from "vitest";

import { BookmarkUrl } from "./bookmark-url.ts";

describe("BookmarkUrl", () => {
  it("accepts trimmed absolute http and https URLs", () => {
    expect(BookmarkUrl.from(" https://example.com/path ").isOk).toBe(true);
    expect(BookmarkUrl.from("http://example.com").isOk).toBe(true);
  });

  it("rejects empty, relative, and non-http URLs", () => {
    expect(BookmarkUrl.from("").isErr).toBe(true);
    expect(BookmarkUrl.from("/relative").isErr).toBe(true);
    expect(BookmarkUrl.from("ftp://example.com").isErr).toBe(true);
  });
});
