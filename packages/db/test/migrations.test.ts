import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { describe, expect, it } from "vitest";

import { createDb } from "../src";
import { bookmarks, relatedLinks } from "../src/schema";

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
          "bookmarks_fts",
        ]),
      );

      const triggersResult = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name",
      );
      const triggers = triggersResult.rows.map((trigger) => String(trigger.name));

      expect(triggers).not.toContain("update_bookmarks_updated_at");
      expect(triggers).toEqual(
        expect.arrayContaining(["bookmarks_ai", "bookmarks_bu", "bookmarks_au", "bookmarks_bd"]),
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
    } finally {
      close();
    }
  });
});
