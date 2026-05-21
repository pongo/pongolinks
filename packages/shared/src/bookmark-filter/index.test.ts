import { describe, expect, it } from "vitest";

import {
  bookmarkFilterToQueryParams,
  normalizeBookmarkFilterInput,
  normalizeBookmarkFilterQuery,
} from "./index.ts";

describe("normalizeBookmarkFilterQuery()", () => {
  it("normalizes query tokens, domain, and include/exclude Tags", () => {
    expect(
      normalizeBookmarkFilterQuery({
        q: " sqlite   vue ",
        tag: ["Vue", "-Old"],
        domain: " Example.COM ",
      }),
    ).toEqual({
      isOk: true,
      isErr: false,
      value: {
        kind: "filters",
        qTokens: ["sqlite", "vue"],
        includeTagNamesLower: ["vue"],
        excludeTagNamesLower: ["old"],
        domain: "example.com",
      },
    });
  });

  it("normalizes URL lookup mode", () => {
    expect(normalizeBookmarkFilterQuery({ url: " https://example.com/path " })).toEqual({
      isOk: true,
      isErr: false,
      value: {
        kind: "urlLookup",
        url: "https://example.com/path",
      },
    });
  });

  it("rejects URL lookup mode combined with filters", () => {
    const result = normalizeBookmarkFilterQuery({ url: "https://example.com", tag: "vue" });

    expect(result).toMatchObject({
      isErr: true,
      error: { kind: "mixed_url_lookup" },
    });
  });

  it("rejects invalid Tag filters", () => {
    const result = normalizeBookmarkFilterQuery({ tag: "two words" });

    expect(result).toMatchObject({
      isErr: true,
      error: { kind: "tag_invalid" },
    });
  });

  it("rejects contradictory Tag filters", () => {
    const result = normalizeBookmarkFilterQuery({ tag: ["Vue", "-vue"] });

    expect(result).toMatchObject({
      isErr: true,
      error: { kind: "contradictory_tag" },
    });
  });

  it("rejects invalid URL lookup values", () => {
    const result = normalizeBookmarkFilterQuery({ url: "ftp://example.com" });

    expect(result).toMatchObject({
      isErr: true,
      error: { kind: "url_invalid" },
    });
  });
});

describe("normalizeBookmarkFilterInput()", () => {
  it("normalizes UI-shaped filter input", () => {
    expect(
      normalizeBookmarkFilterInput({
        q: "sqlite",
        tags: ["Vue", "-Old"],
        domain: "Example.com",
      }),
    ).toMatchObject({
      isOk: true,
      value: {
        kind: "filters",
        includeTagNamesLower: ["vue"],
        excludeTagNamesLower: ["old"],
        domain: "example.com",
      },
    });
  });
});

describe("bookmarkFilterToQueryParams()", () => {
  it("renders normalized filters into query params", () => {
    const filter = normalizeBookmarkFilterQuery({
      q: "sqlite vue",
      tag: ["Vue", "-Old"],
      domain: "Example.com",
    });

    expect(filter.isOk && bookmarkFilterToQueryParams(filter.value)).toEqual({
      q: "sqlite vue",
      tag: ["vue", "-old"],
      domain: "example.com",
    });
  });

  it("renders URL lookup mode without other filters", () => {
    const filter = normalizeBookmarkFilterQuery({ url: "https://example.com" });

    expect(filter.isOk && bookmarkFilterToQueryParams(filter.value)).toEqual({
      url: "https://example.com",
    });
  });
});
