import { createApp } from "#/app.ts";
import { assert, request, withApp } from "#test/api-smoke-support.ts";

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

async function createBookmark(app: ReturnType<typeof createApp>, payload: Record<string, unknown>) {
  const response = await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload(payload)),
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "bookmark setup should return 200");
  assert(body.isOk === true, "bookmark setup should return Ok result");
}

function assertPrivateRevalidationHeaders(response: Response) {
  const etag = response.headers.get("etag");
  const cacheControl = response.headers.get("cache-control");
  const vary = response.headers.get("vary");

  assert(etag, "cacheable tags response should include etag");
  assert(
    cacheControl === "private, no-cache",
    "cacheable tags response should require private revalidation",
  );
  assert(vary?.includes("Authorization"), "cacheable tags response should vary by Authorization");

  return etag;
}

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/tags"));
  const body = await response.json();
  const etag = assertPrivateRevalidationHeaders(response);

  assert(response.status === 200, "empty tags list should return 200");
  assert(body.isOk === true, "empty tags list should return Ok result");
  assert(Array.isArray(body.value.tags), "empty tags list should return tags array");
  assert(body.value.tags.length === 0, "empty tags list should return no tags");

  const revalidatedResponse = await app.handle(
    request("/api/tags", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );

  assert(revalidatedResponse.status === 304, "empty tags list etag should return 304");
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/tag-one",
    title: "Tag One",
    tagsText: "Shared Alpha",
  });
  await createBookmark(app, {
    url: "https://example.com/tag-two",
    title: "Tag Two",
    tagsText: "shared beta",
  });
  await createBookmark(app, {
    url: "https://example.com/tag-three",
    title: "Tag Three",
    tagsText: "gamma",
  });

  const response = await app.handle(request("/api/tags"));
  const body = await response.json();
  const etag = assertPrivateRevalidationHeaders(response);

  assert(response.status === 200, "tags list should return 200");
  assert(body.isOk === true, "tags list should return Ok result");
  assert(body.value.tags.length === 4, "tags list should include API-created tags");
  assert(body.value.tags[0].name === "Shared", "tags list should keep saved display name");
  assert(body.value.tags[0].nameLower === "shared", "tags list should return normalized name");
  assert(body.value.tags[0].usageCount === 2, "tags list should count current attachments");
  assert(body.value.tags[1].nameLower === "alpha", "equal popularity should sort by nameLower");
  assert(body.value.tags[1].usageCount === 1, "alpha should have one attachment");
  assert(body.value.tags[2].nameLower === "beta", "equal popularity should sort second tag");
  assert(body.value.tags[2].usageCount === 1, "beta should have one attachment");
  assert(body.value.tags[3].nameLower === "gamma", "equal popularity should sort third tag");
  assert(body.value.tags[3].usageCount === 1, "gamma should have one attachment");

  const revalidatedResponse = await app.handle(
    request("/api/tags", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );
  const revalidatedBody = await revalidatedResponse.text();

  assert(revalidatedResponse.status === 304, "matching tags list etag should return 304");
  assert(revalidatedBody.length === 0, "304 tags list response should not include a body");
});

console.log("tag api smoke passed");
