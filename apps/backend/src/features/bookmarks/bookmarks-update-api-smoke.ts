import { bookmarks, bookmarkTags, tags } from "@pongolinks/db/schema";
import { eq } from "drizzle-orm";

import {
  assert,
  bookmarkPayload,
  bookmarkTagRowId,
  request,
  withApp,
} from "./bookmarks-api-smoke-support";

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
  const betaLinkRowId = (await bookmarkTagRowId(db, 1, beta.id))?.rowId;

  const syncResponse = await app.handle(
    request("/api/bookmarks/1", {
      method: "PATCH",
      body: JSON.stringify(bookmarkPayload({ tagsText: "beta gamma" })),
    }),
  );
  const syncBody = await syncResponse.json();
  const alphaAfterSync = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
  const betaLinkRowIdAfterSync = (await bookmarkTagRowId(db, 1, beta.id))?.rowId;

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
  const { id, updatedAt } = await db
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

console.log("bookmark update api smoke passed");
