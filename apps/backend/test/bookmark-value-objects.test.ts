import { describe, expect, it } from "vitest";

import { BookmarkId } from "#/features/bookmarks/bookmark-id.ts";
import { BookmarkUrl } from "#/features/bookmarks/bookmark-url.ts";
import { TagName } from "#/features/bookmarks/tag-name.ts";

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

describe("BookmarkId", () => {
  it("accepts positive safe integer ids", () => {
    expect(BookmarkId.from("1").isOk).toBe(true);
    expect(BookmarkId.from(Number.MAX_SAFE_INTEGER).isOk).toBe(true);
  });

  it("rejects empty, non-numeric, zero, negative, and unsafe ids", () => {
    expect(BookmarkId.from("").isErr).toBe(true);
    expect(BookmarkId.from("abc").isErr).toBe(true);
    expect(BookmarkId.from(0).isErr).toBe(true);
    expect(BookmarkId.from(-1).isErr).toBe(true);
    expect(BookmarkId.from(Number.MAX_SAFE_INTEGER + 1).isErr).toBe(true);
  });
});

describe("TagName", () => {
  it("accepts non-empty names without whitespace", () => {
    expect(TagName.from("article").isOk).toBe(true);
    expect(TagName.from("lang-ru").isOk).toBe(true);
    expect(TagName.from("структуры-данных").isOk).toBe(true);
  });

  it("rejects empty and whitespace-containing names", () => {
    expect(TagName.from("").isErr).toBe(true);
    expect(TagName.from("   ").isErr).toBe(true);
    expect(TagName.from("two words").isErr).toBe(true);
  });

  it("computes nameLower with the app-level locale", () => {
    const result = TagName.from("Article");

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.nameLower()).toBe("article");
    }
  });
});
