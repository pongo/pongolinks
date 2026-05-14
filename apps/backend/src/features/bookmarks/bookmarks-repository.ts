import { and, asc, desc, eq, ne } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "./domain/bookmark-id.ts";
import type { BookmarkUrl } from "./domain/bookmark-url.ts";
import type { BookmarkDTO, EditableBookmarkRequest } from "./domain/contracts.ts";
import { extractRelatedLinks } from "./utils/extract-related-links.ts";
import type { TagName } from "./domain/tag-name.ts";

export type EditableBookmarkData = Omit<EditableBookmarkRequest, "url" | "tagsText"> & {
  url: BookmarkUrl;
  tags: TagName[];
};

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;
type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};
type BookmarkTagWithTagRow = {
  bookmarkId: number;
  tagId: number;
  tag: TagRow;
};
type TagDiffCounts = {
  submittedCount: number;
  attachedCount: number;
  detachedCount: number;
  retainedCount: number;
  attachedNames: string[];
  detachedNames: string[];
  deletedOrphanNames: string[];
};

type RepositoryDb = Pick<AppDb, "delete" | "insert" | "query" | "update">;
type RepositoryLogger = {
  set: (context: Record<string, unknown>) => void;
};

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

  async create(
    input: EditableBookmarkData,
    log?: RepositoryLogger,
  ): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const existing = await this.db.query.bookmarks.findFirst({
        where: eq(bookmarks.url, input.url.value()),
      });

      if (existing) {
        return Err(new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409));
      }

      const extractedRelatedLinks = extractRelatedLinks(input.description);
      log?.set({
        relatedLinks: {
          extractedCount: extractedRelatedLinks.length,
        },
      });

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
        await this.insertRelatedLinks(tx, bookmark.id, extractedRelatedLinks);

        return this.findBookmarkById(tx, bookmark.id);
      });

      if (!row) {
        return Err(unexpectedError(new Error("Created bookmark was not returned")));
      }

      log?.set({
        relatedLinks: {
          insertedCount: extractedRelatedLinks.length,
        },
      });

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
    log?: RepositoryLogger,
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

      const extractedRelatedLinks = extractRelatedLinks(input.description);
      log?.set({
        relatedLinks: {
          extractedCount: extractedRelatedLinks.length,
        },
      });

      let relatedLinkCounts = {
        insertedCount: 0,
        deletedCount: 0,
        retainedCount: 0,
      };
      let tagDiffCounts: TagDiffCounts = {
        submittedCount: input.tags.length,
        attachedCount: 0,
        detachedCount: 0,
        retainedCount: 0,
        attachedNames: [],
        detachedNames: [],
        deletedOrphanNames: [],
      };

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

        tagDiffCounts = await this.syncBookmarkTags(tx, id.value(), input.tags);
        relatedLinkCounts = await this.syncRelatedLinks(tx, id.value(), extractedRelatedLinks);

        return this.findBookmarkById(tx, id.value());
      });

      if (!row) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      log?.set({
        tags: tagDiffCounts,
        relatedLinks: relatedLinkCounts,
      });

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
        relatedLinks: {
          orderBy: asc(relatedLinks.id),
        },
      },
    });
  }

  private async insertRelatedLinks(db: RepositoryDb, bookmarkId: number, urls: string[]) {
    if (urls.length === 0) {
      return;
    }

    await db
      .insert(relatedLinks)
      .values(urls.map((url) => ({ bookmarkId, url })))
      .run();
  }

  private async syncRelatedLinks(db: RepositoryDb, bookmarkId: number, nextUrls: string[]) {
    const existingRows = await db.query.relatedLinks.findMany({
      where: eq(relatedLinks.bookmarkId, bookmarkId),
      orderBy: asc(relatedLinks.id),
    });
    const nextUrlSet = new Set(nextUrls);
    const existingUrlSet = new Set(existingRows.map((row) => row.url));
    const urlsToInsert = nextUrls.filter((url) => !existingUrlSet.has(url));
    const rowsToDelete = existingRows.filter((row) => !nextUrlSet.has(row.url));
    const urlsToDelete = rowsToDelete.map((row) => row.url);

    for (const row of rowsToDelete) {
      await db.delete(relatedLinks).where(eq(relatedLinks.id, row.id)).run();
    }

    await this.insertRelatedLinks(db, bookmarkId, urlsToInsert);

    return {
      insertedCount: urlsToInsert.length,
      deletedCount: rowsToDelete.length,
      retainedCount: existingRows.length - rowsToDelete.length,
      urlsToInsert,
      urlsToDelete,
    };
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

  private async syncBookmarkTags(
    db: RepositoryDb,
    bookmarkId: number,
    tagNames: TagName[],
  ): Promise<TagDiffCounts> {
    const existingRows = await this.findBookmarkTagsWithTags(db, bookmarkId);
    const submittedTags: TagRow[] = [];

    for (const tagName of tagNames) {
      submittedTags.push(await this.findOrCreateTag(db, tagName));
    }

    const submittedNameLowerSet = new Set(submittedTags.map((tag) => tag.nameLower));
    const existingByNameLower = new Map(existingRows.map((row) => [row.tag.nameLower, row]));
    const tagsToAttach = submittedTags.filter((tag) => !existingByNameLower.has(tag.nameLower));
    const rowsToDetach = existingRows.filter(
      (row) => !submittedNameLowerSet.has(row.tag.nameLower),
    );
    const retainedCount = existingRows.length - rowsToDetach.length;

    for (const tag of tagsToAttach) {
      await db
        .insert(bookmarkTags)
        .values({
          bookmarkId,
          tagId: tag.id,
        })
        .run();
    }

    for (const row of rowsToDetach) {
      await db
        .delete(bookmarkTags)
        .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, row.tagId)))
        .run();
    }

    const deletedOrphanTags = await this.deleteOrphanTags(db, rowsToDetach);

    return {
      submittedCount: submittedTags.length,
      attachedCount: tagsToAttach.length,
      detachedCount: rowsToDetach.length,
      retainedCount,
      attachedNames: tagsToAttach.map((tag) => tag.name),
      detachedNames: rowsToDetach.map((row) => row.tag.name),
      deletedOrphanNames: deletedOrphanTags.map((tag) => tag.name),
    };
  }

  private async findBookmarkTagsWithTags(
    db: RepositoryDb,
    bookmarkId: number,
  ): Promise<BookmarkTagWithTagRow[]> {
    return db.query.bookmarkTags.findMany({
      where: eq(bookmarkTags.bookmarkId, bookmarkId),
      with: {
        tag: true,
      },
    });
  }

  private async deleteOrphanTags(
    db: RepositoryDb,
    detachedRows: BookmarkTagWithTagRow[],
  ): Promise<TagRow[]> {
    const deletedTags: TagRow[] = [];

    for (const row of detachedRows) {
      const remainingLink = await db.query.bookmarkTags.findFirst({
        where: eq(bookmarkTags.tagId, row.tagId),
      });

      if (remainingLink) {
        continue;
      }

      await db.delete(tags).where(eq(tags.id, row.tagId)).run();
      deletedTags.push(row.tag);
    }

    return deletedTags;
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
