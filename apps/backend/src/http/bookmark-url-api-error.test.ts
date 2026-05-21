import { describe, expect, it } from "vitest";

import { parseBookmarkUrl } from "./bookmark-url-api-error.ts";

describe("parseBookmarkUrl", () => {
  it("maps missing Bookmark URL domain errors to API errors", () => {
    const result = parseBookmarkUrl("");

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toBe("Bookmark URL is required");
      expect(result.error.code).toBe("bookmark.url_required");
      expect(result.error.status).toBe(400);
    }
  });

  it("maps invalid Bookmark URL domain errors to API errors", () => {
    const result = parseBookmarkUrl("ftp://example.com");

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toBe("Bookmark URL must use http or https");
      expect(result.error.code).toBe("bookmark.url_invalid");
      expect(result.error.status).toBe(400);
    }
  });
});
