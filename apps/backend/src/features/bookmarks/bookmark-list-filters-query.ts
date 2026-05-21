import { Err, Ok } from "@pongolinks/shared/result";

import { parseBookmarkUrl } from "#/http/bookmark-url-api-error.ts";
import { ApiError } from "#/http/result-response.ts";
import type { BookmarkListFilters } from "./repository/bookmark-read-repository.ts";
import { parseTagNames } from "#/features/tags/tag-name.ts";
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
  filters: BookmarkListFilters;
};

function normalizeQueryTag(rawTag: string) {
  const trimmed = rawTag.trim();
  const isExcluded = trimmed.startsWith("-");
  const value = isExcluded ? trimmed.slice(1) : trimmed;
  const parsed = parseTagNames(value);
  if (parsed.isErr) {
    return parsed;
  }

  if (parsed.value.length !== 1) {
    return Err(
      new ApiError(
        "Tag filters must be non-empty names without whitespace",
        "bookmark.tags_invalid",
        400,
      ),
    );
  }
  const tag = parsed.value[0];
  if (!tag) {
    return Err(new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400));
  }

  if (tag.nameLower().startsWith("-")) {
    return Err(new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400));
  }

  return parsed;
}

function readRawQueryTags(value: BookmarkListQuery["tag"]) {
  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" ? [value] : [];
}

export function parseBookmarkListFiltersQuery(query: BookmarkListQuery) {
  const page = normalizeBookmarkListPage(query.page);
  const qTokens =
    typeof query.q === "string"
      ? query.q
          .trim()
          .split(/\s+/u)
          .filter((token) => token.length > 0)
      : [];
  const domain = typeof query.domain === "string" ? query.domain.trim() : "";
  const rawTags = readRawQueryTags(query.tag);
  const urlValue = typeof query.url === "string" ? query.url : undefined;

  const hasUrlMode = typeof urlValue === "string" && urlValue.trim() !== "";
  const hasMixedMode = hasUrlMode && (qTokens.length > 0 || domain !== "" || rawTags.length > 0);
  if (hasMixedMode) {
    return Err(
      new ApiError(
        "URL lookup mode cannot be combined with other filters",
        "bookmark.validation_invalid",
        400,
      ),
    );
  }

  const includeTagNamesLower = new Set<string>();
  const excludeTagNamesLower = new Set<string>();
  for (const rawTag of rawTags) {
    const parsedTag = normalizeQueryTag(rawTag);
    if (parsedTag.isErr) {
      return parsedTag;
    }

    const tagNameLower = parsedTag.value[0]?.nameLower();
    if (!tagNameLower) {
      return Err(new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400));
    }

    if (rawTag.trim().startsWith("-")) {
      excludeTagNamesLower.add(tagNameLower);
    } else {
      includeTagNamesLower.add(tagNameLower);
    }
  }

  const contradictoryTag = [...includeTagNamesLower].find((tag) => excludeTagNamesLower.has(tag));
  if (contradictoryTag) {
    return Err(
      new ApiError(
        "Tag filters cannot include and exclude the same tag",
        "bookmark.validation_invalid",
        400,
      ),
    );
  }

  const url = hasUrlMode ? parseBookmarkUrl(urlValue) : null;
  if (url?.isErr) {
    return url;
  }

  return Ok<ParsedBookmarkListQuery>({
    page,
    filters: {
      qTokens,
      includeTagNamesLower: [...includeTagNamesLower].sort((a, b) => a.localeCompare(b)),
      excludeTagNamesLower: [...excludeTagNamesLower].sort((a, b) => a.localeCompare(b)),
      domain: domain === "" ? null : domain.toLocaleLowerCase("und"),
      url: url?.value ?? null,
    },
  });
}
