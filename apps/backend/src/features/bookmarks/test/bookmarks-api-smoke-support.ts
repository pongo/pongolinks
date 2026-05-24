import { bookmarkTags } from "@pongolinks/db/schema";
import { and, eq, sql } from "drizzle-orm";

import { assert, type TestDb, request, withApp } from "#test/api-smoke-support.ts";
export { assertBookmarkErrorCode, bookmarkPayload } from "#test/bookmark-api-smoke-support.ts";

export function bookmarkTagRowId(db: TestDb["db"], bookmarkId: number, tagId: number) {
  return db
    .select({ rowId: sql<number>`rowid` })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)))
    .get();
}

export { assert, request, withApp };
