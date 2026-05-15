import { bookmarkTags } from "@pongolinks/db/schema";
import { and, eq, sql } from "drizzle-orm";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { createMigratedTestDb } from "../../../test/test-db";

export type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

export function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
}

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

export async function withApp(
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();

  try {
    await run({
      app: createApp({ db: database.db }),
      db: database.db,
    });
  } finally {
    database.close();
  }
}
