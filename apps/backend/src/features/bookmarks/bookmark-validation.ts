import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError, errorEnvelope, type ErrorEnvelope } from "../../http/result-response";
import type { EditableBookmarkRequest } from "./contracts";

export type ValidEditableBookmarkInput = EditableBookmarkRequest;

export const validateEditableBookmarkInput = (
  input: unknown,
): Result<ValidEditableBookmarkInput, ApiError> => {
  const payload =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const title = typeof payload.title === "string" ? payload.title.trim() : "";

  if (title === "") {
    return Err(new ApiError("Bookmark title is required", "bookmark.title_required", 400));
  }

  return Ok({
    url: typeof payload.url === "string" ? payload.url : "",
    title,
    description: typeof payload.description === "string" ? payload.description.trim() : "",
    isPrivate: payload.isPrivate === true,
  });
};

const readElysiaValidationProperty = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const valueError = (error as { valueError?: { path?: unknown } }).valueError;
  return typeof valueError?.path === "string" ? valueError.path : undefined;
};

const readElysiaValidationType = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const type = (error as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
};

const readElysiaValidationSummary = (error: unknown): string | undefined => {
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

export const bookmarkValidationErrorResponse = (
  error: unknown,
  set: { status?: number | string },
): ErrorEnvelope => {
  const type = readElysiaValidationType(error);
  const property = readElysiaValidationProperty(error);
  const summary = readElysiaValidationSummary(error);

  const apiError =
    type === "params"
      ? new ApiError("Bookmark id must be a positive safe integer", "bookmark.id_invalid", 400)
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
