import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import * as relations from "./relations";
import * as schema from "./schema";

export type CreateDbOptions = {
  databasePath: string;
};

function createLocalDatabasePath(databasePath: string) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
    return {
      path: databasePath,
      cleanup: () => {},
    };
  }

  const databaseDir = mkdtempSync(join(tmpdir(), "pongolinks-db-"));

  return {
    path: join(databaseDir, "memory.sqlite"),
    cleanup: () => {
      try {
        rmSync(databaseDir, { recursive: true, force: true });
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          !["EBUSY", "EPERM"].includes(String(error.code))
        ) {
          throw error;
        }
      }
    },
  };
}

export async function createDb({ databasePath }: CreateDbOptions) {
  const localDatabase = createLocalDatabasePath(databasePath);
  const client = createClient({ url: `file:${localDatabase.path}` });
  await client.execute("PRAGMA foreign_keys = ON");

  const db = drizzle(client, {
    schema: {
      ...schema,
      ...relations,
    },
  });

  return {
    db,
    client,
    close: () => {
      client.close();
      localDatabase.cleanup();
    },
  };
}
