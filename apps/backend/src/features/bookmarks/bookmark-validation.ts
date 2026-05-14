import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError, type ApiErrorCode } from "../../http/result-response";
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

type ValidationIssue = {
  path?: string;
  message?: string;
  summary?: string;
};

const validationErrorMessages = {
  "bookmark.id_invalid": "Bookmark id must be a positive safe integer",
  "bookmark.title_required": "Bookmark title is required",
  "bookmark.url_required": "Bookmark URL is required",
  "bookmark.validation_invalid": "Bookmark request is invalid",
} as const satisfies Partial<Record<ApiErrorCode, string>>;

type ValidationApiErrorCode = keyof typeof validationErrorMessages;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readValidationPayload(error: unknown): Record<string, unknown> | undefined {
  if (!(error instanceof Error)) {
    return isRecord(error) ? error : undefined;
  }

  try {
    const payload = JSON.parse(error.message);
    return isRecord(payload) ? payload : undefined;
  } catch {
    return isRecord(error) ? error : undefined;
  }
}

function readValidationTarget(error: unknown): string | undefined {
  const payload = readValidationPayload(error);
  if (!payload) {
    return undefined;
  }

  return readString(payload.on) ?? readString(payload.type);
}

function readValidationValue(error: unknown): unknown {
  const payload = readValidationPayload(error);
  return payload?.value ?? payload?.found;
}

function readValidationIssues(error: unknown): ValidationIssue[] {
  const payload = readValidationPayload(error);
  if (!payload) {
    return [];
  }

  const issues = Array.isArray(payload.all) ? payload.all : payload.errors;
  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.filter(isRecord).map((issue) => ({
    path: readString(issue.path),
    message: readString(issue.message),
    summary: readString(issue.summary),
  }));
}

function readValidationMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

function isBodyObjectShapeFailure(
  error: unknown,
  issues: ValidationIssue[],
  input?: unknown,
): boolean {
  const target = readValidationTarget(error);
  if (target && target !== "body") {
    return false;
  }

  if (input !== undefined && !isRecord(input)) {
    return true;
  }

  const message = readValidationMessage(error);
  if (
    input === undefined &&
    (message === "bookmark.url_required" || message === "bookmark.title_required")
  ) {
    return true;
  }

  const value = readValidationValue(error);
  if (!isRecord(value)) {
    return true;
  }

  if (issues.some((issue) => !issue.path && issue.message === "bookmark.validation_invalid")) {
    return true;
  }

  const paths = new Set(issues.map((issue) => issue.path));
  if (!paths.has("/url") || !paths.has("/title")) {
    return false;
  }

  return !isRecord(value) || Object.keys(value).length === 0;
}

function readApiErrorCode(
  error: unknown,
  issues: ValidationIssue[],
  input?: unknown,
): ValidationApiErrorCode {
  if (isBodyObjectShapeFailure(error, issues, input)) {
    return "bookmark.validation_invalid";
  }

  const message = readValidationMessage(error);
  if (message && message in validationErrorMessages) {
    return message as ValidationApiErrorCode;
  }

  const explicitIssue = issues.find((issue) =>
    issue.message ? issue.message in validationErrorMessages : false,
  );
  if (explicitIssue?.message) {
    return explicitIssue.message as ValidationApiErrorCode;
  }

  if (readValidationTarget(error) === "params") {
    return "bookmark.id_invalid";
  }

  const firstPath = issues.find((issue) => issue.path)?.path;
  if (firstPath === "/url") {
    return "bookmark.url_required";
  }

  if (firstPath === "/title") {
    return "bookmark.title_required";
  }

  if (firstPath === "/id") {
    return "bookmark.id_invalid";
  }

  return "bookmark.validation_invalid";
}

function validationData(error: unknown, issues: ValidationIssue[]): Record<string, unknown> {
  const type = readValidationTarget(error);
  const firstIssue = issues[0];

  return {
    validation: {
      ...(type ? { type } : {}),
      ...(firstIssue?.path ? { property: firstIssue.path } : {}),
      ...(firstIssue?.summary ? { summary: firstIssue.summary } : {}),
    },
  };
}

function bookmarkValidationApiError(error: unknown, input?: unknown): ApiError {
  const issues = readValidationIssues(error);
  const code = readApiErrorCode(error, issues, input);
  const message =
    validationErrorMessages[code] ?? validationErrorMessages["bookmark.validation_invalid"];

  if (code !== "bookmark.validation_invalid") {
    return new ApiError(message, code, 400);
  }

  return new ApiError(message, code, 400, validationData(error, issues));
}

export function bookmarkValidationErrorResponse(
  error: unknown,
  set: { status?: number | string },
  input?: unknown,
): Result<never, ApiError> {
  const apiError = bookmarkValidationApiError(error, input);

  set.status = apiError.status;
  return Err(apiError);
}
