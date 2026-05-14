import { Err, type Result } from "@pongolinks/shared/result";

import { apiClient, parseEdenResponse } from "#/shared/api/client.ts";
import { ApiError } from "#/shared/api/errors.ts";
import type { TagSummaryDTO } from "./types";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "bookmark.unexpected",
);

function parseTagApiError(error: unknown): ApiError {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return fallbackError;
  }

  const message = typeof error.message === "string" ? error.message : fallbackError.message;

  return new ApiError(message, fallbackError.code);
}

export async function listTags(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
  try {
    return parseEdenResponse<{ tags: TagSummaryDTO[] }, ApiError>(await apiClient.api.tags.get(), {
      fallbackError,
      parseError: parseTagApiError,
    });
  } catch {
    return Err(fallbackError);
  }
}
