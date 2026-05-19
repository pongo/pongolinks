import { describe, expect, it } from "vitest";

import { replaceCurrentSearchTagToken, suggestSearchFieldTags } from "./search-tag-autocomplete.ts";

const tags = [
  { id: 1, name: "sqlite", nameLower: "sqlite", usageCount: 9 },
  { id: 2, name: "solid", nameLower: "solid", usageCount: 7 },
  { id: 3, name: "old", nameLower: "old", usageCount: 6 },
];

describe("search field tag autocomplete", () => {
  it("suggests tags for include #token", () => {
    expect(suggestSearchFieldTags(tags, "hello #sq", 9)).toEqual([tags[0]]);
  });

  it("suggests exact matches for include #token", () => {
    expect(suggestSearchFieldTags(tags, "hello #sqlite", 13)).toEqual([tags[0]]);
  });

  it("suggests tags for exclude -#token", () => {
    expect(suggestSearchFieldTags(tags, "hello -#ol", 10)).toEqual([tags[1], tags[2]]);
  });

  it("suggests exact matches for exclude -#token", () => {
    expect(suggestSearchFieldTags(tags, "hello -#old", 11)).toEqual([tags[2]]);
  });

  it("excludes tags entered in other include or exclude tokens", () => {
    expect(suggestSearchFieldTags(tags, "#sqlite -#solid #ol", 19)).toEqual([tags[2]]);
    expect(suggestSearchFieldTags(tags, "#sqlite -#solid -#ol", 20)).toEqual([tags[2]]);
  });

  it("does not suggest for plain text tokens", () => {
    expect(suggestSearchFieldTags(tags, "hello sq", 8)).toEqual([]);
    expect(suggestSearchFieldTags(tags, "@example.com", 12)).toEqual([]);
  });

  it("inserts include token with trailing space", () => {
    expect(replaceCurrentSearchTagToken("hello #sq", 9, "sqlite")).toEqual({
      value: "hello #sqlite ",
      cursor: 14,
    });
  });

  it("inserts exclude token with trailing space", () => {
    expect(replaceCurrentSearchTagToken("hello -#ol", 10, "old")).toEqual({
      value: "hello -#old ",
      cursor: 12,
    });
  });
});
