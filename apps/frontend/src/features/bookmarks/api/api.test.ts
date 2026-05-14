import { describe, expect, it } from "vitest";

import { parseApiPayload } from "./api";

describe("bookmark API payload parsing", () => {
  it("parses success payloads", () => {
    const result = parseApiPayload({
      isOk: true,
      isErr: false,
      value: {
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
            relatedLinks: [{ id: 1, url: "https://example.com/related" }],
          },
        ],
      },
    });

    expect(result).toMatchObject({
      isOk: true,
      value: {
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
            relatedLinks: [{ id: 1, url: "https://example.com/related" }],
          },
        ],
      },
    });
  });

  it("maps field error payloads", () => {
    const result = parseApiPayload({
      isOk: false,
      isErr: true,
      error: {
        message: "Bookmark URL is required",
        code: "bookmark.url_required",
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        formErrors: {
          url: "Bookmark URL is required",
        },
      },
    });
  });

  it("uses stackless API errors", () => {
    const result = parseApiPayload({
      isOk: false,
      isErr: true,
      error: {
        message: "Bookmark URL is required",
        code: "bookmark.url_required",
      },
    });

    expect(result).toMatchObject({ isErr: true });
    if (result.isErr) {
      expect(result.error.stack).toBeUndefined();
    }
  });

  it("maps form error payloads", () => {
    const result = parseApiPayload({
      isOk: false,
      isErr: true,
      error: {
        message: "Bookmark was not found",
        code: "bookmark.not_found",
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        formErrors: {
          form: "Bookmark was not found",
        },
      },
    });
  });

  it("maps invalid tag input to a form error", () => {
    const result = parseApiPayload({
      isOk: false,
      isErr: true,
      error: {
        message: "Tags must be non-empty names without whitespace",
        code: "bookmark.tags_invalid",
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        formErrors: {
          form: "Tags must be non-empty names without whitespace",
        },
      },
    });
  });
});
