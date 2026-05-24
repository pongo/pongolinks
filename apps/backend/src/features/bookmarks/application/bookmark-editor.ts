import type { ValidUrl } from "@pongolinks/shared/brands";
import { extractRelatedLinkUrls } from "@pongolinks/shared/bookmark-description";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { ApiError, unexpectedError } from "#/http/result-response.ts";
import type { TagAttachmentDiff } from "#/features/tags/bookmark-tag-attachments.ts";
import type { TagName } from "#/features/tags/tag-name.ts";
import type { BookmarkId } from "../domain/bookmark-id.ts";
import type { BookmarkDTO, EditableBookmarkData } from "../domain/contracts.ts";

export type BookmarkEditorLogger = {
  set: (context: Record<string, unknown>) => void;
};

export type DeletedBookmarkDTO = {
  deletedBookmarkId: number;
};

export type EditableBookmarkFields = {
  url: ValidUrl;
  title: string;
  description: string;
  isPrivate: boolean;
};

export type RelatedLinkSyncDiff = {
  insertedCount: number;
  deletedCount: number;
  retainedCount: number;
  urlsToInsert: ValidUrl[];
  urlsToDelete: ValidUrl[];
};

export interface BookmarkEditorPersistenceTransaction {
  createBookmark(input: EditableBookmarkFields): Promise<number>;
  updateBookmark(id: number, input: EditableBookmarkFields): Promise<void>;
  deleteBookmark(id: number): Promise<void>;
  loadBookmark(id: number): Promise<BookmarkDTO | undefined>;
  replaceBookmarkTags(bookmarkId: number, tagNames: TagName[]): Promise<TagAttachmentDiff>;
  removeBookmarkTagAttachments(bookmarkId: number): Promise<TagAttachmentDiff>;
  insertRelatedLinks(bookmarkId: number, urls: ValidUrl[]): Promise<void>;
  syncRelatedLinks(bookmarkId: number, urls: ValidUrl[]): Promise<RelatedLinkSyncDiff>;
}

export interface BookmarkEditorPersistence {
  findBookmarkIdByUrl(url: ValidUrl): Promise<number | undefined>;
  findBookmarkIdById(id: number): Promise<number | undefined>;
  findBookmarkIdByUrlExcludingId(url: ValidUrl, excludedId: number): Promise<number | undefined>;
  transaction<T>(run: (tx: BookmarkEditorPersistenceTransaction) => Promise<T>): Promise<T>;
  isUniqueBookmarkUrlError(error: unknown): boolean;
}

function editableFields(input: EditableBookmarkData): EditableBookmarkFields {
  return {
    url: input.url.value(),
    title: input.title,
    description: input.description,
    isPrivate: input.isPrivate,
  };
}

function extractBookmarkRelatedLinkUrls(description: string): ValidUrl[] {
  return extractRelatedLinkUrls(description);
}

export class BookmarkEditor {
  constructor(private readonly persistence: BookmarkEditorPersistence) {}

  async create(
    input: EditableBookmarkData,
    log?: BookmarkEditorLogger,
  ): Promise<Result<BookmarkDTO, ApiError>> {
    try {
      const existingId = await this.persistence.findBookmarkIdByUrl(input.url.value());

      if (existingId !== undefined) {
        return Err(BookmarkEditor.duplicateUrlError());
      }

      const extractedRelatedLinks = extractBookmarkRelatedLinkUrls(input.description);
      log?.set({
        relatedLinks: { extractedCount: extractedRelatedLinks.length },
      });

      const row = await this.persistence.transaction(async (tx) => {
        const bookmarkId = await tx.createBookmark(editableFields(input));

        await tx.replaceBookmarkTags(bookmarkId, input.tags);
        await tx.insertRelatedLinks(bookmarkId, extractedRelatedLinks);

        return tx.loadBookmark(bookmarkId);
      });

      if (!row) {
        return Err(unexpectedError(new Error("Created bookmark was not returned")));
      }

      log?.set({
        relatedLinks: { insertedCount: extractedRelatedLinks.length },
      });

      return Ok(row);
    } catch (error) {
      if (this.persistence.isUniqueBookmarkUrlError(error)) {
        return Err(BookmarkEditor.duplicateUrlError());
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
      const existingId = await this.persistence.findBookmarkIdById(id.value());

      if (existingId === undefined) {
        return Err(BookmarkEditor.notFoundError());
      }

      const duplicateId = await this.persistence.findBookmarkIdByUrlExcludingId(
        input.url.value(),
        id.value(),
      );

      if (duplicateId !== undefined) {
        return Err(BookmarkEditor.duplicateUrlError());
      }

      const extractedRelatedLinks = extractBookmarkRelatedLinkUrls(input.description);
      log?.set({
        relatedLinks: { extractedCount: extractedRelatedLinks.length },
      });

      const { row, tagDiffCounts, relatedLinkCounts } = await this.persistence.transaction(
        async (tx) => {
          await tx.updateBookmark(id.value(), editableFields(input));

          const tagDiffCounts = await tx.replaceBookmarkTags(id.value(), input.tags);
          const relatedLinkCounts = await tx.syncRelatedLinks(id.value(), extractedRelatedLinks);
          const row = await tx.loadBookmark(id.value());

          return { row, tagDiffCounts, relatedLinkCounts };
        },
      );

      if (!row) {
        return Err(BookmarkEditor.notFoundError());
      }

      log?.set({
        tags: tagDiffCounts,
        relatedLinks: relatedLinkCounts,
      });

      return Ok(row);
    } catch (error) {
      if (this.persistence.isUniqueBookmarkUrlError(error)) {
        return Err(BookmarkEditor.duplicateUrlError());
      }

      return Err(unexpectedError(error));
    }
  }

  async delete(
    id: BookmarkId,
    log?: BookmarkEditorLogger,
  ): Promise<Result<DeletedBookmarkDTO, ApiError>> {
    try {
      const deletedBookmarkId = await this.persistence.transaction(async (tx) => {
        const existing = await tx.loadBookmark(id.value());

        if (!existing) {
          return undefined;
        }

        const tagDiffCounts = await tx.removeBookmarkTagAttachments(id.value());

        await tx.deleteBookmark(id.value());

        log?.set({
          tags: {
            detachedCount: tagDiffCounts.detachedCount,
            deletedOrphanNames: tagDiffCounts.deletedOrphanNames,
          },
        });

        return existing.id;
      });

      if (deletedBookmarkId === undefined) {
        return Err(BookmarkEditor.notFoundError());
      }

      log?.set({ bookmark: { deletedId: deletedBookmarkId } });

      return Ok({ deletedBookmarkId });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }

  private static duplicateUrlError() {
    return new ApiError("Bookmark URL already exists", "bookmark.url_duplicate", 409);
  }

  private static notFoundError() {
    return new ApiError("Bookmark was not found", "bookmark.not_found", 404);
  }
}
