import {
  assert,
  assertBookmarkErrorCode,
  bookmarkPayload,
  request,
  withApp,
} from "./bookmarks-api-smoke-support";

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload()),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "create should return 200");
  assert(body.isOk === true, "create should return Ok result");
  assert(body.value.url === "https://example.com", "create should return BookmarkDTO url");
  assert(Array.isArray(body.value.tags), "create should return BookmarkDTO tags");
  assert(body.value.tags.length === 0, "create should return empty tags by default");
  assert(Array.isArray(body.value.relatedLinks), "create should return BookmarkDTO related links");
  assert(
    body.value.relatedLinks.length === 0,
    "create should return empty related links by default",
  );
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
  assert(body.value.tags.length === 2, "create should return unique tags");
  assert(body.value.tags[0].nameLower === "article", "create should sort tags by nameLower");
  assert(body.value.tags[1].nameLower === "lang-ru", "create should include the second tag");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          description:
            "Primary https://example.com and related https://example.com/docs https://example.com/docs",
        }),
      ),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "create with related links should return 200");
  assert(
    body.value.relatedLinks.length === 2,
    "create should persist unique explicit related links",
  );
  assert(
    body.value.relatedLinks[0].url === "https://example.com",
    "create should allow the bookmark URL as a related link",
  );
  assert(
    body.value.relatedLinks[1].url === "https://example.com/docs",
    "create should return the second related link",
  );
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
  assert(body.value.tags[0].name === "Article", "reuse should preserve display casing");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "missing create body should return 400");
  assertBookmarkErrorCode(body, "bookmark.validation_invalid", "missing create body");
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
  assertBookmarkErrorCode(body, "bookmark.validation_invalid", "non-object create body");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: undefined })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "missing url should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_required", "missing url");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: 123 })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-string url should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_required", "non-string url");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ title: undefined })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "missing title should return 400");
  assertBookmarkErrorCode(body, "bookmark.title_required", "missing title");
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
  assertBookmarkErrorCode(body, "bookmark.title_required", "non-string title");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ title: " \t\n " })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "blank title should return 400");
  assertBookmarkErrorCode(body, "bookmark.title_required", "blank title");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ description: 123 })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-string description should return 400");
  assertBookmarkErrorCode(body, "bookmark.validation_invalid", "non-string description");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ isPrivate: "false" })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-boolean isPrivate should return 400");
  assertBookmarkErrorCode(body, "bookmark.validation_invalid", "non-boolean isPrivate");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ tagsText: ["tag"] })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-string tagsText should return 400");
  assertBookmarkErrorCode(body, "bookmark.validation_invalid", "non-string tagsText");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com/minimal",
        title: "Minimal",
      }),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "missing optional fields should return 200");
  assert(body.value.description === "", "missing description should default to empty string");
  assert(body.value.isPrivate === false, "missing isPrivate should default to false");
  assert(body.value.tags.length === 0, "missing tagsText should default to empty tags");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: "ftp://example.com" })),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "non-http url should return 400");
  assertBookmarkErrorCode(body, "bookmark.url_invalid", "non-http url");
});

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/bookmarks/not-a-number"));
  const body = await response.json();

  assert(response.status === 400, "invalid id param should return 400");
  assert(body.isOk === false, "invalid id param should return Err result");
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

console.log("bookmark create api smoke passed");
