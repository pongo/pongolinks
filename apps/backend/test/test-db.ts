import { createDb } from "@pongolinks/db";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { fileURLToPath } from "node:url";

const migrationsFolder = fileURLToPath(
  new URL("../../../packages/db/drizzle/migrations", import.meta.url),
);

export function createMigratedTestDb() {
  const database = createDb({ databasePath: ":memory:" });
  migrate(database.db, { migrationsFolder });
  return database;
}
