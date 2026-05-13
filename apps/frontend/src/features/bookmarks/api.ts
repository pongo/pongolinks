import { apiClient } from "#/shared/api/client.ts";
import type { ApiError, BookmarkDTO, EditableBookmarkPayload, FormErrors } from "./types";

type SuccessEnvelope<T> = {
  ok: true;
  data: T;
};

type ErrorEnvelope = {
  ok: false;
  error: ApiError;
};

type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      errors: FormErrors;
      error: ApiError;
    };

const unexpectedError: ApiError = {
  message: "Something went wrong. Please try again.",
  code: "bookmark.unexpected",
};

function mapApiErrorToFormErrors(error: ApiError): FormErrors {
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

export function parseApiEnvelope<T>(envelope: ApiEnvelope<T>): ApiResult<T> {
  if (envelope.ok) {
    return {
      ok: true,
      data: envelope.data,
    };
  }

  return {
    ok: false,
    error: envelope.error,
    errors: mapApiErrorToFormErrors(envelope.error),
  };
}

type EdenApiResponse = {
  data: unknown;
  error: { value?: unknown } | null;
};

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

function unexpectedResult<T>(): ApiResult<T> {
  return {
    ok: false,
    error: unexpectedError,
    errors: {
      form: unexpectedError.message,
    },
  };
}

function parseEdenResponse<T>(response: EdenApiResponse): ApiResult<T> {
  if (isApiEnvelope<T>(response.data)) {
    return parseApiEnvelope(response.data);
  }

  if (response.error && isApiEnvelope<T>(response.error.value)) {
    return parseApiEnvelope(response.error.value);
  }

  return unexpectedResult();
}

export async function listBookmarks() {
  try {
    return parseEdenResponse<{ bookmarks: BookmarkDTO[] }>(await apiClient.api.bookmarks.get());
  } catch {
    return unexpectedResult<{ bookmarks: BookmarkDTO[] }>();
  }
}

export async function getBookmark(id: string) {
  try {
    return parseEdenResponse<BookmarkDTO>(await apiClient.api.bookmarks[id]!.get());
  } catch {
    return unexpectedResult<BookmarkDTO>();
  }
}

export async function createBookmark(payload: EditableBookmarkPayload) {
  try {
    return parseEdenResponse<BookmarkDTO>(await apiClient.api.bookmarks.post(payload));
  } catch {
    return unexpectedResult<BookmarkDTO>();
  }
}

export async function updateBookmark(id: string, payload: EditableBookmarkPayload) {
  try {
    return parseEdenResponse<BookmarkDTO>(await apiClient.api.bookmarks[id]!.patch(payload));
  } catch {
    return unexpectedResult<BookmarkDTO>();
  }
}
