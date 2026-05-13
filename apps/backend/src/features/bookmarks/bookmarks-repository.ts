import { and, desc, eq, ne } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import * as relations from "@pongolinks/db/relations";
import { bookmarks } from "@pongolinks/db/schema";
import * as schema from "@pongolinks/db/schema";

import { ApiError, unexpectedError } from "../../http/result-response";
import type { BookmarkId } from "./bookmark-id";
import type { BookmarkUrl } from "./bookmark-url";
import type { BookmarkDTO, EditableBookmarkRequest } from "./contracts";

export type AppDb = BunSQLiteDatabase<typeof schema & typeof relations>;
export type EditableBookmarkData = Omit<EditableBookmarkRequest, "url"> & { url: BookmarkUrl };

type BookmarkRow = typeof bookmarks.$inferSelect;

function toBookmarkDTO(row: BookmarkRow): BookmarkDTO {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    isPrivate: row.isPrivate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueUrlError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("UNIQUE constraint failed: bookmarks.url") ||
      error.message.includes("bookmarks.url"))
  );
}

export class BookmarksRepository {
  constructor(private readonly db: AppDb) {}

  async list(): Promise<Result<{ bookmarks: BookmarkDTO[] }, ApiError>> {
    try {
      const rows = await this.db.select().from(bookmarks).orderBy(desc(bookmarks.updatedAt));
      return Ok({ bookmarks: rows.map(toBookmarkDTO) });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }

  async findById(id: BookmarkId): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const row = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.id, id.value()),
      });

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

      const row = await this.db
        .insert(bookmarks)
        .values({
          url: input.url.value(),
          title: input.title,
          description: input.description,
          isPrivate: input.isPrivate,
        })
        .returning()
        .get();

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

      const row = await this.db
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

      return Ok(toBookmarkDTO(row));
    } catch (error) {
      if (isUniqueUrlError(error)) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

      return Err(unexpectedError(error));
    }
  }
}
