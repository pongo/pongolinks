import { APP_BASE_PATH, createApp } from "#/app.ts";
import { createMigratedTestDb } from "../../../test/test-db";

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

async function withApp(run: (context: { app: ReturnType<typeof createApp> }) => Promise<void>) {
  const database = await createMigratedTestDb();

  try {
    await run({
      app: createApp({ db: database.db }),
    });
  } finally {
    database.close();
  }
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

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/tags"));
  const body = await response.json();

  assert(response.status === 200, "empty tags list should return 200");
  assert(body.isOk === true, "empty tags list should return Ok result");
  assert(Array.isArray(body.value.tags), "empty tags list should return tags array");
  assert(body.value.tags.length === 0, "empty tags list should return no tags");
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
});

console.log("tag api smoke passed");
