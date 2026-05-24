import {
  assert,
  assertBookmarkErrorCode,
  bookmarkPayload,
  request,
  withApp,
} from "./bookmarks-api-smoke-support.ts";

await withApp(async ({ app }) => {
  await app.handle(
    request("/api/bookmarks", {
      method: "POST",
      body: JSON.stringify(bookmarkPayload()),
    }),
  );

  const response = await app.handle(
    request("/api/bookmarks/1", {
      method: "DELETE",
    }),
  );
  const body = await response.json();

  assert(response.status === 200, "delete should return 200");
  assert(body.isOk === true, "delete should return Ok result");
  assert(body.value.deletedBookmarkId === 1, "delete should return deleted bookmark id");

  const getResponse = await app.handle(request("/api/bookmarks/1"));
  const getBody = await getResponse.json();

  assert(getResponse.status === 404, "deleted bookmark should not be readable");
  assertBookmarkErrorCode(getBody, "bookmark.not_found", "deleted bookmark get");
});

await withApp(async ({ app }) => {
  const response = await app.handle(
    request("/api/bookmarks/999", {
      method: "DELETE",
    }),
  );
  const body = await response.json();

  assert(response.status === 404, "missing delete should return 404");
  assertBookmarkErrorCode(body, "bookmark.not_found", "missing delete");
});

console.log("bookmark delete api smoke passed");
