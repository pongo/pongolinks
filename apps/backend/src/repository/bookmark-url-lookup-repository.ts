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

export async function lookupBookmarksByUrl(
  db: AppDb,
  url: string,
): Promise<Result<BookmarkUrlLookupMatch, ApiError>> {
  const alternateProtocolUrl = flipBookmarkUrlProtocol(url);

  try {
    const exactBookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, url),
      columns: { id: true },
    });
    if (exactBookmark) {
      return Ok({
        status: "exact-bookmark",
        bookmarkIds: [exactBookmark.id],
      });
    }

    const alternateProtocolBookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, alternateProtocolUrl),
      columns: { id: true },
    });
    if (alternateProtocolBookmark) {
      return Ok({
        status: "alternate-protocol-bookmark",
        bookmarkIds: [alternateProtocolBookmark.id],
      });
    }

    const relatedLinkMatches = await db
      .select({
        id: bookmarks.id,
      })
      .from(bookmarks)
      .innerJoin(relatedLinks, eq(relatedLinks.bookmarkId, bookmarks.id))
      .where(inArray(relatedLinks.url, [url, alternateProtocolUrl]))
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

    return Ok({ status: "not-found", bookmarkIds: [] });
  } catch (error) {
    return Err(unexpectedError(error));
  }
}
