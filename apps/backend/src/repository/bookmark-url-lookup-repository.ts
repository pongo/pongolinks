import { desc, eq, inArray } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import type { ApiError } from "#/http/result-response.ts";
import { unexpectedError } from "#/http/result-response.ts";

export type BookmarkUrlLookupMatch =
  | { status: "exact-bookmark"; bookmarkIds: [number] }
  | { status: "alternate-protocol-bookmark"; bookmarkIds: [number] }
  | { status: "related-link"; bookmarkIds: number[] }
  | { status: "not-found"; bookmarkIds: [] };

export function flipBookmarkUrlProtocol(url: string) {
  if (url.startsWith("https:")) {
    return `http:${url.slice("https:".length)}`;
  }

  return `https:${url.slice("http:".length)}`;
}

export function getTrailingSlashUrlVariants(url: string) {
  const suffixStart = url.search(/[?#]/);
  const resourceEnd = suffixStart === -1 ? url.length : suffixStart;
  const resource = url.slice(0, resourceEnd);
  const suffix = url.slice(resourceEnd);
  const alternateSlashUrl = resource.endsWith("/")
    ? `${resource.slice(0, -1)}${suffix}`
    : `${resource}/${suffix}`;

  return Array.from(new Set([url, alternateSlashUrl]));
}

async function findFirstBookmarkByUrl(db: AppDb, urls: string[]) {
  for (const url of urls) {
    const bookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, url),
      columns: { id: true },
    });

    if (bookmark) return bookmark;
  }

  return null;
}

async function searchExact(db: AppDb, urls: string[]): Promise<Result<BookmarkUrlLookupMatch>> {
  const exactBookmark = await findFirstBookmarkByUrl(db, urls);

  if (exactBookmark) {
    return Ok({
      status: "exact-bookmark",
      bookmarkIds: [exactBookmark.id],
    });
  }

  return Err("Exact bookmark not found");
}

async function searchAlternateProtocol(
  db: AppDb,
  alternateProtocolUrls: string[],
): Promise<Result<BookmarkUrlLookupMatch>> {
  const alternateProtocolBookmark = await findFirstBookmarkByUrl(db, alternateProtocolUrls);

  if (alternateProtocolBookmark) {
    return Ok({
      status: "alternate-protocol-bookmark",
      bookmarkIds: [alternateProtocolBookmark.id],
    });
  }

  return Err("Alternate protocol bookmark not found");
}

async function searchRelated(
  db: AppDb,
  urls: string[],
  alternateProtocolUrls: string[],
): Promise<Result<BookmarkUrlLookupMatch>> {
  const relatedLinkMatches = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .innerJoin(relatedLinks, eq(relatedLinks.bookmarkId, bookmarks.id))
    .where(inArray(relatedLinks.url, [...urls, ...alternateProtocolUrls]))
    .orderBy(desc(bookmarks.updatedAt), desc(bookmarks.id));

  const uniqueBookmarkIds = new Set<number>();
  for (const row of relatedLinkMatches) {
    uniqueBookmarkIds.add(row.id);
  }

  const bookmarkIds = Array.from(uniqueBookmarkIds);
  if (bookmarkIds.length > 0) {
    return Ok({
      status: "related-link",
      bookmarkIds,
    });
  }

  return Err("Related links not found");
}

export async function lookupBookmarksByUrl(
  db: AppDb,
  url: string,
): Promise<Result<BookmarkUrlLookupMatch, ApiError>> {
  try {
    const urls = getTrailingSlashUrlVariants(url);
    const exactResult = await searchExact(db, urls);
    if (exactResult.isOk) return exactResult;

    const alternateProtocolUrls = urls.map(flipBookmarkUrlProtocol);
    const alternateProtocolResult = await searchAlternateProtocol(db, alternateProtocolUrls);
    if (alternateProtocolResult.isOk) return alternateProtocolResult;

    const relatedLinkResult = await searchRelated(db, urls, alternateProtocolUrls);
    if (relatedLinkResult.isOk) return relatedLinkResult;

    return Ok({ status: "not-found", bookmarkIds: [] });
  } catch (error) {
    return Err(unexpectedError(error));
  }
}
