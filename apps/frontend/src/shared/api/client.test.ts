import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";
import { createApiResultAdapter } from "./client";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "internal.unexpected",
);

describe("shared API Result adapter", () => {
  it("accepts Ok-shaped Result payloads", () => {
    const adapter = createApiResultAdapter({ fallbackError });
    const result = adapter.parsePayload<{ count: number }>({
      isOk: true,
      isErr: false,
      value: { count: 1 },
    });

    expect(result).toMatchObject({
      isOk: true,
      value: { count: 1 },
    });
  });

  it("converts Err-shaped Result payloads into API errors", () => {
    const adapter = createApiResultAdapter({
      fallbackError,
      mapFormErrors: (error) => ({ url: error.message }),
    });
    const result = adapter.parsePayload<{ count: number }>({
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
        message: "Bookmark URL is required",
        code: "bookmark.url_required",
        formErrors: {
          url: "Bookmark URL is required",
        },
      },
    });
  });

  it("rejects non-Result payloads with the provided fallback error", () => {
    const adapter = createApiResultAdapter({ fallbackError });
    const result = adapter.parsePayload<{ count: number }>({
      isOk: true,
      isErr: false,
    });

    expect(result).toMatchObject({
      isErr: true,
      error: fallbackError,
    });
  });

  it("parses Eden response data before transport error payloads", () => {
    const adapter = createApiResultAdapter({ fallbackError });
    const result = adapter.parseResponse<{ count: number }>({
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
    });

    expect(result).toMatchObject({
      isOk: true,
      value: { count: 1 },
    });
  });

  it("parses Eden transport error payloads", () => {
    const adapter = createApiResultAdapter({ fallbackError });
    const result = adapter.parseResponse<{ count: number }>({
      data: null,
      error: {
        value: {
          isOk: false,
          isErr: true,
          error: {
            message: "Bookmark was not found",
            code: "bookmark.not_found",
          },
        },
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        message: "Bookmark was not found",
        code: "bookmark.not_found",
      },
    });
  });

  it("returns the fallback error when an endpoint throws", async () => {
    const adapter = createApiResultAdapter({ fallbackError });
    const result = await adapter.call<{ count: number }>(async () => {
      throw new Error("network down");
    });

    expect(result).toMatchObject({
      isErr: true,
      error: fallbackError,
    });
  });
});
