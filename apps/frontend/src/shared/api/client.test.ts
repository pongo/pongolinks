import { describe, expect, it } from "vitest";

import { ApiError } from "./errors";
import { createApiResultAdapter, getLoginRedirectPath } from "./client";

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

  it("redirects to login when an API response is unauthorized", () => {
    const redirects: string[] = [];
    const adapter = createApiResultAdapter({
      fallbackError,
      onUnauthorized: (currentPath) => redirects.push(currentPath),
    });

    const result = adapter.parseResponse<{ count: number }>({
      data: null,
      error: {
        value: {
          isOk: false,
          isErr: true,
          error: {
            message: "Authentication required",
            code: "auth.unauthorized",
          },
        },
      },
    });

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "auth.unauthorized",
      },
    });
    expect(redirects).toEqual(["/"]);
  });

  it("builds login redirect paths with the current route as next", () => {
    expect(getLoginRedirectPath("/pl/bookmarks/new?url=https%3A%2F%2Fexample.com")).toBe(
      "/pl/login?next=%2Fpl%2Fbookmarks%2Fnew%3Furl%3Dhttps%253A%252F%252Fexample.com",
    );
    expect(getLoginRedirectPath("https://example.com")).toBe("/pl/login?next=%2Fpl%2F");
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
