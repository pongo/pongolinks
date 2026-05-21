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

describe("search API payload parsing", () => {
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
