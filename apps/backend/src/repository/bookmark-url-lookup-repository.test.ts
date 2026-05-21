import { afterEach, describe, expect, it } from "vitest";

import { bookmarks, relatedLinks } from "@pongolinks/db/schema";
import type { ValidUrl } from "@pongolinks/shared/brands";

import { createMigratedTestDb } from "#test/test-db.ts";
import { lookupBookmarksByUrl } from "./bookmark-url-lookup-repository.ts";

type TestDatabase = Awaited<ReturnType<typeof createMigratedTestDb>>;

let database: TestDatabase | undefined;

async function createTestDatabase() {
  database = await createMigratedTestDb();
  return database.db;
}

afterEach(() => {
  database?.close();
  database = undefined;
});

describe("Bookmark URL lookup repository", () => {
  it("treats trailing slash variants as the same Bookmark URL", async () => {
    const db = await createTestDatabase();
    await db
      .insert(bookmarks)
      .values({
        url: "https://example.com/article",
        title: "Article",
      })
      .run();

    const result = await lookupBookmarksByUrl(db, "https://example.com/article/" as ValidUrl);

    expect(result.isOk).toBe(true);
    if (result.isErr) return;
    expect(result.value.status).toBe("exact-bookmark");
    if (result.value.status !== "exact-bookmark") return;
    expect(result.value.bookmark.url).toBe("https://example.com/article");
    expect(result.value.bookmarks.map((bookmark) => bookmark.url)).toEqual([
      "https://example.com/article",
    ]);
  });

  it("matches the alternate protocol after trailing slash normalization", async () => {
    const db = await createTestDatabase();
    await db
      .insert(bookmarks)
      .values({
        url: "https://example.com/protocol",
        title: "Protocol",
      })
      .run();

    const result = await lookupBookmarksByUrl(db, "http://example.com/protocol/" as ValidUrl);

    expect(result.isOk).toBe(true);
    if (result.isErr) return;
    expect(result.value.status).toBe("alternate-protocol-bookmark");
    if (result.value.status !== "alternate-protocol-bookmark") return;
    expect(result.value.bookmark.url).toBe("https://example.com/protocol");
  });

  it("returns Related Link matches as hydrated Bookmarks in lookup order", async () => {
    const db = await createTestDatabase();
    const insertedBookmarks = await db
      .insert(bookmarks)
      .values([
        {
          url: "https://example.com/older",
          title: "Older",
          updatedAt: "2026-01-01 00:00:00",
        },
        {
          url: "https://example.com/newer",
          title: "Newer",
          updatedAt: "2026-01-01 00:00:00",
        },
      ])
      .returning({ id: bookmarks.id })
      .all();
    await db
      .insert(relatedLinks)
      .values([
        {
          bookmarkId: insertedBookmarks[0]!.id,
          url: "https://related.example.com/doc/",
        },
        {
          bookmarkId: insertedBookmarks[1]!.id,
          url: "http://related.example.com/doc",
        },
      ])
      .run();

    const result = await lookupBookmarksByUrl(db, "https://related.example.com/doc" as ValidUrl);

    expect(result.isOk).toBe(true);
    if (result.isErr) return;
    expect(result.value.status).toBe("related-link");
    expect(result.value.bookmarks.map((bookmark) => bookmark.title)).toEqual(["Newer", "Older"]);
    expect(result.value.bookmarks[0]?.relatedLinks).toEqual([
      {
        id: expect.any(Number),
        bookmarkId: insertedBookmarks[1]!.id,
        url: "http://related.example.com/doc",
      },
    ]);
  });

  it("returns an empty Bookmark list when the URL has no match", async () => {
    const db = await createTestDatabase();

    const result = await lookupBookmarksByUrl(db, "https://example.com/missing" as ValidUrl);

    expect(result.isOk).toBe(true);
    if (result.isErr) return;
    expect(result.value).toEqual({ status: "not-found", bookmarks: [] });
  });
});
