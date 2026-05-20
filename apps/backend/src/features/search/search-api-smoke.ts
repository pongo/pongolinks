import { bookmarks } from "@pongolinks/db/schema";
import { eq } from "drizzle-orm";

import { assertBookmarkErrorCode, bookmarkPayload } from "#test/bookmark-api-smoke-support.ts";
import { assert, request, withApp } from "#test/api-smoke-support.ts";

async function createBookmark(
  app: { handle: (request: Request) => Promise<Response> },
  overrides: Record<string, unknown>,
) {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload(overrides)),
    }),
  );
  assert(response.status === 200, "bookmark setup should return 200");
}

await withApp(async ({ app }) => {
  await createBookmark(app, { url: "https://example.com/exact", title: "Exact Bookmark" });

  const response = await app.handle(request("/api/search/check?url=https://example.com/exact"));
  const body = await response.json();

  assert(response.status === 200, "exact match should return 200");
  assert(!response.headers.has("etag"), "search check should not include etag");
  assert(!response.headers.has("cache-control"), "search check should not include cache-control");
  assert(body.isOk === true, "exact match should return Ok result");
  assert(body.value.status === "exact-bookmark", "exact match should return exact-bookmark");
  assert(
    body.value.bookmark.url === "https://example.com/exact",
    "exact match should return bookmark",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, { url: "https://zagjs.com", title: "Zag" });

  const response = await app.handle(request("/api/search/check?url=https://zagjs.com/"));
  const body = await response.json();

  assert(response.status === 200, "exact trailing slash match should return 200");
  assert(body.isOk === true, "exact trailing slash match should return Ok result");
  assert(
    body.value.status === "exact-bookmark",
    "exact trailing slash match should return exact-bookmark",
  );
  assert(
    body.value.bookmark.url === "https://zagjs.com",
    "exact trailing slash match should return existing bookmark",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, { url: "https://zagjs.com/", title: "Zag Slash" });

  const response = await app.handle(request("/api/search/check?url=https://zagjs.com"));
  const body = await response.json();

  assert(response.status === 200, "exact missing trailing slash match should return 200");
  assert(body.isOk === true, "exact missing trailing slash match should return Ok result");
  assert(
    body.value.status === "exact-bookmark",
    "exact missing trailing slash match should return exact-bookmark",
  );
  assert(
    body.value.bookmark.url === "https://zagjs.com/",
    "exact missing trailing slash match should return existing bookmark",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, { url: "https://example.com/protocol", title: "Protocol Bookmark" });

  const response = await app.handle(request("/api/search/check?url=http://example.com/protocol"));
  const body = await response.json();

  assert(response.status === 200, "alternate protocol match should return 200");
  assert(body.isOk === true, "alternate protocol match should return Ok result");
  assert(
    body.value.status === "alternate-protocol-bookmark",
    "alternate protocol match should return alternate-protocol-bookmark",
  );
  assert(
    body.value.bookmark.url === "https://example.com/protocol",
    "alternate protocol match should return existing bookmark URL",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/protocol-slash",
    title: "Protocol Slash Bookmark",
  });

  const response = await app.handle(
    request("/api/search/check?url=http://example.com/protocol-slash/"),
  );
  const body = await response.json();

  assert(response.status === 200, "alternate protocol slash match should return 200");
  assert(body.isOk === true, "alternate protocol slash match should return Ok result");
  assert(
    body.value.status === "alternate-protocol-bookmark",
    "alternate protocol slash match should return alternate-protocol-bookmark",
  );
  assert(
    body.value.bookmark.url === "https://example.com/protocol-slash",
    "alternate protocol slash match should return existing bookmark URL",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, { url: "https://example.com/base", title: "Base Bookmark" });

  const variants = [
    "https://another.example.com/base",
    "https://example.com/base?x=1",
    "https://example.com/base#top",
  ];

  for (const url of variants) {
    const response = await app.handle(request(`/api/search/check?url=${encodeURIComponent(url)}`));
    const body = await response.json();
    assert(response.status === 200, `${url} check should return 200`);
    assert(body.isOk === true, `${url} check should return Ok result`);
    assert(body.value.status === "not-found", `${url} check should return not-found`);
  }
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/bookmark-one",
    title: "Bookmark One",
    description: "See https://related.example.com/doc",
  });

  const response = await app.handle(
    request("/api/search/check?url=https://related.example.com/doc"),
  );
  const body = await response.json();

  assert(response.status === 200, "related link match should return 200");
  assert(body.isOk === true, "related link match should return Ok result");
  assert(body.value.status === "related-link", "related link should return related-link status");
  assert(Array.isArray(body.value.bookmarks), "related link should return bookmarks array");
  assert(body.value.bookmarks.length === 1, "related link should return one bookmark");
  assert(
    body.value.bookmarks[0].title === "Bookmark One",
    "related link should return containing bookmark",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/bookmark-slash-related",
    title: "Bookmark Slash Related",
    description: "See https://related.example.com/doc/",
  });

  const response = await app.handle(
    request("/api/search/check?url=https://related.example.com/doc"),
  );
  const body = await response.json();

  assert(response.status === 200, "related link trailing slash match should return 200");
  assert(body.isOk === true, "related link trailing slash match should return Ok result");
  assert(
    body.value.status === "related-link",
    "related link trailing slash should return related-link status",
  );
  assert(
    body.value.bookmarks[0].title === "Bookmark Slash Related",
    "related link trailing slash should return containing bookmark",
  );
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/bookmark-two",
    title: "Bookmark Two",
    description: "Context http://related.example.com/protocol",
  });

  const response = await app.handle(
    request("/api/search/check?url=https://related.example.com/protocol"),
  );
  const body = await response.json();

  assert(response.status === 200, "related link alternate protocol match should return 200");
  assert(body.isOk === true, "related link alternate protocol match should return Ok result");
  assert(
    body.value.status === "related-link",
    "related link alternate protocol match should return related-link status",
  );
  assert(
    body.value.bookmarks[0].title === "Bookmark Two",
    "related link alternate protocol should return containing bookmark",
  );
  assert(
    !JSON.stringify(body.value).includes("alternate-protocol"),
    "related link response should not mention alternate protocol",
  );
});

await withApp(async ({ app, db }) => {
  await createBookmark(app, {
    url: "https://example.com/older",
    title: "Older",
    description: "Link https://related.example.com/multi",
  });
  await createBookmark(app, {
    url: "https://example.com/newer",
    title: "Newer",
    description: "Link https://related.example.com/multi",
  });

  await db
    .update(bookmarks)
    .set({ updatedAt: "2026-01-01 00:00:00" })
    .where(eq(bookmarks.url, "https://example.com/older"))
    .run();
  await db
    .update(bookmarks)
    .set({ updatedAt: "2026-01-01 00:00:00" })
    .where(eq(bookmarks.url, "https://example.com/newer"))
    .run();

  const response = await app.handle(
    request("/api/search/check?url=https://related.example.com/multi"),
  );
  const body = await response.json();

  assert(response.status === 200, "multi related link match should return 200");
  assert(body.isOk === true, "multi related link match should return Ok result");
  assert(body.value.status === "related-link", "multi related link should return related-link");
  assert(body.value.bookmarks.length === 2, "multi related link should return two bookmarks");
  assert(
    body.value.bookmarks[0].url === "https://example.com/newer",
    "multi related link should sort by id desc when updatedAt is equal",
  );
  assert(
    body.value.bookmarks[1].url === "https://example.com/older",
    "multi related link should return the second bookmark",
  );
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/search/check?url=ftp://example.com"));
  const body = await response.json();

  assert(response.status === 400, "invalid protocol URL should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_invalid", "invalid protocol URL");
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/search/check?url="));
  const body = await response.json();

  assert(response.status === 400, "blank URL should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_required", "blank URL");
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/search/check"));
  const body = await response.json();

  assert(response.status === 400, "missing URL should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_required", "missing URL");
});

console.log("search api smoke passed");
