import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError } from "../../http/result-response";
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
