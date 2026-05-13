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

const apiBase = "/pongolinks/api";

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

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${apiBase}${path}`, {
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
      ...init,
    });
    const envelope = (await response.json()) as ApiEnvelope<T>;

    return parseApiEnvelope(envelope);
  } catch {
    return {
      ok: false,
      error: unexpectedError,
      errors: {
        form: unexpectedError.message,
      },
    };
  }
}

export function listBookmarks() {
  return requestJson<{ bookmarks: BookmarkDTO[] }>("/bookmarks");
}

export function getBookmark(id: string) {
  return requestJson<BookmarkDTO>(`/bookmarks/${id}`);
}

export function createBookmark(payload: EditableBookmarkPayload) {
  return requestJson<BookmarkDTO>("/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBookmark(id: string, payload: EditableBookmarkPayload) {
  return requestJson<BookmarkDTO>(`/bookmarks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
