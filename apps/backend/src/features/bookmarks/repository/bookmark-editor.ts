import { and, eq, ne } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO, EditableBookmarkData } from "../domain/contracts.ts";
import { toBookmarkDTO } from "./bookmark-dto.ts";
import { BookmarkTagAttachments } from "#/features/tags/bookmark-tag-attachments.ts";
import {
  extractBookmarkRelatedLinkUrls,
  insertBookmarkRelatedLinks,
  syncBookmarkRelatedLinks,
} from "./bookmark-related-links.ts";
import { findBookmarkById } from "./bookmark-loader.ts";

export type BookmarkEditorLogger = {
  set: (context: Record<string, unknown>) => void;
};

export type DeletedBookmarkDTO = {
  deletedBookmarkId: number;
};

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
  private readonly tagAttachments: BookmarkTagAttachments;

  constructor(private readonly db: AppDb) {
    this.tagAttachments = new BookmarkTagAttachments();
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

      const extractedRelatedLinks = extractBookmarkRelatedLinkUrls(input.description);
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

        await this.tagAttachments.replaceBookmarkTags(tx, bookmark.id, input.tags);
        await insertBookmarkRelatedLinks(tx, bookmark.id, extractedRelatedLinks);

        return findBookmarkById(tx, bookmark.id);
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

      const extractedRelatedLinks = extractBookmarkRelatedLinkUrls(input.description);
      log?.set({
        relatedLinks: { extractedCount: extractedRelatedLinks.length },
      });

      const { row, tagDiffCounts, relatedLinkCounts } = await this.db.transaction(async (tx) => {
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

        const tagDiffCounts = await this.tagAttachments.replaceBookmarkTags(
          tx,
          id.value(),
          input.tags,
        );
        const relatedLinkCounts = await syncBookmarkRelatedLinks(
          tx,
          id.value(),
          extractedRelatedLinks,
        );
        const row = await findBookmarkById(tx, id.value());

        return { row, tagDiffCounts, relatedLinkCounts };
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

        const tagDiffCounts = await this.tagAttachments.removeBookmarkTagAttachments(
          tx,
          id.value(),
        );

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
}
