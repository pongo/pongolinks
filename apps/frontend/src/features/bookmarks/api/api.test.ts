import { describe, expect, it } from "vitest";

import { parseApiPayload } from "./api";

describe("bookmark API payload parsing", () => {
  it("maps URL error payloads to the URL form field", () => {
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

  it("maps title error payloads to the title form field", () => {
    const result = parseApiPayload({
      isOk: false,
      isErr: true,
      error: {
        message: "Bookmark title is required",
        code: "bookmark.title_required",
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        formErrors: {
          title: "Bookmark title is required",
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

  it("maps not-found error payloads to a form error", () => {
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
