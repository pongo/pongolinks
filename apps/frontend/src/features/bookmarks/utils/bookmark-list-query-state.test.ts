import { describe, expect, it } from "vitest";

import {
  buildTagShortcutReplaceTarget,
  isFilterActive,
  parseBookmarkListRouteQuery,
  parseMiniQueryToState,
  parseTagShortcutInput,
  renderMiniQueryForContinuedInput,
  renderMiniQueryFromState,
  toggleDomainFilter,
  toggleExcludedTagFilter,
  toggleIncludedTagFilter,
  toBookmarkListRouteQuery,
  normalizeBookmarkListPageQuery,
} from "./bookmark-list-query-state.ts";

describe("parseMiniQueryToState()", () => {
  it("parses mini-query tokens into structured state", () => {
    expect(parseMiniQueryToState("sqlite #vue -#old @example.com")).toEqual({
      q: "sqlite",
      tags: ["vue", "-old"],
      domain: "example.com",
      url: null,
    });
  });

  it("treats full-field HTTP(S) URL as URL lookup mode", () => {
    expect(parseMiniQueryToState("https://example.com/path")).toEqual({
      q: null,
      tags: [],
      domain: null,
      url: "https://example.com/path",
    });
  });

  it("treats URL token mixed with other tokens as ordinary query", () => {
    expect(parseMiniQueryToState("https://example.com #vue")).toEqual({
      q: "https://example.com",
      tags: ["vue"],
      domain: null,
      url: null,
    });
  });
});

describe("renderMiniQueryFromState()", () => {
  it("renders mini-query text from structured route state", () => {
    expect(
      renderMiniQueryFromState({
        q: "sqlite",
        tags: ["vue", "-old"],
        domain: "example.com",
        url: null,
        page: 2,
      }),
    ).toBe("sqlite #vue -#old @example.com");
  });

  it("renders plain URL when URL mode is active", () => {
    expect(
      renderMiniQueryFromState({
        q: null,
        tags: [],
        domain: null,
        url: "https://example.com",
        page: 1,
      }),
    ).toBe("https://example.com");
  });
});

describe("renderMiniQueryForContinuedInput()", () => {
  it("renders non-empty route filters with one trailing space for continued input", () => {
    expect(
      renderMiniQueryForContinuedInput({
        q: null,
        tags: ["narod.ru"],
        domain: null,
        url: null,
        page: 1,
      }),
    ).toBe("#narod.ru ");
  });

  it("keeps empty route filters empty for continued input", () => {
    expect(
      renderMiniQueryForContinuedInput({
        q: null,
        tags: [],
        domain: null,
        url: null,
        page: 1,
      }),
    ).toBe("");
  });
});

describe("toBookmarkListRouteQuery()", () => {
  it("serializes route query and omits page 1", () => {
    expect(
      toBookmarkListRouteQuery({
        q: "sqlite",
        tags: ["vue", "-old"],
        domain: "example.com",
        url: null,
        page: 1,
      }),
    ).toEqual({
      q: "sqlite",
      tag: ["vue", "-old"],
      domain: "example.com",
    });
  });

  it("preserves URL mode and includes page > 1", () => {
    expect(
      toBookmarkListRouteQuery({
        q: "ignored",
        tags: ["vue"],
        domain: "example.com",
        url: "https://example.com",
        page: 3,
      }),
    ).toEqual({
      url: "https://example.com",
      page: "3",
    });
  });

  it("normalizes route query filters through Bookmark Filter rules", () => {
    expect(
      toBookmarkListRouteQuery({
        q: " sqlite   vue ",
        tags: ["Vue", "-Old"],
        domain: "Example.COM",
        url: null,
        page: 1,
      }),
    ).toEqual({
      q: "sqlite vue",
      tag: ["vue", "-old"],
      domain: "example.com",
    });
  });
});

describe("parseBookmarkListRouteQuery()", () => {
  it("parses existing route query into state", () => {
    expect(
      parseBookmarkListRouteQuery({
        q: "sqlite",
        tag: ["vue", "-old"],
        domain: "example.com",
        page: "2",
      }),
    ).toEqual({
      q: "sqlite",
      tags: ["vue", "-old"],
      domain: "example.com",
      url: null,
      page: 2,
    });
  });

  it("treats URL lookup mode as exclusive when parsing route query", () => {
    expect(
      parseBookmarkListRouteQuery({
        q: "ignored",
        tag: "vue",
        domain: "example.com",
        url: "https://example.com",
        page: "2",
      }),
    ).toEqual({
      q: null,
      tags: [],
      domain: null,
      url: "https://example.com",
      page: 2,
    });
  });
});

describe("bookmark list query state filters", () => {
  it("detects active filters", () => {
    expect(
      isFilterActive({
        q: null,
        tags: [],
        domain: null,
        url: null,
        page: 1,
      }),
    ).toBe(false);
    expect(
      isFilterActive({
        q: "x",
        tags: [],
        domain: null,
        url: null,
        page: 1,
      }),
    ).toBe(true);
  });

  it("toggles include tag filter and resets page while clearing url mode", () => {
    const added = toggleIncludedTagFilter(
      {
        q: "sqlite",
        tags: ["vue"],
        domain: "example.com",
        url: "https://example.com",
        page: 3,
      },
      "react",
    );
    expect(added).toEqual({
      q: "sqlite",
      tags: ["vue", "react"],
      domain: "example.com",
      url: null,
      page: 1,
    });

    const removed = toggleIncludedTagFilter(added, "react");
    expect(removed.tags).toEqual(["vue"]);
    expect(removed.page).toBe(1);
    expect(removed.url).toBeNull();
  });

  it("switches between included and excluded tag filters without contradictory tags", () => {
    const excluded = toggleExcludedTagFilter(
      {
        q: "sqlite",
        tags: ["vue", "react"],
        domain: null,
        url: null,
        page: 3,
      },
      "vue",
    );

    expect(excluded).toEqual({
      q: "sqlite",
      tags: ["react", "-vue"],
      domain: null,
      url: null,
      page: 1,
    });

    const included = toggleIncludedTagFilter(excluded, "vue");
    expect(included.tags).toEqual(["react", "vue"]);

    const removed = toggleExcludedTagFilter(excluded, "vue");
    expect(removed.tags).toEqual(["react"]);
  });

  it("toggles domain filter and resets page while preserving q/tags", () => {
    const set = toggleDomainFilter(
      {
        q: "sqlite",
        tags: ["vue", "-old"],
        domain: null,
        url: "https://example.com",
        page: 4,
      },
      "example.com",
    );

    expect(set).toEqual({
      q: "sqlite",
      tags: ["vue", "-old"],
      domain: "example.com",
      url: null,
      page: 1,
    });

    const unset = toggleDomainFilter(set, "example.com");
    expect(unset.domain).toBeNull();
    expect(unset.tags).toEqual(["vue", "-old"]);
    expect(unset.q).toBe("sqlite");
    expect(unset.page).toBe(1);
  });
});

describe("parseTagShortcutInput()", () => {
  it("parses tag shortcut input with whitespace, plus and slash separators", () => {
    expect(parseTagShortcutInput("sqlite vue -old")).toEqual(["sqlite", "vue", "-old"]);
    expect(parseTagShortcutInput("sqlite+vue+-old")).toEqual(["sqlite", "vue", "-old"]);
    expect(parseTagShortcutInput("sqlite/vue/-old")).toEqual(["sqlite", "vue", "-old"]);
  });

  it("ignores empty shortcut tokens and keeps include/exclude prefixes", () => {
    expect(parseTagShortcutInput("  sqlite  +  / -old  ")).toEqual(["sqlite", "-old"]);
  });
});

describe("buildTagShortcutReplaceTarget()", () => {
  it("builds replace target for non-empty shortcut input", () => {
    expect(buildTagShortcutReplaceTarget("sqlite+vue+-old")).toEqual({
      path: "/",
      query: {
        tag: ["sqlite", "vue", "-old"],
      },
    });
  });

  it("builds root replace target for empty shortcut input", () => {
    expect(buildTagShortcutReplaceTarget("   + /  ")).toEqual({
      path: "/",
    });
  });
});

describe("normalizeBookmarkListPageQuery()", () => {
  it("normalizes invalid page query values to page 1", () => {
    expect(normalizeBookmarkListPageQuery(undefined)).toBe(1);
    expect(normalizeBookmarkListPageQuery("not-a-number")).toBe(1);
    expect(normalizeBookmarkListPageQuery("0")).toBe(1);
    expect(normalizeBookmarkListPageQuery("-1")).toBe(1);
    expect(normalizeBookmarkListPageQuery("1.5")).toBe(1);
    expect(normalizeBookmarkListPageQuery(["3", "4"])).toBe(3);
  });
});
