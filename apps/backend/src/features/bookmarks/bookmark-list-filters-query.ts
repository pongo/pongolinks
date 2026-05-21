import {
  normalizeBookmarkFilterQuery,
  type BookmarkFilterError,
  type BookmarkFilterMode,
} from "@pongolinks/shared/bookmark-filter";
import { Err, Ok } from "@pongolinks/shared/result";

import { ApiError } from "#/http/result-response.ts";
import { normalizeBookmarkListPage } from "./pagination.ts";

export type BookmarkListQuery = {
  q?: string;
  tag?: string | string[];
  domain?: string;
  url?: string;
  page?: string;
};

export type ParsedBookmarkListQuery = {
  page: number;
  filters: BookmarkFilterMode;
};

function bookmarkFilterApiError(error: BookmarkFilterError) {
  if (error.kind === "tag_invalid") {
    return new ApiError(error.message, "bookmark.tags_invalid", 400);
  }

  if (error.kind === "url_invalid") {
    return new ApiError(error.message, "bookmark.url_invalid", 400);
  }

  return new ApiError(error.message, "bookmark.validation_invalid", 400);
}

export function parseBookmarkListFiltersQuery(query: BookmarkListQuery) {
  const page = normalizeBookmarkListPage(query.page);
  const filters = normalizeBookmarkFilterQuery(query);
  if (filters.isErr) {
    return Err(bookmarkFilterApiError(filters.error));
  }

  return Ok<ParsedBookmarkListQuery>({
    page,
    filters: filters.value,
  });
}
