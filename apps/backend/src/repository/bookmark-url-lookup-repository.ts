import { asc, desc, eq, inArray } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import type { ApiError } from "#/http/result-response.ts";
import { unexpectedError } from "#/http/result-response.ts";
import type { ValidUrl } from "@pongolinks/shared/brands";

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;

export type BookmarkUrlLookupBookmark = BookmarkRow & {
  bookmarkTags: { bookmarkId: number; tagId: number; tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};

export type BookmarkUrlLookupMatch =
  | {
      status: "exact-bookmark";
      bookmark: BookmarkUrlLookupBookmark;
      bookmarks: [BookmarkUrlLookupBookmark];
    }
  | {
      status: "alternate-protocol-bookmark";
      bookmark: BookmarkUrlLookupBookmark;
      bookmarks: [BookmarkUrlLookupBookmark];
    }
  | { status: "related-link"; bookmarks: BookmarkUrlLookupBookmark[] }
  | { status: "not-found"; bookmarks: [] };

export function flipBookmarkUrlProtocol(url: ValidUrl): ValidUrl {
  if (url.startsWith("https:")) {
    return `http:${url.slice("https:".length)}` as ValidUrl;
  }

  return `https:${url.slice("http:".length)}` as ValidUrl;
}

export function getTrailingSlashUrlVariants(url: ValidUrl): ValidUrl[] {
  const suffixStart = url.search(/[?#]/);
  const resourceEnd = suffixStart === -1 ? url.length : suffixStart;
  const resource = url.slice(0, resourceEnd);
  const suffix = url.slice(resourceEnd);
  const alternateSlashUrl = resource.endsWith("/")
    ? `${resource.slice(0, -1)}${suffix}`
    : `${resource}/${suffix}`;

  return Array.from(new Set([url, alternateSlashUrl])) as ValidUrl[];
}

async function findFirstBookmarkByUrl(db: AppDb, urls: ValidUrl[]) {
  for (const url of urls) {
    const bookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, url),
      with: {
        bookmarkTags: {
          with: {
            tag: true,
          },
        },
        relatedLinks: {
          orderBy: asc(relatedLinks.id),
        },
      },
    });

    if (bookmark) return bookmark;
  }

  return null;
}

async function searchExact(db: AppDb, urls: ValidUrl[]): Promise<Result<BookmarkUrlLookupMatch>> {
  const exactBookmark = await findFirstBookmarkByUrl(db, urls);

  if (exactBookmark) {
    return Ok({
      status: "exact-bookmark",
      bookmark: exactBookmark,
      bookmarks: [exactBookmark],
    });
  }

  return Err("Exact bookmark not found");
}

async function searchAlternateProtocol(
  db: AppDb,
  alternateProtocolUrls: ValidUrl[],
): Promise<Result<BookmarkUrlLookupMatch>> {
  const alternateProtocolBookmark = await findFirstBookmarkByUrl(db, alternateProtocolUrls);

  if (alternateProtocolBookmark) {
    return Ok({
      status: "alternate-protocol-bookmark",
      bookmark: alternateProtocolBookmark,
      bookmarks: [alternateProtocolBookmark],
    });
  }

  return Err("Alternate protocol bookmark not found");
}

async function findBookmarksByIdsInOrder(
  db: AppDb,
  bookmarkIds: number[],
): Promise<BookmarkUrlLookupBookmark[]> {
  if (bookmarkIds.length === 0) return [];

  const rows = await db.query.bookmarks.findMany({
    where: inArray(bookmarks.id, bookmarkIds),
    with: {
      bookmarkTags: {
        with: {
          tag: true,
        },
      },
      relatedLinks: {
        orderBy: asc(relatedLinks.id),
      },
    },
  });
  const rowsById = new Map(rows.map((row) => [row.id, row] as const));

  return bookmarkIds.flatMap((id) => {
    const row = rowsById.get(id);
    return row ? [row] : [];
  });
}

async function searchRelated(
  db: AppDb,
  urls: ValidUrl[],
  alternateProtocolUrls: ValidUrl[],
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
  const matchedBookmarks = await findBookmarksByIdsInOrder(db, bookmarkIds);
  if (matchedBookmarks.length > 0) {
    return Ok({
      status: "related-link",
      bookmarks: matchedBookmarks,
    });
  }

  return Err("Related links not found");
}

export async function lookupBookmarksByUrl(
  db: AppDb,
  url: ValidUrl,
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

    return Ok({ status: "not-found", bookmarks: [] });
  } catch (error) {
    return Err(unexpectedError(error));
  }
}
