import type { Result } from "@pongolinks/shared/result";

export type ApiErrorCode =
  | "bookmark.url_required"
  | "bookmark.url_invalid"
  | "bookmark.url_duplicate"
  | "bookmark.title_required"
  | "bookmark.id_invalid"
  | "bookmark.not_found"
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
  }
}

export type SuccessEnvelope<T> = {
  ok: true;
  data: T;
};

export type ErrorEnvelope = {
  ok: false;
  error: {
    message: string;
    code: ApiErrorCode;
    data?: Record<string, unknown>;
  };
};

export const successEnvelope = <T>(data: T): SuccessEnvelope<T> => ({ ok: true, data });

export const errorEnvelope = (error: ApiError): ErrorEnvelope => ({
  ok: false,
  error: {
    message: error.message,
    code: error.code,
    ...(error.data ? { data: error.data } : {}),
  },
});

export const unexpectedError = (error: unknown) =>
  new ApiError("Unexpected bookmark error", "bookmark.unexpected", 500, { error });

export const resultResponse = <T>(
  result: Result<T, ApiError>,
  set: { status?: number | string },
) => {
  if (result.isOk) {
    return successEnvelope(result.value);
  }

  set.status = result.error.status;
  return errorEnvelope(result.error);
};
