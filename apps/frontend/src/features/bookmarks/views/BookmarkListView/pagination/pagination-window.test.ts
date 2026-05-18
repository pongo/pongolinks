import { describe, expect, it } from "vitest";

import { createPaginationWindow, normalizeBookmarkListPageQuery } from "./pagination-window.ts";

describe("Bookmark list pagination window", () => {
  it("normalizes invalid page query values to page 1", () => {
    expect(normalizeBookmarkListPageQuery(undefined)).toBe(1);
    expect(normalizeBookmarkListPageQuery("not-a-number")).toBe(1);
    expect(normalizeBookmarkListPageQuery("0")).toBe(1);
    expect(normalizeBookmarkListPageQuery("-1")).toBe(1);
    expect(normalizeBookmarkListPageQuery("1.5")).toBe(1);
    expect(normalizeBookmarkListPageQuery(["3", "4"])).toBe(3);
  });

  it("shows all pages when total pages fit inside the window", () => {
    expect(createPaginationWindow({ page: 1, totalPages: 4 })).toEqual([
      { type: "page", page: 1 },
      { type: "page", page: 2 },
      { type: "page", page: 3 },
      { type: "page", page: 4 },
    ]);
  });

  it("clamps the window near the beginning", () => {
    expect(createPaginationWindow({ page: 1, totalPages: 10 })).toEqual([
      { type: "page", page: 1 },
      { type: "page", page: 2 },
      { type: "page", page: 3 },
      { type: "page", page: 4 },
      { type: "page", page: 5 },
      { type: "ellipsis", key: "after" },
      { type: "page", page: 10 },
    ]);
  });

  it("centers the window and shows edge ellipses when possible", () => {
    expect(createPaginationWindow({ page: 6, totalPages: 10 })).toEqual([
      { type: "page", page: 1 },
      { type: "ellipsis", key: "before" },
      { type: "page", page: 4 },
      { type: "page", page: 5 },
      { type: "page", page: 6 },
      { type: "page", page: 7 },
      { type: "page", page: 8 },
      { type: "ellipsis", key: "after" },
      { type: "page", page: 10 },
    ]);
  });

  it("clamps the window near the end", () => {
    expect(createPaginationWindow({ page: 10, totalPages: 10 })).toEqual([
      { type: "page", page: 1 },
      { type: "ellipsis", key: "before" },
      { type: "page", page: 6 },
      { type: "page", page: 7 },
      { type: "page", page: 8 },
      { type: "page", page: 9 },
      { type: "page", page: 10 },
    ]);
  });
});
