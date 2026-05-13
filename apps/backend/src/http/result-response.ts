import { Err, Ok, type Result } from "@pongolinks/shared/result";

export type ApiErrorCode =
  | "bookmark.url_required"
  | "bookmark.url_invalid"
  | "bookmark.url_duplicate"
  | "bookmark.title_required"
  | "bookmark.id_invalid"
  | "bookmark.not_found"
  | "bookmark.tags_invalid"
  | "bookmark.validation_invalid"
  | "bookmark.unexpected";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status: number,
    readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    Object.defineProperty(this, "message", {
      value: message,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
}

export function unexpectedError(error: unknown) {
  return new ApiError("Unexpected bookmark error", "bookmark.unexpected", 500, { error });
}

export function resultResponse<T>(result: Result<T, ApiError>, set: { status?: number | string }) {
  if (result.isOk) {
    return Ok(result.value);
  }

  set.status = result.error.status;
  return Err(result.error);
}
