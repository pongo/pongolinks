import { asc, desc, sql } from "drizzle-orm";
import type { BookmarkFilterMode } from "@pongolinks/shared/bookmark-filter";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { lookupBookmarksByUrl } from "#/repository/bookmark-url-lookup-repository.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO } from "../domain/contracts.ts";
import { toBookmarkDTO } from "./bookmark-dto.ts";
import { findBookmarkById } from "./bookmark-loader.ts";
import {
  BOOKMARK_LIST_PAGE_SIZE,
  bookmarkListOffset,
  createBookmarkListPagination,
  type PaginatedBookmarkList,
} from "../filter/pagination.ts";
import { buildBookmarkFilterCondition } from "../filter/bookmark-filter-persistence.ts";

function assertUnreachable(value: never): never {
  throw new Error(`Missed a case! ${value}`);
}

export class BookmarkReadRepository {
  constructor(private readonly db: AppDb) {}

  async list(
    page: number,
    filters: BookmarkFilterMode,
  ): Promise<Result<PaginatedBookmarkList, ApiError>> {
    try {
      switch (filters.kind) {
        case "urlLookup":
          return await this.urlLookup(filters, page);
        case "filters":
          return await this.filterBookmarks(filters, page);
        default:
          assertUnreachable(filters);
      }
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }

  private async urlLookup(
    filters: Extract<BookmarkFilterMode, { kind: "urlLookup" }>,
    page: number,
  ) {
    const urlLookupResult = await lookupBookmarksByUrl(this.db, filters.url);
    if (urlLookupResult.isErr) {
      return urlLookupResult;
    }

    const matchedBookmarks = urlLookupResult.value.bookmarks;
    const totalCount = matchedBookmarks.length;
    const pageBookmarks = matchedBookmarks.slice(
      bookmarkListOffset(page),
      bookmarkListOffset(page) + BOOKMARK_LIST_PAGE_SIZE,
    );

    return Ok({
      bookmarks: pageBookmarks.map(toBookmarkDTO),
      pagination: createBookmarkListPagination({ page, totalCount }),
    });
  }

  private async filterBookmarks(
    filters: Extract<BookmarkFilterMode, { kind: "filters" }>,
    page: number,
  ) {
    const where = buildBookmarkFilterCondition(filters);
    const totalCountRow = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(where)
      .get();
    const totalCount = totalCountRow?.count ?? 0;
    const rows = await this.db.query.bookmarks.findMany({
      where,
      orderBy: [desc(bookmarks.updatedAt), desc(bookmarks.id)],
      limit: BOOKMARK_LIST_PAGE_SIZE,
      offset: bookmarkListOffset(page),
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
    return Ok({
      bookmarks: rows.map(toBookmarkDTO),
      pagination: createBookmarkListPagination({ page, totalCount }),
    });
  }

  async findById(id: BookmarkId): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const row = await findBookmarkById(this.db, id.value());

      if (!row) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      return Ok(toBookmarkDTO(row));
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
