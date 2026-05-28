import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";

import { createDb } from "../src";
import { authSessions, bookmarks, bookmarkTags, relatedLinks, tags } from "../src/schema";

const migrationsFolder = fileURLToPath(new URL("../drizzle/migrations", import.meta.url));

describe("database migrations", () => {
  it("applies SQLite migrations and verifies bookmark timestamp behavior", async () => {
    const { db, client, close } = await createDb({ databasePath: ":memory:" });

    try {
      await migrate(db, { migrationsFolder });

      const tablesResult = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      const tables = tablesResult.rows.map((table) => String(table.name));

      expect(tables).toEqual(
        expect.arrayContaining([
          "bookmarks",
          "tags",
          "bookmark_tags",
          "related_links",
          "auth_sessions",
          "bookmarks_fts",
        ]),
      );

      const triggersResult = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name",
      );
      const triggers = triggersResult.rows.map((trigger) => String(trigger.name));

      expect(triggers).not.toContain("update_bookmarks_updated_at");
      expect(triggers).toEqual(
        expect.arrayContaining([
          "bookmarks_ai",
          "bookmarks_bu",
          "bookmarks_au",
          "bookmarks_bd",
          "tags_usage_count_ai",
          "tags_usage_count_ad",
          "tags_usage_count_au_tag_id",
        ]),
      );

      const bookmarkIndexesResult = await client.execute("PRAGMA index_list('bookmarks')");
      const bookmarkIndexNames = bookmarkIndexesResult.rows.map((index) => String(index.name));

      expect(bookmarkIndexNames).toContain("idx_bookmarks_updated_at_id");
      expect(bookmarkIndexNames).not.toContain("idx_bookmarks_updated_at");

      const bookmarkListIndexResult = await client.execute(
        "PRAGMA index_xinfo('idx_bookmarks_updated_at_id')",
      );
      const bookmarkListIndexColumns = bookmarkListIndexResult.rows
        .filter((column) => Number(column.key) === 1)
        .map((column) => ({
          name: String(column.name),
          desc: Number(column.desc),
        }));

      expect(bookmarkListIndexColumns).toEqual([
        { name: "updated_at", desc: 1 },
        { name: "id", desc: 1 },
      ]);

      const tagIndexesResult = await client.execute("PRAGMA index_list('tags')");
      const tagIndexNames = tagIndexesResult.rows.map((index) => String(index.name));

      expect(tagIndexNames).toContain("idx_tags_usage_count_name");

      const tagPopularityIndexResult = await client.execute(
        "PRAGMA index_xinfo('idx_tags_usage_count_name')",
      );
      const tagPopularityIndexColumns = tagPopularityIndexResult.rows
        .filter((column) => Number(column.key) === 1)
        .map((column) => ({
          name: String(column.name),
          desc: Number(column.desc),
        }));

      expect(tagPopularityIndexColumns).toEqual([
        { name: "usage_count", desc: 1 },
        { name: "name_lower", desc: 0 },
      ]);

      const authSessionIndexesResult = await client.execute("PRAGMA index_list('auth_sessions')");
      const authSessionIndexNames = authSessionIndexesResult.rows.map((index) =>
        String(index.name),
      );

      expect(authSessionIndexNames).toEqual(
        expect.arrayContaining(["auth_sessions_token_hash_unique", "idx_auth_sessions_expires_at"]),
      );

      const initialUpdatedAt = "2000-01-01 00:00:00";
      const { id: firstBookmarkId } = await db
        .insert(bookmarks)
        .values({
          url: "https://example.com/first",
          title: "First",
          updatedAt: initialUpdatedAt,
        })
        .returning({ id: bookmarks.id })
        .get();

      const { updatedAt: runtimeUpdatedAt } = await db
        .update(bookmarks)
        .set({ title: "First updated" })
        .where(eq(bookmarks.id, firstBookmarkId))
        .returning({ updatedAt: bookmarks.updatedAt })
        .get();

      expect(runtimeUpdatedAt).not.toBe(initialUpdatedAt);

      const explicitUpdatedAt = "1999-01-01 00:00:00";
      const { id: secondBookmarkId } = await db
        .insert(bookmarks)
        .values({
          url: "https://example.com/second",
          title: "Second",
          updatedAt: initialUpdatedAt,
        })
        .returning({ id: bookmarks.id })
        .get();

      const { updatedAt: explicitResult } = await db
        .update(bookmarks)
        .set({ title: "Second updated", updatedAt: explicitUpdatedAt })
        .where(eq(bookmarks.id, secondBookmarkId))
        .returning({ updatedAt: bookmarks.updatedAt })
        .get();

      expect(explicitResult).toBe(explicitUpdatedAt);

      await db
        .insert(relatedLinks)
        .values({
          bookmarkId: firstBookmarkId,
          url: "https://example.com/related",
        })
        .run();

      const { id: secondTagId } = await db
        .insert(tags)
        .values({ name: "Gamma", nameLower: "gamma" })
        .returning({ id: tags.id })
        .get();

      const { id: firstTagId } = await db
        .insert(tags)
        .values({ name: "Alpha", nameLower: "alpha" })
        .returning({ id: tags.id })
        .get();

      await db
        .insert(bookmarkTags)
        .values({ bookmarkId: firstBookmarkId, tagId: firstTagId })
        .run();

      const firstTagAfterInsert = await db.query.tags.findFirst({
        where: eq(tags.id, firstTagId),
      });
      expect(firstTagAfterInsert?.usageCount).toBe(1);

      await db
        .update(bookmarkTags)
        .set({ tagId: secondTagId })
        .where(eq(bookmarkTags.bookmarkId, firstBookmarkId))
        .run();

      const firstTagAfterMove = await db.query.tags.findFirst({
        where: eq(tags.id, firstTagId),
      });
      const secondTagAfterMove = await db.query.tags.findFirst({
        where: eq(tags.id, secondTagId),
      });
      expect(firstTagAfterMove?.usageCount).toBe(0);
      expect(secondTagAfterMove?.usageCount).toBe(1);

      await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, firstBookmarkId)).run();

      const secondTagAfterDelete = await db.query.tags.findFirst({
        where: eq(tags.id, secondTagId),
      });
      expect(secondTagAfterDelete?.usageCount).toBe(0);

      await expect(
        db.update(tags).set({ usageCount: -1 }).where(eq(tags.id, secondTagId)).run(),
      ).rejects.toThrow();

      await expect(
        db
          .insert(relatedLinks)
          .values({
            bookmarkId: firstBookmarkId,
            url: "https://example.com/related",
          })
          .run(),
      ).rejects.toThrow(
        /related_links\.bookmark_id, related_links\.url|related_links.*bookmark_id.*url/,
      );

      await expect(
        db.insert(authSessions).values({ tokenHash: "", expiresAt: "2030-01-01 00:00:00" }).run(),
      ).rejects.toThrow();
    } finally {
      close();
    }
  });
});
