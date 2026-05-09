import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { createDb } from "../src";

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
} finally {
  sqlite.close();
}
