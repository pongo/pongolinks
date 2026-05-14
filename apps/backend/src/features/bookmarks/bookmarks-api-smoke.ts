import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";
import { and, eq, sql } from "drizzle-orm";

import { APP_BASE_PATH, createApp } from "#/app.ts";
import { BookmarkId } from "#/features/bookmarks/domain/bookmark-id.ts";
import { BookmarkUrl } from "#/features/bookmarks/domain/bookmark-url.ts";
import { BookmarksRepository } from "#/features/bookmarks/bookmarks-repository.ts";
import { parseTagNames } from "#/features/bookmarks/domain/tag-name.ts";
import { createMigratedTestDb } from "../../../test/test-db";

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

function unwrapResult<T>(result: { isErr: false; value: T } | { isErr: true; error: unknown }): T {
  if (result.isErr) {
    throw new Error(`Expected Ok result, got ${JSON.stringify(result.error)}`);
  }

  return result.value;
}

function assertBookmarkErrorCode(
  body: { isErr: boolean; error?: { code?: unknown } },
  code: string,
  message: string,
) {
  assert(body.isErr === true, `${message} should return Err result`);
  assert(body.error?.code === code, `${message} should return ${code}`);
}

function bookmarkTagRowId(db: TestDb["db"], bookmarkId: number, tagId: number) {
  const row = db
    .select({ rowId: sql<number>`rowid` })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)))
    .get();

  return row?.rowId;
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
  assert(body.value.bookmarks[0].title === "New", "list should order by updatedAt descending");
  assert(Array.isArray(body.value.bookmarks[0].tags), "list should include tags");
  assert(Array.isArray(body.value.bookmarks[0].relatedLinks), "list should include related links");
  assert(
    body.value.bookmarks[0].relatedLinks.length === 0,
    "list should return empty related links when none exist",
  );
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
  db.insert(relatedLinks)
    .values([
      { bookmarkId: bookmark.id, url: "https://example.com/second-related" },
      { bookmarkId: bookmark.id, url: "https://example.com/first-related" },
    ])
    .run();

  const response = await app.handle(request(`/api/bookmarks/${bookmark.id}`));
  const body = await response.json();

  assert(response.status === 200, "get with tags should return 200");
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
  assert(body.value.title === "Updated", "update should return changed title");
  assert(body.value.isPrivate === true, "update should return changed privacy flag");
});

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          description: "Keep https://example.com/keep and remove https://example.com/remove",
        }),
      ),
    }),
  );
  const originalResponse = await app.handle(request("/api/bookmarks/1"));
  const originalBody = await originalResponse.json();
  const keptId = originalBody.value.relatedLinks[0].id;

  const updateResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(
        bookmarkPayload({
          description: "Keep https://example.com/keep and add https://example.com/add",
        }),
      ),
    }),
  );
  const updateBody = await updateResponse.json();

  assert(updateResponse.status === 200, "related link update should return 200");
  assert(updateBody.value.relatedLinks.length === 2, "update should return final related links");
  assert(
    updateBody.value.relatedLinks[0].id === keptId,
    "update should preserve unchanged related link id",
  );
  assert(
    updateBody.value.relatedLinks[0].url === "https://example.com/keep",
    "update should retain existing related link URL",
  );
  assert(
    updateBody.value.relatedLinks[1].url === "https://example.com/add",
    "update should insert new related link URL",
  );

  const clearResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ description: "No explicit web links now" })),
    }),
  );
  const clearBody = await clearResponse.json();

  assert(clearResponse.status === 200, "related link clear update should return 200");
  assert(clearBody.value.relatedLinks.length === 0, "update should clear removed related links");
});

await withApp(async ({ app, db }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ tagsText: "alpha beta" })),
    }),
  );
  const beta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") });
  if (!beta) {
    throw new Error("beta tag should exist after create");
  }
  const betaLinkRowId = bookmarkTagRowId(db, 1, beta.id);

  const syncResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ tagsText: "beta gamma" })),
    }),
  );
  const syncBody = await syncResponse.json();
  const alphaAfterSync = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
  const betaLinkRowIdAfterSync = bookmarkTagRowId(db, 1, beta.id);

  assert(syncResponse.status === 200, "tag diff update should return 200");
  assert(syncBody.value.tags.length === 2, "update should return final diffed tags");
  assert(syncBody.value.tags[0].nameLower === "beta", "update should retain submitted beta tag");
  assert(syncBody.value.tags[1].nameLower === "gamma", "update should attach submitted gamma tag");
  assert(!alphaAfterSync, "detached single-use alpha tag should be deleted");
  assert(
    betaLinkRowIdAfterSync === betaLinkRowId,
    "update should preserve retained bookmark tag link row",
  );

  const clearResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ tagsText: "" })),
    }),
  );
  const clearBody = await clearResponse.json();

  assert(clearResponse.status === 200, "tag clear update should return 200");
  assert(clearBody.value.tags.length === 0, "empty tagsText should clear tag links");

  const remainingTags = await db.query.tags.findMany();
  assert(remainingTags.length === 0, "empty tagsText should delete detached single-use tags");
});

await withApp(async ({ app, db }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload({ url: "https://example.com/one", tagsText: "Shared" })),
    }),
  );
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/two",
          title: "Two",
          tagsText: "shared",
        }),
      ),
    }),
  );

  const response = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ url: "https://example.com/one", tagsText: "" })),
    }),
  );
  const body = await response.json();
  const shared = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
  const remainingSharedLinks = await db.query.bookmarkTags.findMany({
    where: eq(bookmarkTags.tagId, shared?.id ?? -1),
  });

  assert(response.status === 200, "shared tag detach should return 200");
  assert(body.value.tags.length === 0, "shared tag should detach from edited bookmark");
  assert(shared?.name === "Shared", "shared detached tag should keep persisted display casing");
  assert(remainingSharedLinks.length === 1, "shared detached tag should remain attached elsewhere");
});

await withApp(async ({ db }) => {
  const repository = new BookmarksRepository(db);
  const firstTags = unwrapResult(parseTagNames("Article beta"));
  const secondTags = unwrapResult(parseTagNames("article"));
  const createResult = await repository.create({
    ...bookmarkPayload({
      description: "Keep https://example.com/keep and remove https://example.com/remove",
    }),
    url: unwrapResult(BookmarkUrl.from("https://example.com/repository")),
    tags: firstTags,
  });
  const bookmark = unwrapResult(createResult);

  await repository.create({
    ...bookmarkPayload({
      url: "https://example.com/repository-second",
      title: "Second",
      tagsText: "article",
    }),
    url: unwrapResult(BookmarkUrl.from("https://example.com/repository-second")),
    tags: secondTags,
  });

  const logContexts: Record<string, unknown>[] = [];
  const updateResult = await repository.update(
    unwrapResult(BookmarkId.from(bookmark.id)),
    {
      ...bookmarkPayload({
        url: "https://example.com/repository",
        title: "Repository Updated",
        description: "Keep https://example.com/keep and add https://example.com/add",
      }),
      url: unwrapResult(BookmarkUrl.from("https://example.com/repository")),
      tags: unwrapResult(parseTagNames("article Gamma")),
    },
    {
      set: (context) => logContexts.push(context),
    },
  );
  const updated = unwrapResult(updateResult);
  const tagContext = logContexts.find((context) => "tags" in context)?.tags as
    | Record<string, unknown>
    | undefined;
  const retainedRelatedLink = updated.relatedLinks[0];
  const attachedRelatedLink = updated.relatedLinks[1];

  if (!retainedRelatedLink || !attachedRelatedLink) {
    throw new Error("repository update should sync related links");
  }

  assert(updated.relatedLinks.length === 2, "repository update should sync related links");
  assert(retainedRelatedLink.url === "https://example.com/keep", "related link should retain");
  assert(attachedRelatedLink.url === "https://example.com/add", "related link should attach");
  assert(tagContext?.submittedCount === 2, "tag diff log should include submitted count");
  assert(tagContext?.attachedCount === 1, "tag diff log should include attached count");
  assert(tagContext?.detachedCount === 1, "tag diff log should include detached count");
  assert(tagContext?.retainedCount === 1, "tag diff log should include retained count");
  assert(
    JSON.stringify(tagContext?.attachedNames) === JSON.stringify(["Gamma"]),
    "tag diff log should include persisted attached names",
  );
  assert(
    JSON.stringify(tagContext?.detachedNames) === JSON.stringify(["beta"]),
    "tag diff log should include persisted detached names",
  );
  assert(
    JSON.stringify(tagContext?.deletedOrphanNames) === JSON.stringify(["beta"]),
    "tag diff log should include deleted orphan names",
  );
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

await withApp(async ({ app }) => {
  const response = await app.handle(request("/api/tags"));
  const body = await response.json();

  assert(response.status === 200, "empty tags list should return 200");
  assert(body.isOk === true, "empty tags list should return Ok result");
  assert(Array.isArray(body.value.tags), "empty tags list should return tags array");
  assert(body.value.tags.length === 0, "empty tags list should return no tags");
});

await withApp(async ({ app, db }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/tag-one",
          title: "Tag One",
          tagsText: "Shared Alpha",
        }),
      ),
    }),
  );
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/tag-two",
          title: "Tag Two",
          tagsText: "shared beta",
        }),
      ),
    }),
  );
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/tag-three",
          title: "Tag Three",
          tagsText: "gamma",
        }),
      ),
    }),
  );

  const gamma = await db.query.tags.findFirst({ where: eq(tags.nameLower, "gamma") });
  if (!gamma) {
    throw new Error("gamma tag should exist before popularity check");
  }

  await db.delete(bookmarkTags).where(eq(bookmarkTags.tagId, gamma.id)).run();

  const response = await app.handle(request("/api/tags"));
  const body = await response.json();

  assert(response.status === 200, "tags list should return 200");
  assert(body.isOk === true, "tags list should return Ok result");
  assert(body.value.tags.length === 4, "tags list should include existing unattached tags");
  assert(body.value.tags[0].name === "Shared", "tags list should keep saved display name");
  assert(body.value.tags[0].nameLower === "shared", "tags list should return normalized name");
  assert(body.value.tags[0].usageCount === 2, "tags list should count current attachments");
  assert(body.value.tags[1].nameLower === "alpha", "equal popularity should sort by nameLower");
  assert(body.value.tags[2].nameLower === "beta", "equal popularity should sort second tag");
  assert(body.value.tags[3].usageCount === 0, "detached existing tag should have zero usage");
});

console.log("bookmark api smoke passed");
