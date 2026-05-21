import { describe, expect, it } from "vitest";

import type { ApiErrorCode } from "#/shared/api/errors.ts";
import { parseApiPayload } from "./api.ts";

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

describe("bookmark editor API payload parsing", () => {
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
});
