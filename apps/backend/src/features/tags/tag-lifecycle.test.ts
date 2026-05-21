import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import type { Result } from "@pongolinks/shared/result";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createMigratedTestDb } from "#test/test-db.ts";
import { TagLifecycle } from "./tag-lifecycle.ts";
import { TagName } from "./tag-name.ts";

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

async function withTagLifecycle(
  run: (context: { tags: TagLifecycle; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();

  try {
    await run({
      tags: new TagLifecycle(database.db),
      db: database.db,
    });
  } finally {
    database.close();
  }
}

describe("Tag lifecycle", () => {
  it("replaces Bookmark Tags while preserving retained rows and deleting orphan Tags", async () => {
    await withTagLifecycle(async ({ tags: tagLifecycle, db }) => {
      const target = await createBookmarkRow(db, "https://example.com/target");
      const other = await createBookmarkRow(db, "https://example.com/other");

      await db.transaction(async (tx) => {
        await tagLifecycle.replaceBookmarkTags(tx, target.id, [
          tagName("alpha"),
          tagName("beta"),
          tagName("shared"),
        ]);
        await tagLifecycle.replaceBookmarkTags(tx, other.id, [tagName("shared")]);
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
        tagLifecycle.replaceBookmarkTags(tx, target.id, [tagName("beta"), tagName("gamma")]),
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
    });
  });

  it("renames a Tag into an existing Tag by merging unique Bookmark attachments", async () => {
    await withTagLifecycle(async ({ tags: tagLifecycle, db }) => {
      const first = await createBookmarkRow(db, "https://example.com/first");
      const second = await createBookmarkRow(db, "https://example.com/second");
      const third = await createBookmarkRow(db, "https://example.com/third");

      await db.transaction(async (tx) => {
        await tagLifecycle.replaceBookmarkTags(tx, first.id, [tagName("alpha"), tagName("beta")]);
        await tagLifecycle.replaceBookmarkTags(tx, second.id, [tagName("alpha")]);
        await tagLifecycle.replaceBookmarkTags(tx, third.id, [tagName("beta")]);
      });

      const alpha = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
      const beta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") });
      expect(alpha).toBeDefined();
      expect(beta).toBeDefined();
      if (!alpha || !beta) return;

      const result = unwrapResult(await tagLifecycle.renameTag(alpha.id, tagName("beta")));
      const alphaAfter = await db.query.tags.findFirst({ where: eq(tags.id, alpha.id) });
      const betaAfter = await db.query.tags.findFirst({ where: eq(tags.id, beta.id) });
      const betaLinks = await db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.tagId, beta.id),
      });

      expect(result.id).toBe(beta.id);
      expect(alphaAfter).toBeUndefined();
      expect(betaAfter?.usageCount).toBe(3);
      expect(betaLinks).toHaveLength(3);
    });
  });
});
