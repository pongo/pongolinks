import type { ApiError, FormErrors } from "#/shared/api/errors.ts";

export function mapBookmarkUrlApiErrorToFormErrors(
  error: Pick<ApiError, "code" | "message">,
): FormErrors {
  if (error.code === "bookmark.url_required" || error.code === "bookmark.url_invalid") {
    return { url: error.message };
  }

  return { form: error.message };
}
