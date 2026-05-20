import { describe, expect, it } from "vitest";

import type { ApiErrorCode } from "#/shared/api/errors.ts";
import { parseApiPayload } from "./api.ts";
import type { BookmarkUrlCheckResult } from "./types.ts";

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

describe("search API payload parsing", () => {
  it("parses exact bookmark URL check payload", () => {
    const result = parseApiPayload<BookmarkUrlCheckResult>({
      isOk: true,
      isErr: false,
      value: {
        status: "exact-bookmark",
        bookmark: {
          id: 1,
          url: "https://example.com",
          title: "Example",
        },
      },
    });

    expect(result).toMatchObject({
      isOk: true,
      value: {
        status: "exact-bookmark",
      },
    });
  });

  it("maps URL check validation errors to URL field errors", () => {
    const result = parseApiPayload(
      apiErrorPayload("Bookmark URL must use http or https", "bookmark.url_invalid"),
    );

    expect(result).toMatchObject({
      isErr: true,
      error: {
        formErrors: {
          url: "Bookmark URL must use http or https",
        },
      },
    });
  });
});
