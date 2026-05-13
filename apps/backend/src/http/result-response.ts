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

const readValidationProperty = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const valueError = (error as { valueError?: { path?: unknown } }).valueError;
  return typeof valueError?.path === "string" ? valueError.path : undefined;
};

const readValidationType = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const type = (error as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
};

const readValidationSummary = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const valueError = (error as { valueError?: { summary?: unknown; message?: unknown } })
    .valueError;
  return typeof valueError?.summary === "string"
    ? valueError.summary
    : typeof valueError?.message === "string"
      ? valueError.message
      : undefined;
};

const readValidationValue = (error: unknown): unknown => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return (error as { value?: unknown }).value;
};

const isPlainValidationObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const validationErrorResponse = (
  error: unknown,
  set: { status?: number | string },
): ErrorEnvelope => {
  const type = readValidationType(error);
  const property = readValidationProperty(error);
  const summary = readValidationSummary(error);
  const value = readValidationValue(error);

  const apiError =
    type === "params"
      ? new ApiError("Bookmark id must be a positive safe integer", "bookmark.id_invalid", 400)
      : type === "body" && !isPlainValidationObject(value)
        ? new ApiError("Bookmark request is invalid", "bookmark.validation_invalid", 400, {
            validation: {
              type,
              ...(summary ? { summary } : {}),
            },
          })
        : property === "/title"
          ? new ApiError("Bookmark title is required", "bookmark.title_required", 400)
          : property === "/url"
            ? new ApiError("Bookmark URL is required", "bookmark.url_required", 400)
            : new ApiError("Bookmark request is invalid", "bookmark.validation_invalid", 400, {
                validation: {
                  ...(type ? { type } : {}),
                  ...(property ? { property } : {}),
                  ...(summary ? { summary } : {}),
                },
              });

  set.status = apiError.status;
  return errorEnvelope(apiError);
};

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
