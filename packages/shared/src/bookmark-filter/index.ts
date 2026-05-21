import type { ValidUrl } from "../brands.ts";
import { StacklessError } from "../errors/stackless-error.ts";
import { Err, Ok, type Result } from "../result/result.ts";

export type BookmarkFilterErrorKind =
  | "url_invalid"
  | "mixed_url_lookup"
  | "tag_invalid"
  | "contradictory_tag";

export class BookmarkFilterError extends StacklessError {
  constructor(
    message: string,
    readonly kind: BookmarkFilterErrorKind,
  ) {
    super(message);
  }
}

export type BookmarkFilterQueryInput = {
  q?: string | null;
  tag?: string | string[] | null;
  domain?: string | null;
  url?: string | null;
};

export type BookmarkFilterInput = {
  q?: string | null;
  tags?: string[] | null;
  domain?: string | null;
  url?: string | null;
};

export type BookmarkFilterMode =
  | {
      kind: "filters";
      qTokens: string[];
      includeTagNamesLower: string[];
      excludeTagNamesLower: string[];
      domain: string | null;
    }
  | {
      kind: "urlLookup";
      url: ValidUrl;
    };

export type BookmarkFilterQueryParams = {
  q?: string;
  tag?: string[];
  domain?: string;
  url?: string;
};

function readRawQueryTags(value: BookmarkFilterQueryInput["tag"]) {
  if (Array.isArray(value)) {
    return value;
  }

  return typeof value === "string" ? [value] : [];
}

function normalizeTagFilter(
  rawTag: string,
): Result<{ nameLower: string; isExcluded: boolean }, BookmarkFilterError> {
  const trimmed = rawTag.trim();
  const isExcluded = trimmed.startsWith("-");
  const value = isExcluded ? trimmed.slice(1) : trimmed;
  const displayName = value.trim();

  if (displayName === "" || /\s/u.test(displayName)) {
    return Err(
      new BookmarkFilterError(
        "Tag filters must be non-empty names without whitespace",
        "tag_invalid",
      ),
    );
  }

  const nameLower = displayName.toLocaleLowerCase("und");
  if (nameLower.startsWith("-")) {
    return Err(new BookmarkFilterError("Tag filters are invalid", "tag_invalid"));
  }

  return Ok({ nameLower, isExcluded });
}

function parseBookmarkUrlLookup(value: string): Result<ValidUrl, BookmarkFilterError> {
  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return Err(new BookmarkFilterError("Bookmark URL must use http or https", "url_invalid"));
    }

    return Ok(trimmed as ValidUrl);
  } catch {
    return Err(new BookmarkFilterError("Bookmark URL must be an absolute URL", "url_invalid"));
  }
}

export function normalizeBookmarkFilterQuery(
  query: BookmarkFilterQueryInput,
): Result<BookmarkFilterMode, BookmarkFilterError> {
  const qTokens =
    typeof query.q === "string"
      ? query.q
          .trim()
          .split(/\s+/u)
          .filter((token) => token.length > 0)
      : [];
  const domain = typeof query.domain === "string" ? query.domain.trim() : "";
  const rawTags = readRawQueryTags(query.tag);
  const urlValue = typeof query.url === "string" ? query.url.trim() : "";
  const hasUrlMode = urlValue !== "";
  const hasMixedMode = hasUrlMode && (qTokens.length > 0 || domain !== "" || rawTags.length > 0);

  if (hasMixedMode) {
    return Err(
      new BookmarkFilterError(
        "URL lookup mode cannot be combined with other filters",
        "mixed_url_lookup",
      ),
    );
  }

  if (hasUrlMode) {
    const url = parseBookmarkUrlLookup(urlValue);
    if (url.isErr) {
      return url;
    }

    return Ok({ kind: "urlLookup", url: url.value });
  }

  const includeTagNamesLower = new Set<string>();
  const excludeTagNamesLower = new Set<string>();
  for (const rawTag of rawTags) {
    const tag = normalizeTagFilter(rawTag);
    if (tag.isErr) {
      return tag;
    }

    if (tag.value.isExcluded) {
      excludeTagNamesLower.add(tag.value.nameLower);
    } else {
      includeTagNamesLower.add(tag.value.nameLower);
    }
  }

  const contradictoryTag = [...includeTagNamesLower].find((tag) => excludeTagNamesLower.has(tag));
  if (contradictoryTag) {
    return Err(
      new BookmarkFilterError(
        "Tag filters cannot include and exclude the same tag",
        "contradictory_tag",
      ),
    );
  }

  return Ok({
    kind: "filters",
    qTokens,
    includeTagNamesLower: [...includeTagNamesLower].sort((a, b) => a.localeCompare(b)),
    excludeTagNamesLower: [...excludeTagNamesLower].sort((a, b) => a.localeCompare(b)),
    domain: domain === "" ? null : domain.toLocaleLowerCase("und"),
  });
}

export function normalizeBookmarkFilterInput(
  input: BookmarkFilterInput,
): Result<BookmarkFilterMode, BookmarkFilterError> {
  return normalizeBookmarkFilterQuery({
    q: input.q,
    tag: input.tags ?? [],
    domain: input.domain,
    url: input.url,
  });
}

export function bookmarkFilterToQueryParams(filter: BookmarkFilterMode): BookmarkFilterQueryParams {
  if (filter.kind === "urlLookup") {
    return { url: filter.url };
  }

  const tag = [
    ...filter.includeTagNamesLower,
    ...filter.excludeTagNamesLower.map((tagName) => `-${tagName}`),
  ];

  return {
    ...(filter.qTokens.length > 0 ? { q: filter.qTokens.join(" ") } : {}),
    ...(tag.length > 0 ? { tag } : {}),
    ...(filter.domain ? { domain: filter.domain } : {}),
  };
}
