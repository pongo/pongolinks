import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";

import { assert, request, withApp } from "./bookmarks-api-smoke-support";
import { BOOKMARK_LIST_PAGE_SIZE } from "./pagination";

function assertPrivateRevalidationHeaders(response: Response) {
  const etag = response.headers.get("etag");
  const cacheControl = response.headers.get("cache-control");
  const vary = response.headers.get("vary");

  assert(etag, "cacheable response should include etag");
  assert(
    cacheControl === "private, no-cache",
    "cacheable response should require private revalidation",
  );
  assert(vary?.includes("Authorization"), "cacheable response should vary by Authorization");

  return etag;
}

await withApp(async ({ app, db }) => {
  await db
    .insert(bookmarks)
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
  assert(body.value.bookmarks[0].title === "New", "list should order by updatedAt descending");
  assert(body.value.pagination.page === 1, "list should default to page 1");
  assert(
    body.value.pagination.pageSize === BOOKMARK_LIST_PAGE_SIZE,
    "list should return backend page size",
  );
  assert(body.value.pagination.totalCount === 2, "list should return total count");
  assert(body.value.pagination.totalPages === 1, "list should return total pages");
  assert(
    body.value.pagination.hasPreviousPage === false,
    "list should not have a previous page on page 1",
  );
  assert(
    body.value.pagination.hasNextPage === false,
    "list should not have a next page when all rows fit on page 1",
  );
  assert(Array.isArray(body.value.bookmarks[0].tags), "list should include tags");
  assert(Array.isArray(body.value.bookmarks[0].relatedLinks), "list should include related links");
  assert(
    body.value.bookmarks[0].relatedLinks.length === 0,
    "list should return empty related links when none exist",
  );
});

await withApp(async ({ app, db }) => {
  await db
    .insert(bookmarks)
    .values({
      url: "https://example.com/cacheable",
      title: "Cacheable",
      updatedAt: "2020-01-01 00:00:00",
    })
    .run();

  const response = await app.handle(request("/api/bookmarks"));
  const etag = assertPrivateRevalidationHeaders(response);

  const revalidatedResponse = await app.handle(
    request("/api/bookmarks", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );
  const revalidatedBody = await revalidatedResponse.text();

  assert(revalidatedResponse.status === 304, "matching bookmark list etag should return 304");
  assert(revalidatedBody.length === 0, "304 bookmark list response should not include a body");

  await db
    .insert(bookmarks)
    .values({
      url: "https://example.com/cacheable-new",
      title: "Cacheable New",
      updatedAt: "2021-01-01 00:00:00",
    })
    .run();

  const changedResponse = await app.handle(
    request("/api/bookmarks", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );
  const changedEtag = assertPrivateRevalidationHeaders(changedResponse);

  assert(changedResponse.status === 200, "changed bookmark list should return 200");
  assert(changedEtag !== etag, "changed bookmark list should return a new etag");
});

await withApp(async ({ app, db }) => {
  await db
    .insert(bookmarks)
    .values(
      Array.from({ length: BOOKMARK_LIST_PAGE_SIZE + 1 }, (_, index) => ({
        url: `https://example.com/page-size-${index + 1}`,
        title: `Page Size ${index + 1}`,
        updatedAt: `2020-01-${String(index + 1).padStart(2, "0")} 00:00:00`,
      })),
    )
    .run();

  const response = await app.handle(request("/api/bookmarks"));
  const body = await response.json();

  assert(response.status === 200, "default paginated list should return 200");
  assert(
    body.value.bookmarks.length === BOOKMARK_LIST_PAGE_SIZE,
    "default paginated list should return at most one page of rows",
  );
  assert(
    body.value.pagination.totalCount === BOOKMARK_LIST_PAGE_SIZE + 1,
    "paginated list should return total count",
  );
  assert(body.value.pagination.totalPages === 2, "paginated list should return total pages");
  assert(
    body.value.pagination.hasNextPage === true,
    "paginated list should indicate when a next page exists",
  );
});

await withApp(async ({ app, db }) => {
  await db
    .insert(bookmarks)
    .values(
      Array.from({ length: BOOKMARK_LIST_PAGE_SIZE + 1 }, (_, index) => ({
        url: `https://example.com/invalid-page-${index + 1}`,
        title: `Invalid Page ${index + 1}`,
      })),
    )
    .run();

  for (const pageValue of ["not-a-number", "0", "-1", "1.5", ""]) {
    const response = await app.handle(
      request(`/api/bookmarks?page=${encodeURIComponent(pageValue)}`),
    );
    const body = await response.json();

    assert(response.status === 200, `${pageValue} page should return 200`);
    assert(body.value.pagination.page === 1, `${pageValue} page should normalize to page 1`);
    assert(
      body.value.bookmarks.length === BOOKMARK_LIST_PAGE_SIZE,
      `${pageValue} page should return first page rows`,
    );
  }
});

await withApp(async ({ app, db }) => {
  await db
    .insert(bookmarks)
    .values(
      Array.from({ length: BOOKMARK_LIST_PAGE_SIZE + 1 }, (_, index) => ({
        url: `https://example.com/deep-page-${index + 1}`,
        title: `Deep Page ${index + 1}`,
      })),
    )
    .run();

  const response = await app.handle(request("/api/bookmarks?page=3"));
  const body = await response.json();

  assert(response.status === 200, "page past last page should return 200");
  assert(body.value.bookmarks.length === 0, "page past last page should return empty bookmarks");
  assert(body.value.pagination.page === 3, "page past last page should preserve requested page");
  assert(
    body.value.pagination.pageSize === BOOKMARK_LIST_PAGE_SIZE,
    "page past last page should return page size",
  );
  assert(
    body.value.pagination.totalCount === BOOKMARK_LIST_PAGE_SIZE + 1,
    "page past last page should return real count",
  );
  assert(body.value.pagination.totalPages === 2, "page past last page should return real pages");
  assert(
    body.value.pagination.hasPreviousPage === true,
    "page past last page should indicate a previous page exists",
  );
  assert(
    body.value.pagination.hasNextPage === false,
    "page past last page should not indicate a next page",
  );
});

await withApp(async ({ app, db }) => {
  const inserted = await db
    .insert(bookmarks)
    .values([
      { url: "https://example.com/first", title: "First", updatedAt: "2020-01-01 00:00:00" },
      { url: "https://example.com/second", title: "Second", updatedAt: "2020-01-01 00:00:00" },
      { url: "https://example.com/third", title: "Third", updatedAt: "2020-01-01 00:00:00" },
    ])
    .returning({ id: bookmarks.id })
    .all();

  const response = await app.handle(request("/api/bookmarks"));
  const body = await response.json();

  assert(response.status === 200, "same timestamp list should return 200");
  assert(
    body.value.bookmarks[0].id === inserted[2]!.id,
    "same timestamp list should order first by highest id",
  );
  assert(
    body.value.bookmarks[1].id === inserted[1]!.id,
    "same timestamp list should order second by next highest id",
  );
  assert(
    body.value.bookmarks[2].id === inserted[0]!.id,
    "same timestamp list should order third by lowest id",
  );
});

await withApp(async ({ app, db }) => {
  const bookmark = await db
    .insert(bookmarks)
    .values({
      url: "https://example.com/list-with-relations",
      title: "List With Relations",
      updatedAt: "2020-01-01 00:00:00",
    })
    .returning({ id: bookmarks.id })
    .get();
  const insertedTags = await db
    .insert(tags)
    .values([
      { name: "Zed", nameLower: "zed" },
      { name: "Alpha", nameLower: "alpha" },
    ])
    .returning({ id: tags.id })
    .all();
  await db
    .insert(bookmarkTags)
    .values(insertedTags.map((tag) => ({ bookmarkId: bookmark.id, tagId: tag.id })))
    .run();
  await db
    .insert(relatedLinks)
    .values([
      { bookmarkId: bookmark.id, url: "https://example.com/second-related" },
      { bookmarkId: bookmark.id, url: "https://example.com/first-related" },
    ])
    .run();

  const response = await app.handle(request("/api/bookmarks"));
  const body = await response.json();
  const listedBookmark = body.value.bookmarks[0];

  assert(response.status === 200, "list with relations should return 200");
  assert(listedBookmark.tags[0].nameLower === "alpha", "list should sort tags by nameLower");
  assert(listedBookmark.tags[1].nameLower === "zed", "list should return all tags");
  assert(
    listedBookmark.relatedLinks[0].url === "https://example.com/second-related",
    "list should order related links by id ascending",
  );
  assert(
    listedBookmark.relatedLinks[1].url === "https://example.com/first-related",
    "list should return all related links",
  );
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks"));
  const body = await response.json();
  const etag = assertPrivateRevalidationHeaders(response);

  assert(response.status === 200, "empty list should return 200");
  assert(body.value.bookmarks.length === 0, "empty list should return no bookmarks");
  assert(body.value.pagination.page === 1, "empty list should return page 1");
  assert(body.value.pagination.totalCount === 0, "empty list should return zero total count");
  assert(body.value.pagination.totalPages === 0, "empty list should return zero total pages");
  assert(
    body.value.pagination.hasPreviousPage === false,
    "empty list should not have previous page",
  );
  assert(body.value.pagination.hasNextPage === false, "empty list should not have next page");

  const revalidatedResponse = await app.handle(
    request("/api/bookmarks", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );

  assert(revalidatedResponse.status === 304, "empty bookmark list etag should return 304");
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks/999"));
  const body = await response.json();

  assert(response.status === 404, "missing bookmark should return 404");
  assert(body.error.code === "bookmark.not_found", "missing bookmark should return not found code");
});

await withApp(async ({ app, db }) => {
  const bookmark = await db
    .insert(bookmarks)
    .values({
      url: "https://example.com/tagged",
      title: "Tagged",
    })
    .returning({ id: bookmarks.id })
    .get();
  const insertedTags = await db
    .insert(tags)
    .values([
      { name: "Zed", nameLower: "zed" },
      { name: "Alpha", nameLower: "alpha" },
    ])
    .returning({ id: tags.id })
    .all();
  await db
    .insert(bookmarkTags)
    .values(insertedTags.map((tag) => ({ bookmarkId: bookmark.id, tagId: tag.id })))
    .run();
  await db
    .insert(relatedLinks)
    .values([
      { bookmarkId: bookmark.id, url: "https://example.com/second-related" },
      { bookmarkId: bookmark.id, url: "https://example.com/first-related" },
    ])
    .run();

  const response = await app.handle(request(`/api/bookmarks/${bookmark.id}`));
  const body = await response.json();

  assert(response.status === 200, "get with tags should return 200");
  assert(!response.headers.has("etag"), "get bookmark by id should not include etag");
  assert(
    !response.headers.has("cache-control"),
    "get bookmark by id should not include cache-control",
  );
  assert(body.value.tags[0].nameLower === "alpha", "get should sort tags by nameLower");
  assert(body.value.tags[1].nameLower === "zed", "get should return all tags");
  assert(
    body.value.relatedLinks[0].url === "https://example.com/second-related",
    "get should order related links by id ascending",
  );
  assert(
    body.value.relatedLinks[1].url === "https://example.com/first-related",
    "get should return all related links",
  );
});

console.log("bookmark list/get api smoke passed");
