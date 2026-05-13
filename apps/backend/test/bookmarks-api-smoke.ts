import { bookmarks } from "@pongolinks/db/schema";
import { eq } from "drizzle-orm";

import { APP_BASE_PATH, createApp } from "../src/app";
import { createMigratedTestDb } from "./test-db";

type TestDb = ReturnType<typeof createMigratedTestDb>;

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const request = (path: string, init?: RequestInit) =>
  new Request(`http://localhost${APP_BASE_PATH}${path}`, {
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

const bookmarkPayload = (overrides: Record<string, unknown> = {}) => ({
  url: "https://example.com",
  title: "Example",
  description: "A useful reference",
  isPrivate: false,
  ...overrides,
});

const withApp = async (
  run: (context: { app: ReturnType<typeof createApp>; db: TestDb["db"] }) => Promise<void>,
) => {
  const database = createMigratedTestDb();

  try {
    await run({
      app: createApp({ db: database.db }),
      db: database.db,
    });
  } finally {
    database.sqlite.close();
  }
};

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
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks/999"));
  const body = await response.json();

  assert(response.status === 404, "missing bookmark should return 404");
  assert(body.error.code === "bookmark.not_found", "missing bookmark should return not found code");
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
