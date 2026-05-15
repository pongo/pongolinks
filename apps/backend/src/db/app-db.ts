import type { LibSQLDatabase } from "drizzle-orm/libsql";

import * as relations from "@pongolinks/db/relations";
import * as schema from "@pongolinks/db/schema";

export type AppDb = LibSQLDatabase<typeof schema & typeof relations>;
