import { describe, expect, it } from "vitest";

import { extractRelatedLinkUrls } from "@pongolinks/shared/bookmark-description";

describe("extractRelatedLinkUrls", () => {
  it("returns explicit http and https URLs", () => {
    expect(
      extractRelatedLinkUrls(
        "See http://example.com/a and https://example.com/b for supporting context.",
      ),
    ).toEqual(["http://example.com/a", "https://example.com/b"]);
  });

  it("ignores bare domains, emails, phone numbers, mentions, and hashtags", () => {
    expect(
      extractRelatedLinkUrls("example.com test@example.com +1 555 123 4567 @example #example"),
    ).toEqual([]);
  });

  it("ignores unsupported URL schemes", () => {
    expect(
      extractRelatedLinkUrls(
        "Ignore ftp://example.com/a, mailto:test@example.com, and tel:+15551234567.",
      ),
    ).toEqual([]);
  });

  it("deduplicates repeated URLs by exact string", () => {
    expect(
      extractRelatedLinkUrls("https://example.com/a https://example.com/a https://example.com/A"),
    ).toEqual(["https://example.com/a", "https://example.com/A"]);
  });
});
