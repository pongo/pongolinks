import { Err, type Result } from "@pongolinks/shared/result";

import {
  apiClient,
  parseApiPayload as parseSharedApiPayload,
  parseEdenResponse,
} from "#/shared/api/client.ts";
import { ApiError, type ApiErrorCode, type FormErrors } from "#/shared/api/errors.ts";
import type {
  BookmarkDTO,
  BookmarkListResponse,
  DeletedBookmarkResponse,
  EditableBookmarkPayload,
} from "../types";

const apiErrorCodes = [
  "bookmark.url_required",
  "bookmark.url_invalid",
  "bookmark.url_duplicate",
  "bookmark.title_required",
  "bookmark.id_invalid",
  "bookmark.not_found",
  "bookmark.tags_invalid",
  "bookmark.validation_invalid",
  "bookmark.unexpected",
] as const satisfies readonly ApiErrorCode[];

type BookmarkApiErrorCode = (typeof apiErrorCodes)[number];

const fallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "bookmark.unexpected",
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorCode(value: unknown): value is BookmarkApiErrorCode {
  return typeof value === "string" && apiErrorCodes.includes(value as BookmarkApiErrorCode);
}

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
  if (!isRecord(value)) {
    return fallbackError;
  }

  const message = typeof value.message === "string" ? value.message : fallbackError.message;
  const code = isApiErrorCode(value.code) ? value.code : fallbackError.code;
  const data = isRecord(value.data) ? value.data : undefined;

  return new ApiError(message, code, data, mapApiErrorToFormErrors({ code, message }));
}

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return parseSharedApiPayload<T, ApiError>(payload, {
    fallbackError,
    parseError: parseApiError,
  });
}

export type BookmarkListApiQuery = {
  q?: string;
  tag?: string[];
  domain?: string;
  url?: string;
  page?: number;
};

export function bookmarkListQuery(query: BookmarkListApiQuery): {
  $query: { q?: string; tag?: string[]; domain?: string; url?: string; page?: string };
} {
  const payload: { q?: string; tag?: string[]; domain?: string; url?: string; page?: string } = {};

  if (query.url) {
    payload.url = query.url;
  } else {
    if (query.q) payload.q = query.q;
    if (query.tag && query.tag.length > 0) payload.tag = query.tag;
    if (query.domain) payload.domain = query.domain;
  }

  if (Number.isInteger(query.page) && (query.page ?? 1) > 1) {
    payload.page = String(query.page);
  }

  return { $query: payload };
}

export async function listBookmarks(
  query: BookmarkListApiQuery = {},
): Promise<Result<BookmarkListResponse, ApiError>> {
  try {
    return parseEdenResponse<BookmarkListResponse, ApiError>(
      await apiClient.api.bookmarks.get(bookmarkListQuery(query)),
      {
        fallbackError,
        parseError: parseApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
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
