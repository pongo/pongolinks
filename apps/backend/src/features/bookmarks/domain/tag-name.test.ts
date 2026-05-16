import { describe, expect, it } from "vitest";

import { TagName } from "./tag-name.ts";

describe("TagName", () => {
  it("accepts non-empty names without whitespace", () => {
    expect(TagName.from("article").isOk).toBe(true);
    expect(TagName.from("lang-ru").isOk).toBe(true);
    expect(TagName.from("структуры-данных").isOk).toBe(true);
  });

  it("rejects empty and whitespace-containing names", () => {
    expect(TagName.from("").isErr).toBe(true);
    expect(TagName.from("   ").isErr).toBe(true);
    expect(TagName.from("two words").isErr).toBe(true);
  });

  it("computes nameLower with the app-level locale", () => {
    const result = TagName.from("Article");

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.name()).toBe("Article");
      expect(result.value.nameLower()).toBe("article");
    }
  });
});
