import { describe, expect, it } from "vitest";

import { BookmarkUrl } from "./bookmark-url.ts";

describe("BookmarkUrl", () => {
  it.each([
    "http://example.com",
    "https://example.com/path",
    "https://example.com/path?q=1#section",
  ])("accepts absolute http/https URLs: %s", (input) => {
    const result = BookmarkUrl.from(input);

    expect(result.isOk).toBe(true);
  });

  it("trims whitespace and stores the trimmed value", () => {
    const result = BookmarkUrl.from("  https://example.com/path?q=1#x  ");

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.value()).toBe("https://example.com/path?q=1#x");
    }
  });

  it("preserves original URL text except trimming", () => {
    const input = " https://EXAMPLE.com/SomePath ";
    const result = BookmarkUrl.from(input);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.value()).toBe("https://EXAMPLE.com/SomePath");
    }
  });

  it.each([undefined, null, 123, true, {}, "", "   "])(
    "returns url_required for missing/invalid non-string input: %s",
    (input) => {
      const result = BookmarkUrl.from(input);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toBe("Bookmark URL is required");
        expect(result.error.code).toBe("bookmark.url_required");
        expect(result.error.status).toBe(400);
      }
    },
  );

  it.each(["/relative", "example.com", "https://", "http://[:::1]"])(
    "returns url_invalid for non-absolute or malformed URL: %s",
    (input) => {
      const result = BookmarkUrl.from(input);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toBe("Bookmark URL must be an absolute URL");
        expect(result.error.code).toBe("bookmark.url_invalid");
        expect(result.error.status).toBe(400);
      }
    },
  );

  it.each(["ftp://example.com", "file:///tmp/file.txt", "mailto:test@example.com"])(
    "returns url_invalid for unsupported protocol: %s",
    (input) => {
      const result = BookmarkUrl.from(input);

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.message).toBe("Bookmark URL must use http or https");
        expect(result.error.code).toBe("bookmark.url_invalid");
        expect(result.error.status).toBe(400);
      }
    },
  );

  it("returns url_invalid for any non-http/https custom scheme", () => {
    const result = BookmarkUrl.from("ws://example.com/socket");

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toBe("Bookmark URL must use http or https");
      expect(result.error.code).toBe("bookmark.url_invalid");
      expect(result.error.status).toBe(400);
    }
  });
});
