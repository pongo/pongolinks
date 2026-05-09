import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as relations from "./relations";
import * as schema from "./schema";

export type CreateDbOptions = {
  databasePath: string;
};

export const createDb = ({ databasePath }: CreateDbOptions) => {
  const sqlite = new Database(databasePath);
  sqlite.run("PRAGMA foreign_keys = ON");

  const db = drizzle(sqlite, {
    schema: {
      ...schema,
      ...relations,
    },
  });

  return { db, sqlite };
};
