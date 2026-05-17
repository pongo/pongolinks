import { inArray } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { lookupBookmarksByUrl } from "#/repository/bookmark-url-lookup-repository.ts";
import type { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { type ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkUrlCheckBookmark, BookmarkUrlCheckResult } from "./contracts.ts";

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
    try {
      const lookup = await lookupBookmarksByUrl(this.db, url.value());
      if (lookup.isErr) {
        return lookup;
      }

      if (lookup.value.status === "not-found") {
        return Ok({ status: "not-found" });
      }

      const rows = await this.db.query.bookmarks.findMany({
        where: inArray(bookmarks.id, lookup.value.bookmarkIds),
        columns: { id: true, url: true, title: true },
      });
      const bookmarksById = new Map(rows.map((row) => [row.id, row] as const));
      const orderedBookmarks = lookup.value.bookmarkIds
        .map((id) => bookmarksById.get(id))
        .filter((row): row is { id: number; url: string; title: string } => row !== undefined)
        .map(toBookmark);

      if (lookup.value.status === "exact-bookmark") {
        const bookmark = orderedBookmarks[0];
        if (!bookmark) {
          return Ok({ status: "not-found" });
        }

        return Ok({
          status: "exact-bookmark",
          bookmark,
        });
      }

      if (lookup.value.status === "alternate-protocol-bookmark") {
        const bookmark = orderedBookmarks[0];
        if (!bookmark) {
          return Ok({ status: "not-found" });
        }

        return Ok({
          status: "alternate-protocol-bookmark",
          bookmark,
        });
      }

      return Ok({
        status: "related-link",
        bookmarks: orderedBookmarks,
      });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
