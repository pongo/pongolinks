import { describe, expect, it } from "vitest";

import { parseBookmarkListFiltersQuery } from "./bookmark-list-filters-query.ts";

describe("parseBookmarkListFiltersQuery()", () => {
  it("parses list pagination and normalized Bookmark Filters", () => {
    expect(
      parseBookmarkListFiltersQuery({
        q: " sqlite   vue ",
        tag: ["Vue", "-Old"],
        domain: " Example.COM ",
        page: "2",
      }),
    ).toMatchObject({
      isOk: true,
      value: {
        page: 2,
        filters: {
          kind: "filters",
          qTokens: ["sqlite", "vue"],
          includeTagNamesLower: ["vue"],
          excludeTagNamesLower: ["old"],
          domain: "example.com",
        },
      },
    });
  });

  it("parses URL lookup mode", () => {
    expect(parseBookmarkListFiltersQuery({ url: " https://example.com/path " })).toMatchObject({
      isOk: true,
      value: {
        page: 1,
        filters: {
          kind: "urlLookup",
          url: "https://example.com/path",
        },
      },
    });
  });

  it("maps invalid Tag filters to bookmark.tags_invalid", () => {
    const result = parseBookmarkListFiltersQuery({ tag: "two words" });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "bookmark.tags_invalid",
        status: 400,
      },
    });
  });

  it("maps invalid filter combinations to bookmark.validation_invalid", () => {
    const result = parseBookmarkListFiltersQuery({ url: "https://example.com", tag: "vue" });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "bookmark.validation_invalid",
        status: 400,
      },
    });
  });
});
