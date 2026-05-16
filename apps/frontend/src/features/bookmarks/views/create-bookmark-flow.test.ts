import { describe, expect, it } from "vitest";

import {
  chooseBookmarkCreateUrl,
  continueAfterDuplicateOrRelated,
  createInitialBookmarkPayload,
  resolveCheckedBookmarkState,
  resolveCreateBookmarkState,
} from "./create-bookmark-flow";

describe("create bookmark flow", () => {
  it("trims incoming title from query", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page?utm_source=ad",
      title: "  Example title  ",
    });

    expect(state.kind).toBe("choose-url");
    if (state.kind === "choose-url") {
      expect(state.title).toBe("Example title");
    }
  });

  it("skips URL choice when tidy-url output is identical", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page",
      title: "Example",
    });

    expect(state).toMatchObject({
      kind: "checking",
      url: "https://example.com/page",
      title: "Example",
      closeAfterCreate: true,
    });
  });

  it("keeps empty title when missing", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page",
    });

    expect(state.kind).toBe("checking");
    if (state.kind === "checking") {
      expect(state.title).toBe("");
    }
  });

  it("opens create form with URL focus for invalid URL", () => {
    const state = resolveCreateBookmarkState({
      url: "not-a-url",
      title: " Example ",
    });

    expect(state).toMatchObject({
      kind: "create-form",
      initialUrl: "not-a-url",
      initialTitle: "Example",
      focusTarget: "url",
      closeAfterCreate: true,
    });
  });

  it("opens create form with URL focus for non-http URL", () => {
    const state = resolveCreateBookmarkState({
      url: "ftp://example.com",
      title: "Title",
    });

    expect(state).toMatchObject({
      kind: "create-form",
      initialUrl: "ftp://example.com",
      focusTarget: "url",
      closeAfterCreate: true,
    });
  });

  it("allows selecting original URL from choose step", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page?utm_source=newsletter",
      title: " Example ",
    });

    expect(state.kind).toBe("choose-url");
    if (state.kind !== "choose-url") return;

    const next = chooseBookmarkCreateUrl(state, "original");
    expect(next).toMatchObject({
      kind: "checking",
      url: state.originalUrl,
      title: "Example",
    });
  });

  it("allows selecting cleaned URL from choose step", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page?utm_source=newsletter",
      title: " Example ",
    });

    expect(state.kind).toBe("choose-url");
    if (state.kind !== "choose-url") return;

    const next = chooseBookmarkCreateUrl(state, "cleaned");
    expect(next).toMatchObject({
      kind: "checking",
      url: state.cleanedUrl,
      title: "Example",
    });
  });

  it("redirects to edit for exact bookmark match", () => {
    const next = resolveCheckedBookmarkState(
      {
        status: "exact-bookmark",
        bookmark: { id: 42, url: "https://example.com", title: "Existing" },
      },
      { kind: "checking", url: "https://example.com", title: "Example", closeAfterCreate: true },
    );

    expect(next).toEqual({ kind: "redirect-edit", bookmarkId: 42 });
  });

  it("opens alternate-protocol warning state", () => {
    const next = resolveCheckedBookmarkState(
      {
        status: "alternate-protocol-bookmark",
        bookmark: { id: 7, url: "https://example.com", title: "Existing" },
      },
      { kind: "checking", url: "http://example.com", title: "Example", closeAfterCreate: true },
    );

    expect(next).toMatchObject({
      kind: "duplicate-bookmark",
      bookmark: { id: 7 },
      initialUrl: "http://example.com",
    });
  });

  it("opens related-link matches state", () => {
    const next = resolveCheckedBookmarkState(
      {
        status: "related-link",
        bookmarks: [{ id: 2, url: "https://example.com/a", title: "A" }],
      },
      { kind: "checking", url: "https://related.com", title: "Example", closeAfterCreate: true },
    );

    expect(next).toMatchObject({
      kind: "related-link-matches",
      bookmarks: [{ id: 2, title: "A" }],
    });
  });

  it("opens create form for not-found result", () => {
    const next = resolveCheckedBookmarkState(
      { status: "not-found" },
      { kind: "checking", url: "https://new.example.com", title: "New", closeAfterCreate: true },
    );

    expect(next).toMatchObject({
      kind: "create-form",
      initialUrl: "https://new.example.com",
      initialTitle: "New",
      focusTarget: "tags",
    });
  });

  it("supports create-anyway after alternate-protocol warning", () => {
    const next = continueAfterDuplicateOrRelated({
      kind: "duplicate-bookmark",
      bookmark: { id: 1, url: "https://example.com", title: "Existing" },
      initialUrl: "http://example.com",
      initialTitle: "Example",
      closeAfterCreate: true,
    });

    expect(next.kind).toBe("create-form");
    expect(next.initialUrl).toBe("http://example.com");
  });

  it("supports create-anyway after related-link matches", () => {
    const next = continueAfterDuplicateOrRelated({
      kind: "related-link-matches",
      bookmarks: [{ id: 1, url: "https://example.com", title: "Existing" }],
      initialUrl: "https://related.example.com",
      initialTitle: "Example",
      closeAfterCreate: true,
    });

    expect(next.kind).toBe("create-form");
    expect(next.initialUrl).toBe("https://related.example.com");
  });

  it("builds initial payload for create form", () => {
    const payload = createInitialBookmarkPayload({
      kind: "create-form",
      initialUrl: "https://example.com/page",
      initialTitle: "Title",
      focusTarget: "tags",
      closeAfterCreate: true,
    });

    expect(payload).toEqual({
      url: "https://example.com/page",
      title: "Title",
      description: "",
      isPrivate: false,
      tagsText: "",
    });
  });
});
