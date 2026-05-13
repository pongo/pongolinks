import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { apiClient } from "#/shared/api/client.ts";
import { ApiError } from "../bookmarks/types";
import type { TagSummaryDTO } from "./types";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "bookmark.unexpected",
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  if (!isRecord(payload)) {
    return Err(fallbackError);
  }

  if (payload.isOk === true && payload.isErr === false) {
    return Ok(payload.value as T);
  }

  if (payload.isOk !== false || payload.isErr !== true) {
    return Err(fallbackError);
  }

  if (!isRecord(payload.error)) {
    return Err(fallbackError);
  }

  const message =
    typeof payload.error.message === "string" ? payload.error.message : fallbackError.message;

  return Err(new ApiError(message, fallbackError.code));
}

export async function listTags(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
  try {
    const response = await apiClient.api.tags.get();

    return parseApiPayload<{ tags: TagSummaryDTO[] }>(response.data ?? response.error?.value);
  } catch {
    return Err(fallbackError);
  }
}
