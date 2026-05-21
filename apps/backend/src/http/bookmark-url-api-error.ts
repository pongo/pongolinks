import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { BookmarkUrl, type BookmarkUrlError } from "#/domain/bookmark-url.ts";
import { ApiError, type ApiErrorCode } from "./result-response.ts";

const bookmarkUrlErrorCodes = {
  required: "bookmark.url_required",
  invalid: "bookmark.url_invalid",
} as const satisfies Record<BookmarkUrlError["kind"], ApiErrorCode>;

export function bookmarkUrlApiError(error: BookmarkUrlError): ApiError {
  return new ApiError(error.message, bookmarkUrlErrorCodes[error.kind], 400);
}

export function parseBookmarkUrl(input: unknown): Result<BookmarkUrl, ApiError> {
  const result = BookmarkUrl.from(input);

  if (result.isErr) {
    return Err(bookmarkUrlApiError(result.error));
  }

  return Ok(result.value);
}
