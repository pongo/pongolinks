import { desc, eq, inArray } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { type ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkUrl } from "#/features/bookmarks/domain/bookmark-url.ts";
import type { BookmarkUrlCheckBookmark, BookmarkUrlCheckResult } from "./contracts.ts";

function flipProtocol(url: string) {
  if (url.startsWith("https:")) {
    return `http:${url.slice("https:".length)}`;
  }

  return `https:${url.slice("http:".length)}`;
}

function toBookmark(row: { id: number; url: string; title: string }): BookmarkUrlCheckBookmark {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
  };
}

export class SearchRepository {
  constructor(private readonly db: AppDb) {}

  async checkBookmarkUrl(url: BookmarkUrl): Promise<Result<BookmarkUrlCheckResult, ApiError>> {
    const candidateUrl = url.value();
    const alternateProtocolUrl = flipProtocol(candidateUrl);

    try {
      const exactBookmark = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.url, candidateUrl),
        columns: { id: true, url: true, title: true },
      });
      if (exactBookmark) {
        return Ok({
          status: "exact-bookmark",
          bookmark: toBookmark(exactBookmark),
        });
      }

      const alternateProtocolBookmark = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.url, alternateProtocolUrl),
        columns: { id: true, url: true, title: true },
      });
      if (alternateProtocolBookmark) {
        return Ok({
          status: "alternate-protocol-bookmark",
          bookmark: toBookmark(alternateProtocolBookmark),
        });
      }

      const relatedLinkMatches = await this.db
        .select({
          id: bookmarks.id,
          url: bookmarks.url,
          title: bookmarks.title,
        })
        .from(bookmarks)
        .innerJoin(relatedLinks, eq(relatedLinks.bookmarkId, bookmarks.id))
        .where(inArray(relatedLinks.url, [candidateUrl, alternateProtocolUrl]))
        .orderBy(desc(bookmarks.updatedAt), desc(bookmarks.id));

      const uniqueBookmarks = new Map<number, BookmarkUrlCheckBookmark>();
      for (const row of relatedLinkMatches) {
        if (uniqueBookmarks.has(row.id)) {
          continue;
        }

        uniqueBookmarks.set(row.id, toBookmark(row));
      }

      const relatedBookmarks = Array.from(uniqueBookmarks.values());
      if (relatedBookmarks.length > 0) {
        return Ok({
          status: "related-link",
          bookmarks: relatedBookmarks,
        });
      }

      return Ok({ status: "not-found" });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
