import { createClient } from "@libsql/client/sqlite3";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import * as relations from "./relations";
import * as schema from "./schema";

export type CreateDbOptions = {
  databasePath: string;
};

function toLocalLibSqlUrl(databasePath: string) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
    return `file:${databasePath}`;
  }

  return "file::memory:?cache=shared";
}

async function resetMemoryDatabase(client: ReturnType<typeof createClient>) {
  await client.execute("PRAGMA foreign_keys = OFF");
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );

  for (const table of tables.rows) {
    const tableName = String(table.name);

    if (tableName.startsWith("bookmarks_fts_")) {
      continue;
    }

    await client.execute(`DROP TABLE IF EXISTS "${tableName.replaceAll('"', '""')}"`);
  }

  await client.execute("PRAGMA foreign_keys = ON");
}

export async function createDb({ databasePath }: CreateDbOptions) {
  const client = createClient({ url: toLocalLibSqlUrl(databasePath) });
  if (databasePath === ":memory:") {
    await resetMemoryDatabase(client);
  } else {
    await client.execute("PRAGMA foreign_keys = ON");
  }

  const db = drizzle(client, {
    schema: {
      ...schema,
      ...relations,
    },
  });

  return {
    db,
    client,
    close: () => client.close(),
  };
}
