import { asc, eq } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkDTO, EditableBookmarkData } from "./domain/contracts.ts";
import { extractRelatedLinks } from "./utils/extract-related-links.ts";
import type { TagName } from "./domain/tag-name.ts";

export type BookmarkEditorLogger = {
  set: (context: Record<string, unknown>) => void;
};

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;
type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};

type EditorDb = Pick<AppDb, "delete" | "insert" | "query">;

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

export class BookmarkEditor {
  constructor(private readonly db: AppDb) {}

  async create(
    input: EditableBookmarkData,
    log?: BookmarkEditorLogger,
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

  private async findBookmarkById(db: EditorDb, id: number) {
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

  private async insertRelatedLinks(db: EditorDb, bookmarkId: number, urls: string[]) {
    if (urls.length === 0) {
      return;
    }

    await db
      .insert(relatedLinks)
      .values(urls.map((url) => ({ bookmarkId, url })))
      .run();
  }

  private async replaceBookmarkTags(db: EditorDb, bookmarkId: number, tagNames: TagName[]) {
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

  private async findOrCreateTag(db: EditorDb, tagName: TagName): Promise<TagRow> {
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
