import { Err, type Result } from "@pongolinks/shared/result";

import { apiClient, parseEdenResponse } from "#/shared/api/client.ts";
import { ApiError, parseApiError } from "#/shared/api/errors.ts";
import type { TagSummaryDTO, UntaggedBookmarkDTO } from "./types";

const fallbackError = new ApiError("Something went wrong. Please try again.", "tag.unexpected");

function parseTagApiError(error: unknown): ApiError {
  return parseApiError(error, { fallbackError });
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

export async function updateTag(
  id: number,
  name: string,
): Promise<Result<TagSummaryDTO, ApiError>> {
  try {
    return parseEdenResponse<TagSummaryDTO, ApiError>(
      await apiClient.api.tags[id]!.patch({ name }),
      {
        fallbackError,
        parseError: parseTagApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}

export async function deleteTag(id: number): Promise<Result<{ deletedTagId: number }, ApiError>> {
  try {
    return parseEdenResponse<{ deletedTagId: number }, ApiError>(
      await apiClient.api.tags[id]!.delete(),
      {
        fallbackError,
        parseError: parseTagApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}

export async function listUntaggedBookmarks(): Promise<
  Result<{ totalCount: number; bookmarks: UntaggedBookmarkDTO[] }, ApiError>
> {
  try {
    return parseEdenResponse<{ totalCount: number; bookmarks: UntaggedBookmarkDTO[] }, ApiError>(
      await apiClient.api.tags["untagged-bookmarks"].get(),
      {
        fallbackError,
        parseError: parseTagApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}
