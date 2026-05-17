import { describe, expect, it } from "vitest";

import {
  isFilterActive,
  parseBookmarkListRouteQuery,
  parseMiniQueryToState,
  renderMiniQueryFromState,
  toBookmarkListRouteQuery,
} from "./bookmark-list-query-state";

describe("bookmark list query state", () => {
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
});
