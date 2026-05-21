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
import type { BookmarkDTO } from "#/features/bookmarks/types.ts";
import type { DeletedBookmarkResponse, EditableBookmarkPayload } from "./types.ts";

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "internal.unexpected",
);

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

export async function getBookmark(id: string): Promise<Result<BookmarkDTO, ApiError>> {
  try {
    return parseEdenResponse<BookmarkDTO, ApiError>(await apiClient.api.bookmarks[id]!.get(), {
      fallbackError,
      parseError: parseApiError,
    });
  } catch {
    return Err(fallbackError);
  }
}

export async function createBookmark(
  payload: EditableBookmarkPayload,
): Promise<Result<BookmarkDTO, ApiError>> {
  try {
    return parseEdenResponse<BookmarkDTO, ApiError>(await apiClient.api.bookmarks.post(payload), {
      fallbackError,
      parseError: parseApiError,
    });
  } catch {
    return Err(fallbackError);
  }
}

export async function updateBookmark(
  id: string,
  payload: EditableBookmarkPayload,
): Promise<Result<BookmarkDTO, ApiError>> {
  try {
    return parseEdenResponse<BookmarkDTO, ApiError>(
      await apiClient.api.bookmarks[id]!.patch(payload),
      {
        fallbackError,
        parseError: parseApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}

export async function deleteBookmark(
  id: string,
): Promise<Result<DeletedBookmarkResponse, ApiError>> {
  try {
    return parseEdenResponse<DeletedBookmarkResponse, ApiError>(
      await apiClient.api.bookmarks[id]!.delete(),
      {
        fallbackError,
        parseError: parseApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}
