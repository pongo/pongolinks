import { describe, expect, it } from "vitest";

import { replaceCurrentTagToken, suggestTags } from "./tag-autocomplete";

const tags = [
  { id: 1, name: "Article", nameLower: "article", usageCount: 9 },
  { id: 2, name: "Art", nameLower: "art", usageCount: 7 },
  { id: 3, name: "Architecture", nameLower: "architecture", usageCount: 6 },
  { id: 4, name: "Cartography", nameLower: "cartography", usageCount: 5 },
  { id: 5, name: "Dart", nameLower: "dart", usageCount: 4 },
  { id: 6, name: "Martial", nameLower: "martial", usageCount: 3 },
  { id: 7, name: "Party", nameLower: "party", usageCount: 2 },
  { id: 8, name: "Start", nameLower: "start", usageCount: 1 },
];

describe("tag autocomplete", () => {
  it("finds suggestions by substring match while preserving backend order", () => {
    expect(suggestTags(tags, "art", 3)).toEqual([
      tags[0],
      tags[1],
      tags[3],
      tags[4],
      tags[5],
      tags[6],
      tags[7],
    ]);
  });

  it("includes exact matches for the current token", () => {
    expect(suggestTags(tags, "article", 7)).toEqual([tags[0]]);
  });

  it("limits suggestions", () => {
    expect(suggestTags(tags, "a", 1, 3)).toEqual([tags[0], tags[1], tags[2]]);
  });

  it("excludes tags entered in other tokens", () => {
    expect(suggestTags(tags, "Article ar Dart", 10)).toEqual([
      tags[1],
      tags[2],
      tags[3],
      tags[5],
      tags[6],
      tags[7],
    ]);
  });

  it("replaces the current token and adds exactly one trailing space", () => {
    expect(replaceCurrentTagToken("alpha ar", 8, "Article")).toEqual({
      value: "alpha Article ",
      cursor: 14,
    });
  });

  it("preserves following tokens without double spacing", () => {
    expect(replaceCurrentTagToken("alpha ar  beta", 8, "Article")).toEqual({
      value: "alpha Article beta",
      cursor: 14,
    });
  });
});
