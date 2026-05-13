import { describe, expect, it } from "vitest";

import { parseApiEnvelope } from "./api";

describe("bookmark API envelope parsing", () => {
  it("parses success envelopes", () => {
    const result = parseApiEnvelope({
      ok: true,
      data: {
        bookmarks: [
          {
            id: 1,
            url: "https://example.com",
            title: "Example",
            description: "",
            isPrivate: false,
            createdAt: "2026-01-01 00:00:00",
            updatedAt: "2026-01-01 00:00:00",
            tags: [{ id: 1, name: "Article", nameLower: "article" }],
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: true,
      data: {
        bookmarks: [
          {
            id: 1,
            url: "https://example.com",
            title: "Example",
            description: "",
            isPrivate: false,
            createdAt: "2026-01-01 00:00:00",
            updatedAt: "2026-01-01 00:00:00",
            tags: [{ id: 1, name: "Article", nameLower: "article" }],
          },
        ],
      },
    });
  });

  it("maps field error envelopes", () => {
    const result = parseApiEnvelope({
      ok: false,
      error: {
        message: "Bookmark URL is required",
        code: "bookmark.url_required",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        url: "Bookmark URL is required",
      },
    });
  });

  it("maps form error envelopes", () => {
    const result = parseApiEnvelope({
      ok: false,
      error: {
        message: "Bookmark was not found",
        code: "bookmark.not_found",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        form: "Bookmark was not found",
      },
    });
  });

  it("maps invalid tag input to a form error", () => {
    const result = parseApiEnvelope({
      ok: false,
      error: {
        message: "Tags must be non-empty names without whitespace",
        code: "bookmark.tags_invalid",
      },
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        form: "Tags must be non-empty names without whitespace",
      },
    });
  });
});
