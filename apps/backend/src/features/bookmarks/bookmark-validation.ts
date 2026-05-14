import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError } from "../../http/result-response";
import type { EditableBookmarkRequest } from "./contracts";

export type ValidEditableBookmarkInput = EditableBookmarkRequest;

export type EditableBookmarkBody = {
  url: string;
  title: string;
  description?: string;
  isPrivate?: boolean;
  tagsText?: string;
};

export function validateEditableBookmarkInput(
  input: EditableBookmarkBody,
): Result<ValidEditableBookmarkInput, ApiError> {
  const title = input.title.trim();

  if (title === "") {
    return Err(new ApiError("Bookmark title is required", "bookmark.title_required", 400));
  }

  return Ok({
    url: input.url,
    title,
    description: input.description?.trim() ?? "",
    isPrivate: input.isPrivate ?? false,
    tagsText: input.tagsText ?? "",
  });
}

function parseElysiaValidationMessage(error: unknown): Record<string, unknown> | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(error.message);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function readElysiaValidationPayload(error: unknown): Record<string, unknown> | undefined {
  const parsed = parseElysiaValidationMessage(error);
  const direct =
    typeof error === "object" && error !== null ? (error as Record<string, unknown>) : undefined;

  if (!parsed) {
    return direct;
  }

  return {
    ...parsed,
    ...direct,
  };
}

function readElysiaValidationProperty(error: unknown): string | undefined {
  const payload = readElysiaValidationPayload(error);

  if (!payload) {
    return undefined;
  }

  const property = payload.property;
  if (typeof property === "string") {
    return property === "root" ? "" : property;
  }

  const valueError = payload.valueError as { path?: unknown } | undefined;
  return typeof valueError?.path === "string" ? valueError.path : undefined;
}

function readElysiaValidationTarget(error: unknown): string | undefined {
  const payload = readElysiaValidationPayload(error);

  if (!payload) {
    return undefined;
  }

  const on = payload.on;
  if (typeof on === "string") {
    return on;
  }

  const type = payload.type;
  return typeof type === "string" ? type : undefined;
}

function readElysiaValidationSummary(error: unknown): string | undefined {
  const payload = readElysiaValidationPayload(error);

  if (!payload) {
    return undefined;
  }

  const summary = payload.summary;
  if (typeof summary === "string") {
    return summary;
  }

  const message = payload.message;
  if (typeof message === "string") {
    return message;
  }

  const valueError = payload.valueError as { summary?: unknown; message?: unknown } | undefined;

  if (typeof valueError?.summary === "string") {
    return valueError.summary;
  }

  if (typeof valueError?.message === "string") {
    return valueError.message;
  }

  return undefined;
}

function isEmptyBodyShapeFailure(error: unknown): boolean {
  const payload = readElysiaValidationPayload(error);

  if (!payload) {
    return false;
  }

  const found = payload.found;
  const errors = payload.errors;

  if (
    typeof found !== "object" ||
    found === null ||
    Object.keys(found).length > 0 ||
    !Array.isArray(errors)
  ) {
    return false;
  }

  const paths = new Set(
    errors
      .map((entry) =>
        typeof entry === "object" && entry !== null
          ? (entry as { path?: unknown }).path
          : undefined,
      )
      .filter((path): path is string => typeof path === "string"),
  );

  return paths.has("/url") && paths.has("/title");
}

function bookmarkValidationApiError(error: unknown): ApiError {
  const type = readElysiaValidationTarget(error);
  const property = readElysiaValidationProperty(error);
  const summary = readElysiaValidationSummary(error);

  if (type === "params") {
    return new ApiError("Bookmark id must be a positive safe integer", "bookmark.id_invalid", 400);
  }

  if (isEmptyBodyShapeFailure(error)) {
    return new ApiError("Bookmark request is invalid", "bookmark.validation_invalid", 400, {
      validation: {
        ...(type ? { type } : {}),
        ...(property ? { property } : {}),
        ...(summary ? { summary } : {}),
      },
    });
  }

  if (property === "/title") {
    return new ApiError("Bookmark title is required", "bookmark.title_required", 400);
  }

  if (property === "/url") {
    return new ApiError("Bookmark URL is required", "bookmark.url_required", 400);
  }

  return new ApiError("Bookmark request is invalid", "bookmark.validation_invalid", 400, {
    validation: {
      ...(type ? { type } : {}),
      ...(property ? { property } : {}),
      ...(summary ? { summary } : {}),
    },
  });
}

export function bookmarkValidationErrorResponse(
  error: unknown,
  set: { status?: number | string },
): Result<never, ApiError> {
  const apiError = bookmarkValidationApiError(error);

  set.status = apiError.status;
  return Err(apiError);
}
