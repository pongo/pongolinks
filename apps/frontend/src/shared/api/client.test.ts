import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";
import { parseApiPayload, parseEdenResponse } from "./client";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "bookmark.unexpected",
);

describe("shared API Result parsing", () => {
  it("accepts Ok-shaped Result payloads", () => {
    const result = parseApiPayload<{ count: number }, ApiError>(
      {
        isOk: true,
        isErr: false,
        value: { count: 1 },
      },
      { fallbackError },
    );

    expect(result).toMatchObject({
      isOk: true,
      value: { count: 1 },
    });
  });

  it("accepts Err-shaped Result payloads", () => {
    const apiError = new ApiError("Bookmark URL is required", "bookmark.url_required");

    const result = parseApiPayload<{ count: number }, ApiError>(
      {
        isOk: false,
        isErr: true,
        error: apiError,
      },
      {
        fallbackError,
        parseError: (error) => error as ApiError,
      },
    );

    expect(result).toMatchObject({
      isErr: true,
      error: apiError,
    });
  });

  it("rejects non-Result payloads with the provided fallback error", () => {
    const result = parseApiPayload<{ count: number }, ApiError>(
      {
        isOk: true,
        isErr: false,
      },
      { fallbackError },
    );

    expect(result).toMatchObject({
      isErr: true,
      error: fallbackError,
    });
  });

  it("parses Eden response data before transport error payloads", () => {
    const result = parseEdenResponse<{ count: number }, ApiError>(
      {
        data: {
          isOk: true,
          isErr: false,
          value: { count: 1 },
        },
        error: {
          value: {
            isOk: false,
            isErr: true,
            error: fallbackError,
          },
        },
      },
      { fallbackError },
    );

    expect(result).toMatchObject({
      isOk: true,
      value: { count: 1 },
    });
  });
});
