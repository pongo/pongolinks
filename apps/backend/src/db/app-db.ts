import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import * as relations from "@pongolinks/db/relations";
import * as schema from "@pongolinks/db/schema";

export type AppDb = BunSQLiteDatabase<typeof schema & typeof relations>;
