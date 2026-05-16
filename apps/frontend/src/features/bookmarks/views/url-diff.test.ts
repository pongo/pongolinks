import { describe, expect, it } from "vitest";

import { diffUrls } from "./url-diff";

describe("url diff", () => {
  it("highlights removed query parameters", () => {
    const diff = diffUrls(
      "https://example.com/page?utm_source=newsletter&ref=home&id=42",
      "https://example.com/page?id=42",
    );

    expect(diff.queryDiffs).toEqual([
      { kind: "removed", key: "ref", originalValue: "home" },
      { kind: "removed", key: "utm_source", originalValue: "newsletter" },
    ]);
  });

  it("marks non-query URL changes coarsely", () => {
    const diff = diffUrls(
      "https://example.com/page?x=1",
      "http://example.com/other-page?x=1#section",
    );

    expect(diff.nonQueryChanged).toBe(true);
  });
});
