import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { createDb } from "../src";
import { bookmarks } from "../src/schema";

const tempDir = fileURLToPath(new URL("../.tmp", import.meta.url));
const migrationsFolder = fileURLToPath(new URL("../drizzle/migrations", import.meta.url));

mkdirSync(tempDir, { recursive: true });

const databasePath = join(tempDir, `pongolinks-${crypto.randomUUID()}.sqlite`);
const { db, sqlite } = createDb({ databasePath });

try {
  migrate(db, { migrationsFolder });

  const tables = sqlite
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .all()
    .map((table) => table.name);

  for (const tableName of [
    "bookmarks",
    "tags",
    "bookmark_tags",
    "related_links",
    "bookmarks_fts",
  ]) {
    if (!tables.includes(tableName)) {
      throw new Error(`Missing migrated table: ${tableName}`);
    }
  }

  const triggers = sqlite
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name",
    )
    .all()
    .map((trigger) => trigger.name);

  if (triggers.includes("update_bookmarks_updated_at")) {
    throw new Error("Unexpected migrated trigger: update_bookmarks_updated_at");
  }

  for (const triggerName of ["bookmarks_ai", "bookmarks_bu", "bookmarks_au", "bookmarks_bd"]) {
    if (!triggers.includes(triggerName)) {
      throw new Error(`Missing migrated trigger: ${triggerName}`);
    }
  }

  const initialUpdatedAt = "2000-01-01 00:00:00";
  const { id: firstBookmarkId } = db
    .insert(bookmarks)
    .values({
      url: "https://example.com/first",
      title: "First",
      updatedAt: initialUpdatedAt,
    })
    .returning({ id: bookmarks.id })
    .get();

  const { updatedAt: runtimeUpdatedAt } = db
    .update(bookmarks)
    .set({ title: "First updated" })
    .where(eq(bookmarks.id, firstBookmarkId))
    .returning({ updatedAt: bookmarks.updatedAt })
    .get();

  if (runtimeUpdatedAt === initialUpdatedAt) {
    throw new Error("Drizzle update did not refresh bookmarks.updated_at");
  }

  const explicitUpdatedAt = "1999-01-01 00:00:00";
  const { id: secondBookmarkId } = db
    .insert(bookmarks)
    .values({
      url: "https://example.com/second",
      title: "Second",
      updatedAt: initialUpdatedAt,
    })
    .returning({ id: bookmarks.id })
    .get();

  const { updatedAt: explicitResult } = db
    .update(bookmarks)
    .set({ title: "Second updated", updatedAt: explicitUpdatedAt })
    .where(eq(bookmarks.id, secondBookmarkId))
    .returning({ updatedAt: bookmarks.updatedAt })
    .get();

  if (explicitResult !== explicitUpdatedAt) {
    throw new Error("Drizzle update did not respect explicit bookmarks.updated_at");
  }
} finally {
  sqlite.close();
}
