import { describe, expect, it } from "vitest";

import type { ApiErrorCode } from "#/shared/api/errors.ts";
import { checkWaybackAvailability, parseApiPayload } from "./api.ts";

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

describe("wayback API payload parsing", () => {
  it("parses backend error payload", () => {
    const result = parseApiPayload(
      apiErrorPayload("Wayback availability response is not OK", "wayback.unexpected"),
    );

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "wayback.unexpected",
        message: "Wayback availability response is not OK",
        formErrors: {
          form: "Wayback availability response is not OK",
        },
      },
    });
  });

  it("maps URL validation errors to URL field errors", () => {
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

  it("returns fallback error when transport throws", async () => {
    const throwingEndpoint = {
      get: async () => {
        throw new Error("network down");
      },
    };

    const result = await checkWaybackAvailability("https://example.com", throwingEndpoint);

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "wayback.unexpected",
        message: "Something went wrong. Please try again.",
      },
    });
  });
});
