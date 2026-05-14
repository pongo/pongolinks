import { describe, expect, it } from "vitest";

import { extractRelatedLinks } from "./extract-related-links.ts";

describe("extractRelatedLinks", () => {
  it("returns only explicit http and https URLs", () => {
    expect(
      extractRelatedLinks(
        "See http://example.com/a and https://example.com/b but not ftp://example.com/c",
      ),
    ).toEqual(["http://example.com/a", "https://example.com/b"]);
  });

  it("ignores bare domains, emails, phone numbers, mentions, and hashtags", () => {
    expect(
      extractRelatedLinks("example.com test@example.com +1 555 123 4567 @example #example"),
    ).toEqual([]);
  });

  it("deduplicates repeated URLs by exact string", () => {
    expect(
      extractRelatedLinks("https://example.com/a https://example.com/a https://example.com/A"),
    ).toEqual(["https://example.com/a", "https://example.com/A"]);
  });
});
