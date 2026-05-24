import { asc, desc, eq, notExists, sql } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError } from "#/http/result-response.ts";
import type { TagSummaryDTO, UntaggedBookmarkDTO } from "./contracts";
import type { TagName } from "./tag-name.ts";
import { BookmarkTagAttachments, type TagAttachmentDiff } from "./bookmark-tag-attachments.ts";

type TagRow = typeof tags.$inferSelect;
type DeletedTagDTO = {
  deletedTagId: number;
};

type TagLifecycleDb = Pick<AppDb, "delete" | "insert" | "query" | "select" | "update">;

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

function tagUnexpectedError(error: unknown) {
  return new ApiError("Unexpected tag error", "tag.unexpected", 500, { error });
}

export class TagLifecycle {
  private readonly listQuery;
  private readonly bookmarkTagAttachments: BookmarkTagAttachments;

  constructor(private readonly db: AppDb) {
    this.bookmarkTagAttachments = new BookmarkTagAttachments();
    this.listQuery = this.db
      .select({
        id: tags.id,
        name: tags.name,
        nameLower: tags.nameLower,
        usageCount: tags.usageCount,
      })
      .from(tags)
      .orderBy(desc(tags.usageCount), asc(tags.nameLower))
      .prepare();
  }

  async listTags(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
    try {
      const rows = await this.listQuery.all();
      return Ok({ tags: rows });
    } catch (error) {
      return Err(tagUnexpectedError(error));
    }
  }

  async renameTag(id: number, name: TagName): Promise<Result<TagSummaryDTO, ApiError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const source = await tx.query.tags.findFirst({
          where: eq(tags.id, id),
        });
        if (!source) {
          return Err(new ApiError("Tag was not found", "tag.not_found", 404));
        }

        if (name.nameLower() === source.nameLower) {
          const updated = await tx
            .update(tags)
            .set({ name: name.name() })
            .where(eq(tags.id, id))
            .returning()
            .get();

          return Ok(updated);
        }

        const replacement = await tx.query.tags.findFirst({
          where: eq(tags.nameLower, name.nameLower()),
        });

        if (!replacement) {
          const updated = await tx
            .update(tags)
            .set({ name: name.name(), nameLower: name.nameLower() })
            .where(eq(tags.id, id))
            .returning()
            .get();

          return Ok(updated);
        }

        await this.mergeIntoReplacement(tx, source.id, replacement.id);

        const replacementAfterMerge = await tx.query.tags.findFirst({
          where: eq(tags.id, replacement.id),
        });
        if (!replacementAfterMerge) {
          return Err(tagUnexpectedError(new Error("Replacement tag disappeared after merge")));
        }

        return Ok(replacementAfterMerge);
      });

      return result;
    } catch (error) {
      if (isTagNameConflictError(error)) {
        return Err(new ApiError("Tag name already exists", "tag.conflict", 409));
      }

      return Err(tagUnexpectedError(error));
    }
  }

  async deleteTag(id: number): Promise<Result<DeletedTagDTO, ApiError>> {
    try {
      const existing = await this.db.query.tags.findFirst({
        where: eq(tags.id, id),
      });
      if (!existing) {
        return Err(new ApiError("Tag was not found", "tag.not_found", 404));
      }

      await this.db.delete(tags).where(eq(tags.id, id)).run();
      return Ok({ deletedTagId: id });
    } catch (error) {
      return Err(tagUnexpectedError(error));
    }
  }

  async listUntaggedBookmarks(): Promise<
    Result<{ totalCount: number; bookmarks: UntaggedBookmarkDTO[] }, ApiError>
  > {
    try {
      const untaggedPredicate = notExists(
        this.db
          .select({ one: sql<number>`1` })
          .from(bookmarkTags)
          .where(eq(bookmarkTags.bookmarkId, bookmarks.id)),
      );

      const countRow = await this.db
        .select({ totalCount: sql<number>`count(*)` })
        .from(bookmarks)
        .where(untaggedPredicate)
        .get();

      const rows = await this.db
        .select({
          id: bookmarks.id,
          title: bookmarks.title,
        })
        .from(bookmarks)
        .where(untaggedPredicate)
        .orderBy(desc(bookmarks.updatedAt), desc(bookmarks.id))
        .limit(100)
        .all();

      return Ok({
        totalCount: Number(countRow?.totalCount ?? 0),
        bookmarks: rows,
      });
    } catch (error) {
      return Err(tagUnexpectedError(error));
    }
  }

  async replaceBookmarkTags(
    db: TagLifecycleDb,
    bookmarkId: number,
    tagNames: TagName[],
  ): Promise<TagAttachmentDiff> {
    return this.bookmarkTagAttachments.replaceBookmarkTags(db, bookmarkId, tagNames);
  }

  async removeBookmarkTagAttachments(
    db: TagLifecycleDb,
    bookmarkId: number,
  ): Promise<TagAttachmentDiff> {
    return this.bookmarkTagAttachments.removeBookmarkTagAttachments(db, bookmarkId);
  }

  private async mergeIntoReplacement(
    db: TagLifecycleDb,
    sourceTagId: number,
    replacementTagId: number,
  ) {
    const sourceAttachments = await db
      .select({ bookmarkId: bookmarkTags.bookmarkId })
      .from(bookmarkTags)
      .where(eq(bookmarkTags.tagId, sourceTagId))
      .all();

    if (sourceAttachments.length > 0) {
      await db
        .insert(bookmarkTags)
        .values(
          sourceAttachments.map((attachment) => ({
            bookmarkId: attachment.bookmarkId,
            tagId: replacementTagId,
          })),
        )
        .onConflictDoNothing({
          target: [bookmarkTags.bookmarkId, bookmarkTags.tagId],
        })
        .run();
    }

    await db.delete(bookmarkTags).where(eq(bookmarkTags.tagId, sourceTagId)).run();
    await db.delete(tags).where(eq(tags.id, sourceTagId)).run();
  }
}
