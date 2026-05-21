import { isApiErrorCode, type ApiErrorCode } from "@pongolinks/shared/api-errors";
import { StacklessError } from "@pongolinks/shared/errors";

export type { ApiErrorCode };

export type FormErrors = {
  url?: string;
  title?: string;
  form?: string;
};

export class ApiError extends StacklessError {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    data?: Record<string, unknown>,
    readonly formErrors: FormErrors = { form: message },
  ) {
    super(message, data);
  }
}

type ParseApiErrorOptions = {
  fallbackError: ApiError;
  mapFormErrors?: (error: Pick<ApiError, "code" | "message">) => FormErrors;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseApiError(value: unknown, options: ParseApiErrorOptions): ApiError {
  const { fallbackError, mapFormErrors } = options;

  if (!isRecord(value)) {
    return fallbackError;
  }

  const message = typeof value.message === "string" ? value.message : fallbackError.message;
  const code = isApiErrorCode(value.code) ? value.code : fallbackError.code;
  const data = isRecord(value.data) ? value.data : undefined;

  return new ApiError(message, code, data, mapFormErrors?.({ code, message }) ?? { form: message });
}

export function mapBookmarkUrlApiErrorToFormErrors(
  error: Pick<ApiError, "code" | "message">,
): FormErrors {
  if (error.code === "bookmark.url_required" || error.code === "bookmark.url_invalid") {
    return { url: error.message };
  }

  return { form: error.message };
}

export const genericFallbackError = new ApiError(
  "Something went wrong. Please try again.",
  "internal.unexpected",
);
