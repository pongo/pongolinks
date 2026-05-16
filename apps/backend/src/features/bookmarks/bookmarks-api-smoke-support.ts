import { bookmarkTags } from "@pongolinks/db/schema";
import { and, eq, sql } from "drizzle-orm";

import { assert, type TestDb, request, withApp } from "#test/api-smoke-support.ts";

export function bookmarkPayload(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://example.com",
    title: "Example",
    description: "A useful reference",
    isPrivate: false,
    tagsText: "",
    ...overrides,
  };
}

export function assertBookmarkErrorCode(
  body: { isErr: boolean; error?: { code?: unknown } },
  code: string,
  message: string,
) {
  assert(body.isErr === true, `${message} should return Err result`);
  assert(body.error?.code === code, `${message} should return ${code}`);
}

export function bookmarkTagRowId(db: TestDb["db"], bookmarkId: number, tagId: number) {
  return db
    .select({ rowId: sql<number>`rowid` })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)))
    .get();
}

export { assert, request, withApp };
