import { describe, expect, it } from "vitest";

import type { ApiErrorCode } from "#/shared/api/errors.ts";
import type { BookmarkListResponse } from "../types";
import { bookmarkListQuery, parseApiPayload } from "./api";

function apiErrorPayload(message: string, code: ApiErrorCode) {
  return {
    isOk: false,
    isErr: true,
    error: {
      message,
      code,
    },
  };
}

describe("bookmark API payload parsing", () => {
  it("parses bookmark list pagination metadata", () => {
    const result = parseApiPayload<BookmarkListResponse>({
      isOk: true,
      isErr: false,
      value: {
        bookmarks: [],
        pagination: {
          page: 1,
          pageSize: 3,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });

    expect(result).toMatchObject({
      isOk: true,
      value: {
        bookmarks: [],
        pagination: {
          page: 1,
          pageSize: 3,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });
  });

  it("omits page query for page 1 and sends it for later pages", () => {
    expect(bookmarkListQuery(1)).toEqual({ $query: {} });
    expect(bookmarkListQuery(0)).toEqual({ $query: {} });
    expect(bookmarkListQuery(2)).toEqual({ $query: { page: "2" } });
  });

  it("maps URL error payloads to the URL form field", () => {
    const result = parseApiPayload(
      apiErrorPayload("Bookmark URL is required", "bookmark.url_required"),
    );

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
    const result = parseApiPayload(
      apiErrorPayload("Bookmark title is required", "bookmark.title_required"),
    );

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
    const result = parseApiPayload(
      apiErrorPayload("Bookmark URL is required", "bookmark.url_required"),
    );

    expect(result).toMatchObject({ isErr: true });
    if (result.isErr) {
      expect(result.error.stack).toBeUndefined();
    }
  });

  it("maps not-found error payloads to a form error", () => {
    const result = parseApiPayload(apiErrorPayload("Bookmark was not found", "bookmark.not_found"));

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
    const result = parseApiPayload(
      apiErrorPayload("Tags must be non-empty names without whitespace", "bookmark.tags_invalid"),
    );

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
