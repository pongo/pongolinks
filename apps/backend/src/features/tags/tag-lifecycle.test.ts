import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import type { Result } from "@pongolinks/shared/result";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createMigratedTestDb } from "#test/test-db.ts";
import { BookmarkTagAttachments } from "./bookmark-tag-attachments.ts";
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
  it("renames a Tag into an existing Tag by merging unique Bookmark attachments", async () => {
    await withTagLifecycle(async ({ tags: tagLifecycle, db }) => {
      const first = await createBookmarkRow(db, "https://example.com/first");
      const second = await createBookmarkRow(db, "https://example.com/second");
      const third = await createBookmarkRow(db, "https://example.com/third");

      await db.transaction(async (tx) => {
        const attachments = new BookmarkTagAttachments(tx);

        await attachments.replaceBookmarkTags(first.id, [tagName("alpha"), tagName("beta")]);
        await attachments.replaceBookmarkTags(second.id, [tagName("alpha")]);
        await attachments.replaceBookmarkTags(third.id, [tagName("beta")]);
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
