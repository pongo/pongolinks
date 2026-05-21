import { and, asc, eq, ne } from "drizzle-orm";
import { extractRelatedLinkUrls } from "@pongolinks/shared/bookmark-description";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO, EditableBookmarkData } from "../domain/contracts.ts";
import { toBookmarkDTO } from "./bookmark-dto.ts";
import type { ValidUrl } from "@pongolinks/shared/brands";
import { TagLifecycle, type TagAttachmentDiff } from "#/features/tags/tag-lifecycle.ts";

export type BookmarkEditorLogger = {
  set: (context: Record<string, unknown>) => void;
};

export type DeletedBookmarkDTO = {
  deletedBookmarkId: number;
};

type EditorDb = Pick<AppDb, "delete" | "insert" | "query" | "update">;

function isUniqueUrlError(error: unknown) {
  return errorMessageChain(error).some(
    (message) =>
      message.includes("UNIQUE constraint failed: bookmarks.url") ||
      message.includes("bookmarks.url"),
  );
}
function errorMessageChain(error: unknown): string[] {
  const messages: string[] = [];
  let current = error;

  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }

  return messages;
}

export class BookmarkEditor {
  private readonly tagLifecycle: TagLifecycle;

  constructor(private readonly db: AppDb) {
    this.tagLifecycle = new TagLifecycle(db);
  }

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

      const extractedRelatedLinks = extractRelatedLinkUrls(input.description);
      log?.set({
        relatedLinks: { extractedCount: extractedRelatedLinks.length },
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

        await this.tagLifecycle.replaceBookmarkTags(tx, bookmark.id, input.tags);
        await this.insertRelatedLinks(tx, bookmark.id, extractedRelatedLinks);

        return this.findBookmarkById(tx, bookmark.id);
      });

      if (!row) {
        return Err(unexpectedError(new Error("Created bookmark was not returned")));
      }

      log?.set({
        relatedLinks: { insertedCount: extractedRelatedLinks.length },
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
    log?: BookmarkEditorLogger,
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

      const extractedRelatedLinks = extractRelatedLinkUrls(input.description);
      log?.set({
        relatedLinks: { extractedCount: extractedRelatedLinks.length },
      });

      let relatedLinkCounts = { insertedCount: 0, deletedCount: 0, retainedCount: 0 };
      let tagDiffCounts: TagAttachmentDiff = {
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

        tagDiffCounts = await this.tagLifecycle.replaceBookmarkTags(tx, id.value(), input.tags);
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

  async delete(
    id: BookmarkId,
    log?: BookmarkEditorLogger,
  ): Promise<Result<DeletedBookmarkDTO, ApiError>> {
    try {
      const deletedBookmarkId = await this.db.transaction(async (tx) => {
        const existing = await tx.query.bookmarks.findFirst({
          where: eq(bookmarks.id, id.value()),
        });

        if (!existing) {
          return undefined;
        }

        const tagDiffCounts = await this.tagLifecycle.removeBookmarkTagAttachments(tx, id.value());

        await tx.delete(bookmarks).where(eq(bookmarks.id, id.value())).run();

        log?.set({
          tags: {
            detachedCount: tagDiffCounts.detachedCount,
            deletedOrphanNames: tagDiffCounts.deletedOrphanNames,
          },
        });

        return existing.id;
      });

      if (deletedBookmarkId === undefined) {
        return Err(new ApiError("Bookmark was not found", "bookmark.not_found", 404));
      }

      log?.set({ bookmark: { deletedId: deletedBookmarkId } });

      return Ok({ deletedBookmarkId });
    } catch (error) {
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

  private async insertRelatedLinks(db: EditorDb, bookmarkId: number, urls: ValidUrl[]) {
    if (urls.length === 0) {
      return;
    }

    await db
      .insert(relatedLinks)
      .values(urls.map((url) => ({ bookmarkId, url })))
      .run();
  }

  private async syncRelatedLinks(db: EditorDb, bookmarkId: number, nextUrls: ValidUrl[]) {
    const existingRows = await db.query.relatedLinks.findMany({
      where: eq(relatedLinks.bookmarkId, bookmarkId),
      orderBy: asc(relatedLinks.id),
    });
    const nextUrlSet = new Set(nextUrls);
    const existingUrlSet = new Set(existingRows.map((row) => row.url as ValidUrl));
    const urlsToInsert = nextUrls.filter((url) => !existingUrlSet.has(url));
    const rowsToDelete = existingRows.filter((row) => !nextUrlSet.has(row.url as ValidUrl));
    const urlsToDelete = rowsToDelete.map((row) => row.url as ValidUrl);

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
}
