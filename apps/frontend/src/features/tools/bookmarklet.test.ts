import { describe, expect, it } from "vitest";

import { createBookmarkletHref } from "./bookmarklet";

describe("bookmarklet href", () => {
  it("uses absolute pongolinks origin and app base path", () => {
    const href = createBookmarkletHref({
      appOrigin: "https://pongolinks.example",
      appBasePath: "/pongolinks/",
    });

    expect(href).toContain("https://pongolinks.example/pongolinks/bookmarks/new");
  });

  it("passes location href as url query parameter", () => {
    const href = createBookmarkletHref({
      appOrigin: "https://pongolinks.example",
      appBasePath: "/pongolinks/",
    });

    expect(href).toContain('?url=" + encodeURIComponent(location.href)');
  });

  it("passes document title as title query parameter", () => {
    const href = createBookmarkletHref({
      appOrigin: "https://pongolinks.example",
      appBasePath: "/pongolinks/",
    });

    expect(href).toContain('"&title=" + encodeURIComponent(document.title)');
  });

  it("does not derive target from the saved page origin", () => {
    const href = createBookmarkletHref({
      appOrigin: "https://pongolinks.example",
      appBasePath: "/pongolinks/",
    });

    expect(href).not.toContain("location.origin");
  });
});
