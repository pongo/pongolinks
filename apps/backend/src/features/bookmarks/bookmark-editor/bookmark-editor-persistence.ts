import { and, eq, ne } from "drizzle-orm";

import type { ValidUrl } from "@pongolinks/shared/brands";
import { bookmarks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { BookmarkTagAttachments, type TagName } from "#/features/tags/api.ts";
import type {
  BookmarkEditorPersistence,
  BookmarkEditorPersistenceTransaction,
  EditableBookmarkFields,
  RelatedLinkSyncDiff,
} from "./types.ts";
import { toBookmarkDTO } from "../repository/bookmark-dto.ts";
import { findBookmarkById } from "../repository/bookmark-loader.ts";
import {
  insertBookmarkRelatedLinks,
  syncBookmarkRelatedLinks,
} from "../repository/bookmark-related-links.ts";

type BookmarkEditorDb = Pick<AppDb, "delete" | "insert" | "query" | "update">;

function errorMessageChain(error: unknown): string[] {
  const messages: string[] = [];
  let current = error;

  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }

  return messages;
}

function isUniqueUrlError(error: unknown) {
  return errorMessageChain(error).some(
    (message) =>
      message.includes("UNIQUE constraint failed: bookmarks.url") ||
      message.includes("bookmarks.url"),
  );
}

class DrizzleBookmarkEditorTransaction implements BookmarkEditorPersistenceTransaction {
  private readonly tagAttachments: BookmarkTagAttachments;

  constructor(private readonly db: BookmarkEditorDb) {
    this.tagAttachments = new BookmarkTagAttachments(db);
  }

  async createBookmark(input: EditableBookmarkFields): Promise<number> {
    const bookmark = await this.db
      .insert(bookmarks)
      .values({
        url: input.url,
        title: input.title,
        description: input.description,
        isPrivate: input.isPrivate,
      })
      .returning({ id: bookmarks.id })
      .get();

    return bookmark.id;
  }

  async updateBookmark(id: number, input: EditableBookmarkFields): Promise<void> {
    await this.db
      .update(bookmarks)
      .set({
        url: input.url,
        title: input.title,
        description: input.description,
        isPrivate: input.isPrivate,
      })
      .where(eq(bookmarks.id, id))
      .returning()
      .get();
  }

  async deleteBookmark(id: number): Promise<void> {
    await this.db.delete(bookmarks).where(eq(bookmarks.id, id)).run();
  }

  async loadBookmark(id: number) {
    const row = await findBookmarkById(this.db, id);

    return row ? toBookmarkDTO(row) : undefined;
  }

  async replaceBookmarkTags(bookmarkId: number, tagNames: TagName[]) {
    return this.tagAttachments.replaceBookmarkTags(bookmarkId, tagNames);
  }

  async removeBookmarkTagAttachments(bookmarkId: number) {
    return this.tagAttachments.removeBookmarkTagAttachments(bookmarkId);
  }

  async insertRelatedLinks(bookmarkId: number, urls: ValidUrl[]) {
    await insertBookmarkRelatedLinks(this.db, bookmarkId, urls);
  }

  async syncRelatedLinks(bookmarkId: number, urls: ValidUrl[]): Promise<RelatedLinkSyncDiff> {
    return syncBookmarkRelatedLinks(this.db, bookmarkId, urls);
  }
}

export class DrizzleBookmarkEditorPersistence implements BookmarkEditorPersistence {
  constructor(private readonly db: AppDb) {}

  async findBookmarkIdByUrl(url: EditableBookmarkFields["url"]): Promise<number | undefined> {
    const row = await this.db.query.bookmarks.findFirst({
      where: eq(bookmarks.url, url),
      columns: { id: true },
    });

    return row?.id;
  }

  async findBookmarkIdById(id: number): Promise<number | undefined> {
    const row = await this.db.query.bookmarks.findFirst({
      where: eq(bookmarks.id, id),
      columns: { id: true },
    });

    return row?.id;
  }

  async findBookmarkIdByUrlExcludingId(
    url: EditableBookmarkFields["url"],
    excludedId: number,
  ): Promise<number | undefined> {
    const row = await this.db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.url, url), ne(bookmarks.id, excludedId)),
      columns: { id: true },
    });

    return row?.id;
  }

  async transaction<T>(run: (tx: BookmarkEditorPersistenceTransaction) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => run(new DrizzleBookmarkEditorTransaction(tx)));
  }

  isUniqueBookmarkUrlError(error: unknown): boolean {
    return isUniqueUrlError(error);
  }
}
