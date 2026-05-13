import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import { eq } from "drizzle-orm";

import { APP_BASE_PATH, createApp } from "../src/app";
import { createMigratedTestDb } from "./test-db";

type TestDb = ReturnType<typeof createMigratedTestDb>;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function request(path: string, init?: RequestInit) {
  return new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
}

function bookmarkPayload(overrides: Record<string, unknown> = {}) {
  return {
    url: "https://example.com",
    title: "Example",
    description: "A useful reference",
    isPrivate: false,
    tagsText: "",
    ...overrides,
  };
}

async function withApp(
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) {
  const database = createMigratedTestDb();

  try {
    await run({
      app: createApp({ db: database.db }),
      db: database.db,
    });
  } finally {
    database.sqlite.close();
  }
}

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload()),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "create should return 200");
  assert(body.ok === true, "create should return success envelope");
  assert(body.data.url === "https://example.com", "create should return BookmarkDTO url");
  assert(Array.isArray(body.data.tags), "create should return BookmarkDTO tags");
  assert(body.data.tags.length === 0, "create should return empty tags by default");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ tagsText: "article lang-ru article" })),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "create with tags should return 200");
  assert(body.data.tags.length === 2, "create should return unique tags");
  assert(body.data.tags[0].nameLower === "article", "create should sort tags by nameLower");
  assert(body.data.tags[1].nameLower === "lang-ru", "create should include the second tag");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ tagsText: "Article" })),
    }),
  );
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/second",
          title: "Second",
          tagsText: "article",
        }),
      ),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "create should reuse existing tags");
  assert(body.data.tags[0].name === "Article", "reuse should preserve display casing");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "missing create body should return 400");
  assert(body.ok === false, "missing create body should return error envelope");
  assert(
    body.error.code === "bookmark.validation_invalid",
    "missing create body should return validation code",
  );
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify("bookmark"),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-object create body should return 400");
  assert(body.ok === false, "non-object create body should return error envelope");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ title: 123 })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-string title should return 400");
  assert(body.ok === false, "non-string title should return error envelope");
  assert(
    body.error.code === "bookmark.title_required",
    "non-string title should return title required code",
  );
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks/not-a-number"));
  const body = await response.json();

  assert(response.status === 400, "invalid id param should return 400");
  assert(body.ok === false, "invalid id param should return error envelope");
  assert(body.error.code === "bookmark.id_invalid", "invalid id param should return id code");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload()),
    }),
  );
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ title: "Duplicate" })),
    }),
  );
  const body = await response.json();

  assert(response.status === 409, "duplicate create should return 409");
  assert(
    body.error.code === "bookmark.url_duplicate",
    "duplicate create should return duplicate code",
  );
});

await withApp(async ({ app, db }) => {
  db.insert(bookmarks)
    .values([
      {
        url: "https://example.com/old",
        title: "Old",
        updatedAt: "2000-01-01 00:00:00",
      },
      {
        url: "https://example.com/new",
        title: "New",
        updatedAt: "2020-01-01 00:00:00",
      },
    ])
    .run();

  const response = await app.handle(request("/api/bookmarks"));
  const body = await response.json();

  assert(response.status === 200, "list should return 200");
  assert(body.data.bookmarks[0].title === "New", "list should order by updatedAt descending");
  assert(Array.isArray(body.data.bookmarks[0].tags), "list should include tags");
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks/999"));
  const body = await response.json();

  assert(response.status === 404, "missing bookmark should return 404");
  assert(body.error.code === "bookmark.not_found", "missing bookmark should return not found code");
});

await withApp(async ({ app, db }) => {
  const bookmark = db
    .insert(bookmarks)
    .values({
      url: "https://example.com/tagged",
      title: "Tagged",
    })
    .returning({ id: bookmarks.id })
    .get();
  const insertedTags = db
    .insert(tags)
    .values([
      { name: "Zed", nameLower: "zed" },
      { name: "Alpha", nameLower: "alpha" },
    ])
    .returning({ id: tags.id })
    .all();
  db.insert(bookmarkTags)
    .values(insertedTags.map((tag) => ({ bookmarkId: bookmark.id, tagId: tag.id })))
    .run();

  const response = await app.handle(request(`/api/bookmarks/${bookmark.id}`));
  const body = await response.json();

  assert(response.status === 200, "get with tags should return 200");
  assert(body.data.tags[0].nameLower === "alpha", "get should sort tags by nameLower");
  assert(body.data.tags[1].nameLower === "zed", "get should return all tags");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload()),
    }),
  );
  const response = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/updated",
          title: "Updated",
          description: "",
          isPrivate: true,
        }),
      ),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "update should return 200");
  assert(body.data.title === "Updated", "update should return changed title");
  assert(body.data.isPrivate === true, "update should return changed privacy flag");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ tagsText: "alpha beta" })),
    }),
  );
  const replaceResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ tagsText: "gamma" })),
    }),
  );
  const replaceBody = await replaceResponse.json();

  assert(replaceResponse.status === 200, "tag replace update should return 200");
  assert(replaceBody.data.tags.length === 1, "update should replace all tag links");
  assert(replaceBody.data.tags[0].nameLower === "gamma", "update should return final tags");

  const clearResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ tagsText: "" })),
    }),
  );
  const clearBody = await clearResponse.json();

  assert(clearResponse.status === 200, "tag clear update should return 200");
  assert(clearBody.data.tags.length === 0, "empty tagsText should clear tag links");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: "https://example.com/one" })),
    }),
  );
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: "https://example.com/two", title: "Two" })),
    }),
  );
  const response = await app.handle(
    request("/api/bookmarks/2", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ url: "https://example.com/one", title: "Two" })),
    }),
  );
  const body = await response.json();

  assert(response.status === 409, "duplicate update should return 409");
  assert(
    body.error.code === "bookmark.url_duplicate",
    "duplicate update should return duplicate code",
  );
});

await withApp(async ({ app, db }) => {
  const { id, updatedAt } = db
    .insert(bookmarks)
    .values({
      url: "https://example.com/original",
      title: "Original",
      updatedAt: "2000-01-01 00:00:00",
    })
    .returning({ id: bookmarks.id, updatedAt: bookmarks.updatedAt })
    .get();

  const response = await app.handle(
    request(`/api/bookmarks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/original",
          title: "Changed",
        }),
      ),
    }),
  );
  const row = await db.query.bookmarks.findFirst({ where: eq(bookmarks.id, id) });

  assert(response.status === 200, "updatedAt patch should return 200");
  assert(row?.updatedAt !== updatedAt, "update should change updatedAt through Drizzle");
});

console.log("bookmark api smoke passed");
