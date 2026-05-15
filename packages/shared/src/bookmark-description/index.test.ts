import { describe, expect, it } from "vitest";

import {
  extractRelatedLinkUrls,
  renderBookmarkDescriptionHtml,
} from "@pongolinks/shared/bookmark-description";

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

describe("renderBookmarkDescriptionHtml", () => {
  it("escapes existing HTML", () => {
    const html = renderBookmarkDescriptionHtml("<strong>Hello</strong>");

    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
    expect(html).not.toContain("<strong>");
  });

  it("turns explicit http and https URL text into links", () => {
    const html = renderBookmarkDescriptionHtml(
      "Read http://example.com/a and https://example.com/b",
    );

    expect(html).toContain('<a href="http://example.com/a"');
    expect(html).toContain('<a href="https://example.com/b"');
  });

  it("does not link unsupported URL schemes", () => {
    const html = renderBookmarkDescriptionHtml(
      "Ignore ftp://example.com/a and mailto:test@example.com.",
    );

    expect(html).not.toContain("<a ");
  });

  it("does not link bare domains, emails, phone numbers, mentions, or hashtags", () => {
    const html = renderBookmarkDescriptionHtml(
      "example.com test@example.com +1 555 123 4567 @team #topic",
    );

    expect(html).not.toContain("<a ");
  });

  it("includes safe external-link attributes", () => {
    const html = renderBookmarkDescriptionHtml("Read https://example.com/docs");

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("preserves visible URL prefixes and trailing slashes", () => {
    const html = renderBookmarkDescriptionHtml("Read https://example.com/");

    expect(html).toContain(">https://example.com/</a>");
  });

  it("applies the provided link class name", () => {
    const html = renderBookmarkDescriptionHtml("Read https://example.com/docs", {
      linkClassName: "bookmark-description-link",
    });

    expect(html).toContain('class="bookmark-description-link bookmark-description-link-url"');
  });
});
