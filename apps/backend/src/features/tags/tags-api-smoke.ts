import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import { desc, eq, notExists, sql } from "drizzle-orm";

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

async function createBookmark(
  app: { handle: (request: Request) => Promise<Response> },
  payload: Record<string, unknown>,
) {
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

async function readTagsEtag(app: {
  handle: (request: Request) => Promise<Response>;
}): Promise<string> {
  const response = await app.handle(request("/api/tags"));
  const body = await response.json();
  const etag = assertPrivateRevalidationHeaders(response);

  assert(response.status === 200, "tags etag read should return 200");
  assert(body.isOk === true, "tags etag read should return Ok result");

  return etag;
}

async function assertTagsEtagChangedAfterMutation(
  app: { handle: (request: Request) => Promise<Response> },
  previousEtag: string,
) {
  const revalidatedResponse = await app.handle(
    request("/api/tags", {
      headers: {
        "if-none-match": previousEtag,
      },
    }),
  );
  const revalidatedBody = await revalidatedResponse.json();
  const nextEtag = assertPrivateRevalidationHeaders(revalidatedResponse);

  assert(revalidatedResponse.status === 200, "stale tags etag should return 200 after mutation");
  assert(revalidatedBody.isOk === true, "stale tags etag should return fresh Ok payload");
  assert(nextEtag !== previousEtag, "tags etag should change after membership-affecting mutation");
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

await withApp(async ({ app, db }) => {
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
  assert(body.value.tags[2].nameLower === "beta", "equal popularity should sort second tag");
  assert(body.value.tags[3].nameLower === "gamma", "equal popularity should sort third tag");

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

  const shared = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
  assert(shared, "shared tag should exist for follow-up tag update tests");
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/create-a",
    title: "Create A",
    tagsText: "alpha",
  });
  const etagBeforeCreate = await readTagsEtag(app);

  await createBookmark(app, {
    url: "https://example.com/create-b",
    title: "Create B",
    tagsText: "alpha",
  });

  await assertTagsEtagChangedAfterMutation(app, etagBeforeCreate);
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/update-a",
    title: "Update A",
    tagsText: "alpha",
  });
  await createBookmark(app, {
    url: "https://example.com/update-b",
    title: "Update B",
    tagsText: "beta",
  });
  const etagBeforeUpdate = await readTagsEtag(app);

  const updateResponse = await app.handle(
    request("/api/bookmarks/2", {
      method: "PATCH",
      body: JSON.stringify(
        bookmarkPayload({
          url: "https://example.com/update-b",
          title: "Update B",
          tagsText: "alpha",
        }),
      ),
    }),
  );
  const updateBody = await updateResponse.json();

  assert(updateResponse.status === 200, "bookmark update should return 200");
  assert(updateBody.isOk === true, "bookmark update should return Ok");

  await assertTagsEtagChangedAfterMutation(app, etagBeforeUpdate);
});

await withApp(async ({ app }) => {
  await createBookmark(app, {
    url: "https://example.com/delete-a",
    title: "Delete A",
    tagsText: "alpha",
  });
  await createBookmark(app, {
    url: "https://example.com/delete-b",
    title: "Delete B",
    tagsText: "alpha",
  });
  const etagBeforeDelete = await readTagsEtag(app);

  const deleteResponse = await app.handle(
    request("/api/bookmarks/2", {
      method: "DELETE",
    }),
  );
  const deleteBody = await deleteResponse.json();

  assert(deleteResponse.status === 200, "bookmark delete should return 200");
  assert(deleteBody.isOk === true, "bookmark delete should return Ok");

  await assertTagsEtagChangedAfterMutation(app, etagBeforeDelete);
});

await withApp(async ({ app, db }) => {
  await createBookmark(app, { tagsText: "Article" });
  const source = await db.query.tags.findFirst({ where: eq(tags.nameLower, "article") });
  assert(source, "article tag should exist before display rename");

  const response = await app.handle(
    request(`/api/tags/${source.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "ARTICLE" }),
    }),
  );
  const body = await response.json();
  const updated = await db.query.tags.findFirst({ where: eq(tags.id, source.id) });

  assert(response.status === 200, "display rename should return 200");
  assert(body.isOk === true, "display rename should return Ok result");
  assert(body.value.id === source.id, "display rename should preserve tag id");
  assert(updated?.name === "ARTICLE", "display rename should update display name");
  assert(updated?.nameLower === "article", "display rename should preserve nameLower");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/tags/1", {
      method: "PATCH",
      body: JSON.stringify({ name: " " }),
    }),
  );
  const body = await response.json();

  assert(response.status === 400, "blank tag name should return 400");
  assert(body.isErr === true, "blank tag name should return Err");
  assert(body.error.code === "tag.name_invalid", "blank tag name should return tag.name_invalid");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/tags/999", {
      method: "PATCH",
      body: JSON.stringify({ name: "news" }),
    }),
  );
  const body = await response.json();

  assert(response.status === 404, "patch missing tag should return 404");
  assert(body.isErr === true, "patch missing tag should return Err");
  assert(body.error.code === "tag.not_found", "patch missing tag should return tag.not_found");
});

await withApp(async ({ app, db }) => {
  await createBookmark(app, { url: "https://example.com/a", title: "A", tagsText: "alpha" });
  const alpha = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
  assert(alpha, "alpha tag should exist before replace");

  const response = await app.handle(
    request(`/api/tags/${alpha.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "zeta" }),
    }),
  );
  const body = await response.json();
  const zeta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "zeta") });

  assert(response.status === 200, "replace with new tag name should return 200");
  assert(body.isOk === true, "replace with new tag name should return Ok");
  assert(zeta?.id === alpha.id, "replace with new name should keep same tag identity");
  assert(zeta?.name === "zeta", "replace with new name should persist new display name");
});

await withApp(async ({ app, db }) => {
  await createBookmark(app, {
    url: "https://example.com/one",
    title: "One",
    tagsText: "alpha beta",
  });
  await createBookmark(app, { url: "https://example.com/two", title: "Two", tagsText: "alpha" });
  await createBookmark(app, { url: "https://example.com/three", title: "Three", tagsText: "beta" });

  const alpha = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
  const beta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") });
  assert(alpha && beta, "alpha and beta should exist before merge");

  const response = await app.handle(
    request(`/api/tags/${alpha.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "beta" }),
    }),
  );
  const body = await response.json();

  const alphaAfter = await db.query.tags.findFirst({ where: eq(tags.id, alpha.id) });
  const betaAfter = await db.query.tags.findFirst({ where: eq(tags.id, beta.id) });
  const betaLinks = await db.query.bookmarkTags.findMany({
    where: eq(bookmarkTags.tagId, beta.id),
  });
  const duplicateRows = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(bookmarkTags)
    .where(eq(bookmarkTags.tagId, beta.id))
    .groupBy(bookmarkTags.bookmarkId)
    .having(sql`count(*) > 1`)
    .all();

  assert(response.status === 200, "merge into existing tag should return 200");
  assert(body.isOk === true, "merge into existing tag should return Ok");
  assert(body.value.id === beta.id, "merge result should point to replacement tag id");
  assert(!alphaAfter, "source tag should be deleted after merge");
  assert(betaAfter?.usageCount === 3, "replacement usageCount should stay correct after merge");
  assert(betaLinks.length === 3, "merge should retain unique bookmark-tag attachments");
  assert(duplicateRows.length === 0, "merge should not create duplicate bookmark-tag rows");
});

await withApp(async ({ app, db }) => {
  await createBookmark(app, { url: "https://example.com/keep", title: "Keep", tagsText: "retain" });
  await createBookmark(app, {
    url: "https://example.com/remove",
    title: "Remove",
    tagsText: "remove retain",
  });

  const retain = await db.query.tags.findFirst({ where: eq(tags.nameLower, "retain") });
  const remove = await db.query.tags.findFirst({ where: eq(tags.nameLower, "remove") });
  assert(retain && remove, "retain and remove tags should exist before delete");

  const deleteResponse = await app.handle(
    request(`/api/tags/${remove.id}`, {
      method: "DELETE",
    }),
  );
  const deleteBody = await deleteResponse.json();
  const removedTag = await db.query.tags.findFirst({ where: eq(tags.id, remove.id) });
  const bookmarkCount = await db
    .select({ totalCount: sql<number>`count(*)` })
    .from(bookmarks)
    .get();
  const retainAfter = await db.query.tags.findFirst({ where: eq(tags.id, retain.id) });

  assert(deleteResponse.status === 200, "delete tag should return 200");
  assert(deleteBody.isOk === true, "delete tag should return Ok");
  assert(deleteBody.value.deletedTagId === remove.id, "delete tag should return deleted id");
  assert(!removedTag, "deleted tag should be removed from tags table");
  assert(Number(bookmarkCount?.totalCount ?? 0) === 2, "delete tag should not delete bookmarks");
  assert(retainAfter?.usageCount === 2, "usageCount should remain correct for unaffected tags");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/tags/999", {
      method: "DELETE",
    }),
  );
  const body = await response.json();

  assert(response.status === 404, "missing tag delete should return 404");
  assert(body.isErr === true, "missing tag delete should return Err");
  assert(body.error.code === "tag.not_found", "missing tag delete should return tag.not_found");
});

await withApp(async ({ app, db }) => {
  for (let index = 0; index < 102; index++) {
    const row = await db
      .insert(bookmarks)
      .values({
        url: `https://example.com/untagged-${index}`,
        title: `Untagged ${index}`,
      })
      .returning({ id: bookmarks.id })
      .get();

    if (index < 2) {
      const tag = await db
        .insert(tags)
        .values({
          name: `tagged-${index}`,
          nameLower: `tagged-${index}`,
        })
        .returning({ id: tags.id })
        .get();

      await db
        .insert(bookmarkTags)
        .values({
          bookmarkId: row.id,
          tagId: tag.id,
        })
        .run();
    }
  }

  const expected = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      notExists(
        db
          .select({ one: sql<number>`1` })
          .from(bookmarkTags)
          .where(eq(bookmarkTags.bookmarkId, bookmarks.id)),
      ),
    )
    .orderBy(desc(bookmarks.updatedAt), desc(bookmarks.id))
    .all();

  const response = await app.handle(request("/api/tags/untagged-bookmarks"));
  const body = await response.json();

  assert(response.status === 200, "untagged endpoint should return 200");
  assert(body.isOk === true, "untagged endpoint should return Ok");
  assert(body.value.totalCount === 100, "untagged endpoint should return full count without limit");
  assert(body.value.bookmarks.length === 100, "untagged endpoint should apply 100 row limit");
  assert(
    body.value.bookmarks[0].id === expected[0]?.id,
    "untagged endpoint should sort by updatedAt desc and id desc",
  );
  assert(
    body.value.bookmarks[99].id === expected[99]?.id,
    "untagged endpoint should preserve sorted order across limited rows",
  );
});

console.log("tag api smoke passed");
