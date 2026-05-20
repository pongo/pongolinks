import { describe, expect, it } from "vitest";

import { apiClient } from "#/shared/api/client.ts";
import type { ApiErrorCode } from "#/shared/api/errors.ts";
import { checkWaybackAvailability, parseApiPayload } from "./api";
import type { WaybackAvailabilityDTO } from "./types";

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
  it("parses available payload", () => {
    const result = parseApiPayload<WaybackAvailabilityDTO>({
      isOk: true,
      isErr: false,
      value: {
        available: true,
        archivedUrl: "http://web.archive.org/web/20260212061822/https://example.com",
        timestamp: "20260212061822",
      },
    });

    expect(result).toEqual({
      isOk: true,
      isErr: false,
      value: {
        available: true,
        archivedUrl: "http://web.archive.org/web/20260212061822/https://example.com",
        timestamp: "20260212061822",
      },
    });
  });

  it("parses unavailable payload", () => {
    const result = parseApiPayload<WaybackAvailabilityDTO>({
      isOk: true,
      isErr: false,
      value: {
        available: false,
      },
    });

    expect(result).toEqual({
      isOk: true,
      isErr: false,
      value: {
        available: false,
      },
    });
  });

  it("parses backend error payload", () => {
    const result = parseApiPayload<WaybackAvailabilityDTO>(
      apiErrorPayload("Wayback availability response is not OK", "bookmark.unexpected"),
    );

    expect(result).toMatchObject({
      isErr: true,
      error: {
        code: "bookmark.unexpected",
        message: "Wayback availability response is not OK",
        formErrors: {
          form: "Wayback availability response is not OK",
        },
      },
    });
  });

  it("returns fallback error when transport throws", async () => {
    const waybackEndpoint = apiClient.api.wayback.availability as {
      get: (input: { $query: { url: string } }) => Promise<unknown>;
    };
    const originalGet = waybackEndpoint.get;
    waybackEndpoint.get = async () => {
      throw new Error("network down");
    };

    try {
      const result = await checkWaybackAvailability("https://example.com");

      expect(result).toMatchObject({
        isErr: true,
        error: {
          code: "bookmark.unexpected",
          message: "Something went wrong. Please try again.",
        },
      });
    } finally {
      waybackEndpoint.get = originalGet;
    }
  });
});
