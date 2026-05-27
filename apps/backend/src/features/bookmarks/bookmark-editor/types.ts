import type { ValidUrl } from "@pongolinks/shared/brands";
import type { BookmarkDTO } from "#/features/bookmarks/domain/contracts.ts";
import type { TagName } from "#/features/tags/tag-name.ts";
import type { TagAttachmentDiff } from "#/features/tags/bookmark-tag-attachments.ts";

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
