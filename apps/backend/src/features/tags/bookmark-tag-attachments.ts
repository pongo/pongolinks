import { and, eq } from "drizzle-orm";

import { bookmarkTags, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import type { TagName } from "./tag-name.ts";

type TagRow = typeof tags.$inferSelect;
type BookmarkTagWithTagRow = {
  bookmarkId: number;
  tagId: number;
  tag: TagRow;
};

export type TagAttachmentDiff = {
  submittedCount: number;
  attachedCount: number;
  detachedCount: number;
  retainedCount: number;
  attachedNames: string[];
  detachedNames: string[];
  deletedOrphanNames: string[];
};

type BookmarkTagAttachmentDb = Pick<AppDb, "delete" | "insert" | "query">;

function errorMessageChain(error: unknown): string[] {
  const messages: string[] = [];
  let current = error;

  while (current instanceof Error) {
    messages.push(current.message);
    current = current.cause;
  }

  return messages;
}

function isTagNameConflictError(error: unknown) {
  return errorMessageChain(error).some(
    (message) =>
      message.includes("UNIQUE constraint failed: tags.name_lower") ||
      message.includes("tags.name_lower"),
  );
}

export class BookmarkTagAttachments {
  constructor(private readonly db: BookmarkTagAttachmentDb) {}

  async replaceBookmarkTags(bookmarkId: number, tagNames: TagName[]): Promise<TagAttachmentDiff> {
    const existingRows = await this.findBookmarkTagsWithTags(bookmarkId);
    const submittedTags: TagRow[] = [];

    for (const tagName of tagNames) {
      submittedTags.push(await this.findOrCreateTag(tagName));
    }

    const submittedNameLowerSet = new Set(submittedTags.map((tag) => tag.nameLower));
    const existingByNameLower = new Map(existingRows.map((row) => [row.tag.nameLower, row]));
    const tagsToAttach = submittedTags.filter((tag) => !existingByNameLower.has(tag.nameLower));
    const rowsToDetach = existingRows.filter(
      (row) => !submittedNameLowerSet.has(row.tag.nameLower),
    );
    const retainedCount = existingRows.length - rowsToDetach.length;

    for (const tag of tagsToAttach) {
      await this.db
        .insert(bookmarkTags)
        .values({
          bookmarkId,
          tagId: tag.id,
        })
        .run();
    }

    for (const row of rowsToDetach) {
      await this.db
        .delete(bookmarkTags)
        .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, row.tagId)))
        .run();
    }

    const deletedOrphanTags = await this.deleteOrphanTags(rowsToDetach);

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

  async removeBookmarkTagAttachments(bookmarkId: number): Promise<TagAttachmentDiff> {
    return this.replaceBookmarkTags(bookmarkId, []);
  }

  private async findBookmarkTagsWithTags(bookmarkId: number): Promise<BookmarkTagWithTagRow[]> {
    return this.db.query.bookmarkTags.findMany({
      where: eq(bookmarkTags.bookmarkId, bookmarkId),
      with: {
        tag: true,
      },
    });
  }

  private async deleteOrphanTags(detachedRows: BookmarkTagWithTagRow[]): Promise<TagRow[]> {
    const deletedTags: TagRow[] = [];

    for (const row of detachedRows) {
      const remainingLink = await this.db.query.bookmarkTags.findFirst({
        where: eq(bookmarkTags.tagId, row.tagId),
      });

      if (remainingLink) {
        continue;
      }

      await this.db.delete(tags).where(eq(tags.id, row.tagId)).run();
      deletedTags.push(row.tag);
    }

    return deletedTags;
  }

  private async findOrCreateTag(tagName: TagName): Promise<TagRow> {
    const existing = await this.db.query.tags.findFirst({
      where: eq(tags.nameLower, tagName.nameLower()),
    });

    if (existing) {
      return existing;
    }

    try {
      return await this.db
        .insert(tags)
        .values({
          name: tagName.name(),
          nameLower: tagName.nameLower(),
        })
        .returning()
        .get();
    } catch (error) {
      if (!isTagNameConflictError(error)) {
        throw error;
      }

      const tag = await this.db.query.tags.findFirst({
        where: eq(tags.nameLower, tagName.nameLower()),
      });

      if (!tag) {
        throw error;
      }

      return tag;
    }
  }
}
