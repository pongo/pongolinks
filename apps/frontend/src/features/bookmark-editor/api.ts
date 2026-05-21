import type { Result } from "@pongolinks/shared/result";

import { apiClient, createApiResultAdapter } from "#/shared/api/client.ts";
import { ApiError, type FormErrors } from "#/shared/api/errors.ts";
import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import type { DeletedBookmarkResponse, EditableBookmarkPayload } from "./types.ts";

function mapApiErrorToFormErrors(error: Pick<ApiError, "code" | "message">): FormErrors {
  if (
    error.code === "bookmark.url_required" ||
    error.code === "bookmark.url_invalid" ||
    error.code === "bookmark.url_duplicate"
  ) {
    return { url: error.message };
  }

  if (error.code === "bookmark.title_required") {
    return { title: error.message };
  }

  return { form: error.message };
}

const bookmarkEditorApi = createApiResultAdapter({
  mapFormErrors: mapApiErrorToFormErrors,
});

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return bookmarkEditorApi.parsePayload<T>(payload);
}

export async function getBookmark(id: string): Promise<Result<BookmarkDTO, ApiError>> {
  return bookmarkEditorApi.call<BookmarkDTO>(() => apiClient.api.bookmarks[id]!.get());
}

export async function createBookmark(
  payload: EditableBookmarkPayload,
): Promise<Result<BookmarkDTO, ApiError>> {
  return bookmarkEditorApi.call<BookmarkDTO>(() => apiClient.api.bookmarks.post(payload));
}

export async function updateBookmark(
  id: string,
  payload: EditableBookmarkPayload,
): Promise<Result<BookmarkDTO, ApiError>> {
  return bookmarkEditorApi.call<BookmarkDTO>(() => apiClient.api.bookmarks[id]!.patch(payload));
}

export async function deleteBookmark(
  id: string,
): Promise<Result<DeletedBookmarkResponse, ApiError>> {
  return bookmarkEditorApi.call<DeletedBookmarkResponse>(() =>
    apiClient.api.bookmarks[id]!.delete(),
  );
}
