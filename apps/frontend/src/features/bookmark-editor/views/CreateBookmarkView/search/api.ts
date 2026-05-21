import { Err, type Result } from "@pongolinks/shared/result";

import {
  apiClient,
  parseApiPayload as parseSharedApiPayload,
  parseEdenResponse,
} from "#/shared/api/client.ts";
import {
  ApiError,
  parseApiError as parseSharedApiError,
  type FormErrors,
} from "#/shared/api/errors.ts";
import type { BookmarkUrlCheckResult } from "./types.ts";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "bookmark.unexpected",
);

function mapApiErrorToFormErrors(error: Pick<ApiError, "code" | "message">): FormErrors {
  if (error.code === "bookmark.url_required" || error.code === "bookmark.url_invalid") {
    return { url: error.message };
  }

  return { form: error.message };
}

function parseApiError(value: unknown): ApiError {
  return parseSharedApiError(value, {
    fallbackError,
    mapFormErrors: mapApiErrorToFormErrors,
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
