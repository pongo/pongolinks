import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { lookupBookmarksByUrl } from "#/repository/bookmark-url-lookup-repository.ts";
import type { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO } from "../domain/contracts.ts";
import { toBookmarkDTO } from "./bookmark-dto.ts";
import {
  BOOKMARK_LIST_PAGE_SIZE,
  bookmarkListOffset,
  createBookmarkListPagination,
  type PaginatedBookmarkList,
} from "../pagination.ts";

type RepositoryDb = Pick<AppDb, "query">;
export type BookmarkListFilters = {
  qTokens: string[];
  includeTagNamesLower: string[];
  excludeTagNamesLower: string[];
  domain: string | null;
  url: BookmarkUrl | null;
};

function escapeFtsToken(token: string) {
  return token.replaceAll('"', '""');
}

function buildDomainFilterCondition(domain: string) {
  const patterns = [
    `http://${domain}`,
    `http://${domain}/%`,
    `http://${domain}?%`,
    `http://${domain}#%`,
    `http://${domain}:%`,
    `https://${domain}`,
    `https://${domain}/%`,
    `https://${domain}?%`,
    `https://${domain}#%`,
    `https://${domain}:%`,
  ];

  return sql`(${sql.join(
    patterns.map((pattern) => sql`${bookmarks.url} LIKE ${pattern}`),
    sql` OR `,
  )})`;
}

function buildQueryTokenCondition(token: string) {
  const tokenLower = token.toLocaleLowerCase("und");
  const ordinaryPattern = `%${tokenLower}%`;
  const ftsMatch = `"${escapeFtsToken(token)}"*`;

  return sql`(
    EXISTS (
      SELECT 1
      FROM bookmarks_fts
      WHERE bookmarks_fts.rowid = ${bookmarks.id}
        AND bookmarks_fts MATCH ${ftsMatch}
    )
    OR LOWER(${bookmarks.url}) LIKE ${ordinaryPattern}
    OR EXISTS (
      SELECT 1
      FROM related_links
      WHERE related_links.bookmark_id = ${bookmarks.id}
        AND LOWER(related_links.url) LIKE ${ordinaryPattern}
    )
    OR EXISTS (
      SELECT 1
      FROM bookmark_tags
      INNER JOIN tags ON bookmark_tags.tag_id = tags.id
      WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
        AND tags.name_lower LIKE ${ordinaryPattern}
    )
  )`;
}

export class BookmarkReadRepository {
  constructor(private readonly db: AppDb) {}

  async list(
    page: number,
    filters: BookmarkListFilters,
  ): Promise<Result<PaginatedBookmarkList, ApiError>> {
    try {
      if (filters.url) {
        const urlLookup = await lookupBookmarksByUrl(this.db, filters.url.value());
        if (urlLookup.isErr) {
          return urlLookup;
        }

        const totalCount = urlLookup.value.bookmarkIds.length;
        const pageIds = urlLookup.value.bookmarkIds.slice(
          bookmarkListOffset(page),
          bookmarkListOffset(page) + BOOKMARK_LIST_PAGE_SIZE,
        );
        const rows = pageIds.length
          ? await this.db.query.bookmarks.findMany({
              where: inArray(bookmarks.id, pageIds),
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
            })
          : [];
        const rowsById = new Map(rows.map((row) => [row.id, row] as const));
        const orderedRows = pageIds
          .map((id) => rowsById.get(id))
          .filter((row): row is (typeof rows)[number] => row !== undefined);

        return Ok({
          bookmarks: orderedRows.map(toBookmarkDTO),
          pagination: createBookmarkListPagination({ page, totalCount }),
        });
      }

      const whereConditions = [];
      if (filters.domain) {
        whereConditions.push(buildDomainFilterCondition(filters.domain));
      }
      for (const token of filters.qTokens) {
        whereConditions.push(buildQueryTokenCondition(token));
      }
      for (const includeTagNameLower of filters.includeTagNamesLower) {
        whereConditions.push(
          sql`EXISTS (
            SELECT 1
            FROM bookmark_tags
            INNER JOIN tags ON bookmark_tags.tag_id = tags.id
            WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
              AND tags.name_lower = ${includeTagNameLower}
          )`,
        );
      }
      for (const excludeTagNameLower of filters.excludeTagNamesLower) {
        whereConditions.push(
          sql`NOT EXISTS (
            SELECT 1
            FROM bookmark_tags
            INNER JOIN tags ON bookmark_tags.tag_id = tags.id
            WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
              AND tags.name_lower = ${excludeTagNameLower}
          )`,
        );
      }

      const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
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
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }

  async findById(id: BookmarkId): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const row = await this.findBookmarkById(this.db, id.value());

      if (!row) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      return Ok(toBookmarkDTO(row));
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }

  private async findBookmarkById(db: RepositoryDb, id: number) {
    return db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, id),
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
  }
}
