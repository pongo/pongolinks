import { describe, expect, it } from "vitest";

import {
  chooseBookmarkCreateUrl,
  createInitialBookmarkPayload,
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
      kind: "create-form",
      initialUrl: "https://example.com/page",
      initialTitle: "Example",
      focusTarget: "tags",
    });
  });

  it("keeps empty title when missing", () => {
    const state = resolveCreateBookmarkState({
      url: "https://example.com/page",
    });

    expect(state.kind).toBe("create-form");
    if (state.kind === "create-form") {
      expect(state.initialTitle).toBe("");
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
      kind: "create-form",
      initialUrl: state.originalUrl,
      initialTitle: "Example",
      focusTarget: "tags",
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
      kind: "create-form",
      initialUrl: state.cleanedUrl,
      initialTitle: "Example",
      focusTarget: "tags",
    });
  });

  it("builds initial payload for create form", () => {
    const payload = createInitialBookmarkPayload({
      kind: "create-form",
      initialUrl: "https://example.com/page",
      initialTitle: "Title",
      focusTarget: "tags",
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
