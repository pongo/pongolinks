export const apiErrorCodes = [
  "bookmark.url_required",
  "bookmark.url_invalid",
  "bookmark.url_duplicate",
  "bookmark.title_required",
  "bookmark.id_invalid",
  "bookmark.not_found",
  "bookmark.tags_invalid",
  "bookmark.validation_invalid",
  "bookmark.unexpected",
  "tag.name_invalid",
  "tag.not_found",
  "tag.conflict",
  "tag.unexpected",
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && apiErrorCodes.includes(value as ApiErrorCode);
}
