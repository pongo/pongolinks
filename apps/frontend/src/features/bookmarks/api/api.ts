import { Err, type Result } from "@pongolinks/shared/result";
import {
  bookmarkFilterToQueryParams,
  normalizeBookmarkFilterInput,
} from "@pongolinks/shared/bookmark-filter";

import {
  apiClient,
  parseApiPayload as parseSharedApiPayload,
  parseEdenResponse,
} from "#/shared/api/client.ts";
import {
  ApiError,
  parseApiError as parseSharedApiError,
  type FormErrors,
  genericFallbackError,
} from "#/shared/api/errors.ts";
import type { BookmarkListResponse } from "../types";

const fallbackError = genericFallbackError;

function mapApiErrorToFormErrors(error: Pick<ApiError, "code" | "message">): FormErrors {
  if (
    error.code === "bookmark.url_required" ||
    error.code === "bookmark.url_invalid" ||
    error.code === "bookmark.url_duplicate"
  ) {
    return { url: error.message };
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
  const filter = normalizeBookmarkFilterInput({
    q: query.url ? null : query.q,
    tags: query.url ? [] : query.tag,
    domain: query.url ? null : query.domain,
    url: query.url,
  });

  if (filter.isOk) {
    Object.assign(payload, bookmarkFilterToQueryParams(filter.value));
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
