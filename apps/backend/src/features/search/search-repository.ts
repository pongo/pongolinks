import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import type { AppDb } from "#/db/app-db.ts";
import {
  lookupBookmarksByUrl,
  type BookmarkUrlLookupBookmark,
} from "#/repository/bookmark-url-lookup-repository.ts";
import type { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { type ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkUrlCheckBookmark, BookmarkUrlCheckResult } from "./contracts.ts";

function toBookmark(row: BookmarkUrlLookupBookmark): BookmarkUrlCheckBookmark {
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

      if (lookup.value.status === "exact-bookmark") {
        return Ok({
          status: "exact-bookmark",
          bookmark: toBookmark(lookup.value.bookmark),
        });
      }

      if (lookup.value.status === "alternate-protocol-bookmark") {
        return Ok({
          status: "alternate-protocol-bookmark",
          bookmark: toBookmark(lookup.value.bookmark),
        });
      }

      return Ok({
        status: "related-link",
        bookmarks: lookup.value.bookmarks.map(toBookmark),
      });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
