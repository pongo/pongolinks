import { describe, expect, it } from "vitest";

import { BookmarkId } from "./bookmark-id.ts";

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
