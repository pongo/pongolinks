import { and, desc, eq, ne } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import * as relations from "@pongolinks/db/relations";
import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import * as schema from "@pongolinks/db/schema";

import { ApiError, unexpectedError } from "../../http/result-response";
import type { BookmarkId } from "./bookmark-id";
import type { BookmarkUrl } from "./bookmark-url";
import type { BookmarkDTO, EditableBookmarkRequest } from "./contracts";
import type { TagName } from "./tag-name";

export type AppDb = BunSQLiteDatabase<typeof schema & typeof relations>;
export type EditableBookmarkData = Omit<EditableBookmarkRequest, "url" | "tagsText"> & {
  url: BookmarkUrl;
  tags: TagName[];
};

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
};

type RepositoryDb = Pick<AppDb, "delete" | "insert" | "query" | "update">;

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
  };
}

function isUniqueUrlError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("UNIQUE constraint failed: bookmarks.url") ||
      error.message.includes("bookmarks.url"))
  );
}

function isUniqueTagNameLowerError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("UNIQUE constraint failed: tags.name_lower") ||
      error.message.includes("tags.name_lower"))
  );
}

export class BookmarksRepository {
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

  async create(input: EditableBookmarkData): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const existing = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.url, input.url.value()),
      });

      if (existing) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

      const row = await this.db.transaction(async (tx) => {
        const bookmark = await tx
          .insert(bookmarks)
          .values({
            url: input.url.value(),
            title: input.title,
            description: input.description,
            isPrivate: input.isPrivate,
          })
          .returning({ id: bookmarks.id })
          .get();

        await this.replaceBookmarkTags(tx, bookmark.id, input.tags);

        return this.findBookmarkById(tx, bookmark.id);
      });

      if (!row) {
        return Err(unexpectedError(new Error("Created bookmark was not returned")));
      }

      return Ok(toBookmarkDTO(row));
    } catch (error) {
      if (isUniqueUrlError(error)) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

      return Err(unexpectedError(error));
    }
  }

  async update(
    id: BookmarkId,
    input: EditableBookmarkData,
  ): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const existing = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.id, id.value()),
      });

      if (!existing) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      const duplicate = await this.db.query.bookmarks.findFirst({
        where: and(eq(bookmarks.url, input.url.value()), ne(bookmarks.id, id.value())),
      });

      if (duplicate) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

      const row = await this.db.transaction(async (tx) => {
        await tx
          .update(bookmarks)
          .set({
            url: input.url.value(),
            title: input.title,
            description: input.description,
            isPrivate: input.isPrivate,
          })
          .where(eq(bookmarks.id, id.value()))
          .returning()
          .get();

        await this.replaceBookmarkTags(tx, id.value(), input.tags);

        return this.findBookmarkById(tx, id.value());
      });

      if (!row) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      return Ok(toBookmarkDTO(row));
    } catch (error) {
      if (isUniqueUrlError(error)) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

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
      },
    });
  }

  private async replaceBookmarkTags(db: RepositoryDb, bookmarkId: number, tagNames: TagName[]) {
    await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, bookmarkId)).run();

    for (const tagName of tagNames) {
      const tag = await this.findOrCreateTag(db, tagName);

      await db
        .insert(bookmarkTags)
        .values({
          bookmarkId,
          tagId: tag.id,
        })
        .run();
    }
  }

  private async findOrCreateTag(db: RepositoryDb, tagName: TagName): Promise<TagRow> {
    const existing = await db.query.tags.findFirst({
      where: eq(tags.nameLower, tagName.nameLower()),
    });

    if (existing) {
      return existing;
    }

    try {
      return await db
        .insert(tags)
        .values({
          name: tagName.name(),
          nameLower: tagName.nameLower(),
        })
        .returning()
        .get();
    } catch (error) {
      if (!isUniqueTagNameLowerError(error)) {
        throw error;
      }

      const tag = await db.query.tags.findFirst({
        where: eq(tags.nameLower, tagName.nameLower()),
      });

      if (!tag) {
        throw error;
      }

      return tag;
    }
  }
}
