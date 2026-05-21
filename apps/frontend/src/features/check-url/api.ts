import { Err, type Result } from "@pongolinks/shared/result";

import {
  apiClient,
  parseApiPayload as parseSharedApiPayload,
  parseEdenResponse,
} from "#/shared/api/client.ts";
import {
  ApiError,
  mapBookmarkUrlApiErrorToFormErrors,
  parseApiError as parseSharedApiError,
} from "#/shared/api/errors.ts";
import type { BookmarkUrlCheckResult } from "./types.ts";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "internal.unexpected",
);

function parseApiError(value: unknown): ApiError {
  return parseSharedApiError(value, {
    fallbackError,
    mapFormErrors: mapBookmarkUrlApiErrorToFormErrors,
  });
}

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return parseSharedApiPayload<T, ApiError>(payload, {
    fallbackError,
    parseError: parseApiError,
  });
}

export async function checkBookmarkUrl(
  url: string,
): Promise<Result<BookmarkUrlCheckResult, ApiError>> {
  try {
    return parseEdenResponse<BookmarkUrlCheckResult, ApiError>(
      await apiClient.api.search.check.get({ $query: { url } }),
      {
        fallbackError,
        parseError: parseApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}
