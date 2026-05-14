import { describe, expect, it } from "vitest";

import { autolinkBookmarkDescription } from "./autolink-description";

describe("autolinkBookmarkDescription", () => {
  it("escapes existing HTML", () => {
    const html = autolinkBookmarkDescription("<strong>Hello</strong>");

    expect(html).toContain("&lt;strong&gt;Hello&lt;/strong&gt;");
    expect(html).not.toContain("<strong>");
  });

  it("turns URL text into links", () => {
    const html = autolinkBookmarkDescription("Read https://example.com/docs");

    expect(html).toContain('<a href="https://example.com/docs"');
    expect(html).toContain('class="bookmark-description-link"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does not link emails, phone numbers, mentions, or hashtags", () => {
    const html = autolinkBookmarkDescription("test@example.com +1 555 123 4567 @team #topic");

    expect(html).not.toContain("<a ");
  });
});
