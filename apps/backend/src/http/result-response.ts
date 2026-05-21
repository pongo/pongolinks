import type { ApiErrorCode } from "@pongolinks/shared/api-errors";
import { Err, Ok, type Result } from "@pongolinks/shared/result";

export type { ApiErrorCode };

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
  return new ApiError("Unexpected internal error", "internal.unexpected", 500, { error });
}

export function resultResponse<T>(result: Result<T, ApiError>, set: { status?: number | string }) {
  if (result.isOk) {
    return Ok(result.value);
  }

  set.status = result.error.status;
  return Err(result.error);
}
