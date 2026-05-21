import type { Result } from "@pongolinks/shared/result";

import { apiClient, createApiResultAdapter } from "#/shared/api/client.ts";
import { ApiError } from "#/shared/api/errors.ts";
import type { TagSummaryDTO, UntaggedBookmarkDTO } from "./types";

const fallbackError = new ApiError("Something went wrong. Please try again.", "tag.unexpected");

const tagsApi = createApiResultAdapter({ fallbackError });

export async function listTags(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
  return tagsApi.call<{ tags: TagSummaryDTO[] }>(() => apiClient.api.tags.get());
}

export async function updateTag(
  id: number,
  name: string,
): Promise<Result<TagSummaryDTO, ApiError>> {
  return tagsApi.call<TagSummaryDTO>(() => apiClient.api.tags[id]!.patch({ name }));
}

export async function deleteTag(id: number): Promise<Result<{ deletedTagId: number }, ApiError>> {
  return tagsApi.call<{ deletedTagId: number }>(() => apiClient.api.tags[id]!.delete());
}

export async function listUntaggedBookmarks(): Promise<
  Result<{ totalCount: number; bookmarks: UntaggedBookmarkDTO[] }, ApiError>
> {
  return tagsApi.call<{ totalCount: number; bookmarks: UntaggedBookmarkDTO[] }>(() =>
    apiClient.api.tags["untagged-bookmarks"].get(),
  );
}
