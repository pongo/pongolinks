import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import type { Result } from "@pongolinks/shared/result";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createMigratedTestDb } from "#test/test-db.ts";
import { BookmarkTagAttachments, TagName } from "./api.ts";

type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

function unwrapResult<T, E extends Error>(result: Result<T, E>): T {
  expect(result.isOk).toBe(true);

  if (result.isErr) {
    throw result.error;
  }

  return result.value;
}

function tagName(name: string) {
  return unwrapResult(TagName.from(name));
}

async function createBookmarkRow(db: TestDb["db"], url: string, title = "Example") {
  return db
    .insert(bookmarks)
    .values({
      url,
      title,
    })
    .returning({ id: bookmarks.id })
    .get();
}

describe("Bookmark Tag attachments", () => {
  it("replaces Bookmark Tags while preserving retained rows and deleting orphan Tags", async () => {
    const database = await createMigratedTestDb();

    try {
      const db = database.db;
      const target = await createBookmarkRow(db, "https://example.com/target");
      const other = await createBookmarkRow(db, "https://example.com/other");

      await db.transaction(async (tx) => {
        const attachments = new BookmarkTagAttachments(tx);

        await attachments.replaceBookmarkTags(target.id, [
          tagName("alpha"),
          tagName("beta"),
          tagName("shared"),
        ]);
        await attachments.replaceBookmarkTags(other.id, [tagName("shared")]);
      });

      const beta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") });
      const shared = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
      expect(beta).toBeDefined();
      expect(shared).toBeDefined();
      if (!beta || !shared) return;

      const betaLinkBefore = await db
        .select({ rowId: sql<number>`rowid` })
        .from(bookmarkTags)
        .where(eq(bookmarkTags.tagId, beta.id))
        .get();

      const diff = await db.transaction((tx) =>
        new BookmarkTagAttachments(tx).replaceBookmarkTags(target.id, [
          tagName("beta"),
          tagName("gamma"),
        ]),
      );

      const alphaAfter = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
      const betaLinkAfter = await db
        .select({ rowId: sql<number>`rowid` })
        .from(bookmarkTags)
        .where(eq(bookmarkTags.tagId, beta.id))
        .get();
      const sharedAfter = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
      const sharedLinks = await db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.tagId, shared.id),
      });

      expect(diff).toMatchObject({
        submittedCount: 2,
        attachedCount: 1,
        detachedCount: 2,
        retainedCount: 1,
        attachedNames: ["gamma"],
        deletedOrphanNames: ["alpha"],
      });
      expect(alphaAfter).toBeUndefined();
      expect(betaLinkAfter?.rowId).toBe(betaLinkBefore?.rowId);
      expect(sharedAfter?.id).toBe(shared.id);
      expect(sharedLinks).toEqual([{ bookmarkId: other.id, tagId: shared.id }]);
    } finally {
      database.close();
    }
  });
});
