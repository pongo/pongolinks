import { asc, desc, eq } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO } from "../domain/contracts.ts";

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;
type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};

type RepositoryDb = Pick<AppDb, "query">;

function toBookmarkDTO(row: BookmarkWithTagsRow): BookmarkDTO {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    isPrivate: row.isPrivate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.bookmarkTags
      .map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        nameLower: tag.nameLower,
      }))
      .sort((left, right) => left.nameLower.localeCompare(right.nameLower)),
    relatedLinks: row.relatedLinks.map((relatedLink) => ({
      id: relatedLink.id,
      url: relatedLink.url,
    })),
  };
}

export class BookmarkReadRepository {
  constructor(private readonly db: AppDb) {}

  async list(): Promise<Result<{ bookmarks: BookmarkDTO[] }, ApiError>> {
    try {
      const rows = await this.db.query.bookmarks.findMany({
        orderBy: desc(bookmarks.updatedAt),
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
      return Ok({ bookmarks: rows.map(toBookmarkDTO) });
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
