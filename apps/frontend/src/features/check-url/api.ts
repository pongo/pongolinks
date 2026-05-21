import type { Result } from "@pongolinks/shared/result";

import { apiClient, createApiResultAdapter } from "#/shared/api/client.ts";
import { ApiError, mapBookmarkUrlApiErrorToFormErrors } from "#/shared/api/errors.ts";
import type { BookmarkUrlCheckResult } from "./types.ts";

const checkUrlApi = createApiResultAdapter({
  mapFormErrors: mapBookmarkUrlApiErrorToFormErrors,
});

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return checkUrlApi.parsePayload<T>(payload);
}

export async function checkBookmarkUrl(
  url: string,
): Promise<Result<BookmarkUrlCheckResult, ApiError>> {
  return checkUrlApi.call<BookmarkUrlCheckResult>(() =>
    apiClient.api.search.check.get({ $query: { url } }),
  );
}
