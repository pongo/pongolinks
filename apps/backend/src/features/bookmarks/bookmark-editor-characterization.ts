import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";
import { and, eq, sql } from "drizzle-orm";

import { BookmarkId } from "#/features/bookmarks/domain/bookmark-id.ts";
import { BookmarkUrl } from "#/features/bookmarks/domain/bookmark-url.ts";
import { BookmarkEditor } from "#/features/bookmarks/bookmark-editor.ts";
import type { EditableBookmarkData } from "#/features/bookmarks/domain/contracts.ts";
import { BookmarksRepository } from "#/features/bookmarks/bookmarks-repository.ts";
import { parseTagNames } from "#/features/bookmarks/domain/tag-name.ts";
import { createMigratedTestDb } from "../../../test/test-db";

type TestDb = ReturnType<typeof createMigratedTestDb>;

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectDefined<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new Error(message);
  }

  return value;
}

function unwrapResult<T>(result: { isErr: false; value: T } | { isErr: true; error: unknown }): T {
  if (result.isErr) {
    throw new Error(`Expected Ok result, got ${JSON.stringify(result.error)}`);
  }

  return result.value;
}

function assertBookmarkError(
  result: { isErr: boolean; error?: { code?: unknown; status?: unknown } },
  code: string,
  status: number,
  message: string,
) {
  assert(result.isErr === true, `${message} should return Err result`);
  assert(result.error?.code === code, `${message} should return ${code}`);
  assert(result.error?.status === status, `${message} should return ${status}`);
}

function editableBookmark(overrides: Partial<EditableBookmarkData> & { tagsText?: string } = {}) {
  const url = unwrapResult(BookmarkUrl.from(overrides.url?.value() ?? "https://example.com"));
  const tags = unwrapResult(parseTagNames(overrides.tagsText ?? ""));

  return {
    url,
    title: "Example",
    description: "A useful reference",
    isPrivate: false,
    tags,
    ...overrides,
  };
}

function bookmarkTagRowId(db: TestDb["db"], bookmarkId: number, tagId: number) {
  const row = db
    .select({ rowId: sql<number>`rowid` })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)))
    .get();

  return row?.rowId;
}

async function withRepository(
  run: (context: {
    bookmarkEditor: BookmarkEditor;
    repository: BookmarksRepository;
    db: TestDb["db"];
  }) => Promise<void>,
) {
  const database = createMigratedTestDb();

  try {
    await run({
      bookmarkEditor: new BookmarkEditor(database.db),
      repository: new BookmarksRepository(database.db),
      db: database.db,
    });
  } finally {
    database.sqlite.close();
  }
}

await withRepository(async ({ bookmarkEditor }) => {
  const first = await bookmarkEditor.create(editableBookmark());
  unwrapResult(first);

  const duplicate = await bookmarkEditor.create(
    editableBookmark({
      title: "Duplicate",
    }),
  );

  assertBookmarkError(duplicate, "bookmark.url_duplicate", 409, "duplicate create");
});

await withRepository(async ({ bookmarkEditor }) => {
  const created = unwrapResult(
    await bookmarkEditor.create(
      editableBookmark({
        description: "Primary https://example.com and related https://example.com/docs",
        tagsText: "article lang-ru article",
      }),
    ),
  );

  assert(created.tags.length === 2, "create should attach unique submitted tags");
  assert(
    expectDefined(created.tags[0], "create should return first tag").nameLower === "article",
    "create should return sorted first tag",
  );
  assert(
    expectDefined(created.tags[1], "create should return second tag").nameLower === "lang-ru",
    "create should return sorted second tag",
  );
  assert(created.relatedLinks.length === 2, "create should insert extracted related links");
  assert(
    expectDefined(created.relatedLinks[0], "create should return first link").url ===
      "https://example.com",
    "create should return first link",
  );
  assert(
    expectDefined(created.relatedLinks[1], "create should return second link").url ===
      "https://example.com/docs",
    "create should return second link",
  );
});

await withRepository(async ({ bookmarkEditor, repository }) => {
  const first = unwrapResult(
    await bookmarkEditor.create(
      editableBookmark({
        url: unwrapResult(BookmarkUrl.from("https://example.com/one")),
      }),
    ),
  );
  const second = unwrapResult(
    await bookmarkEditor.create(
      editableBookmark({
        url: unwrapResult(BookmarkUrl.from("https://example.com/two")),
        title: "Two",
      }),
    ),
  );

  const duplicateUpdate = await repository.update(
    unwrapResult(BookmarkId.from(second.id)),
    editableBookmark({
      url: unwrapResult(BookmarkUrl.from(first.url)),
      title: "Two",
    }),
  );
  const missingUpdate = await repository.update(
    unwrapResult(BookmarkId.from(999)),
    editableBookmark({
      url: unwrapResult(BookmarkUrl.from("https://example.com/missing")),
      title: "Missing",
    }),
  );

  assertBookmarkError(duplicateUpdate, "bookmark.url_duplicate", 409, "duplicate update");
  assertBookmarkError(missingUpdate, "bookmark.not_found", 404, "missing update");
});

await withRepository(async ({ bookmarkEditor, repository, db }) => {
  const created = unwrapResult(
    await bookmarkEditor.create(
      editableBookmark({
        url: unwrapResult(BookmarkUrl.from("https://example.com/edited")),
        description: "Keep https://example.com/keep and remove https://example.com/remove",
        tagsText: "alpha beta shared",
      }),
    ),
  );
  unwrapResult(
    await bookmarkEditor.create(
      editableBookmark({
        url: unwrapResult(BookmarkUrl.from("https://example.com/other")),
        title: "Other",
        tagsText: "shared",
      }),
    ),
  );

  const beta = expectDefined(
    await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") }),
    "beta tag should exist before update",
  );
  const sharedBefore = expectDefined(
    await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") }),
    "shared tag should exist before update",
  );

  const betaLinkRowId = expectDefined(
    bookmarkTagRowId(db, created.id, beta.id),
    "beta bookmark tag link should exist before update",
  );
  const keptRelatedLinkId = expectDefined(
    created.relatedLinks[0]?.id,
    "kept related link should exist before update",
  );
  const removedRelatedLinkId = expectDefined(
    created.relatedLinks[1]?.id,
    "removed related link should exist before update",
  );

  const updated = unwrapResult(
    await repository.update(
      unwrapResult(BookmarkId.from(created.id)),
      editableBookmark({
        url: unwrapResult(BookmarkUrl.from("https://example.com/edited")),
        title: "Edited",
        description: "Keep https://example.com/keep and add https://example.com/add",
        tagsText: "beta gamma",
      }),
    ),
  );

  const alphaAfterUpdate = await db.query.tags.findFirst({ where: eq(tags.nameLower, "alpha") });
  const sharedAfterUpdate = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
  const betaLinkRowIdAfterUpdate = bookmarkTagRowId(db, created.id, beta.id);
  const sharedLinksAfterUpdate = await db.query.bookmarkTags.findMany({
    where: eq(bookmarkTags.tagId, sharedBefore.id),
  });
  const removedRelatedLinkAfterUpdate = await db.query.relatedLinks.findFirst({
    where: eq(relatedLinks.id, removedRelatedLinkId),
  });
  const persistedBookmark = await db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, created.id),
  });

  assert(persistedBookmark?.title === "Edited", "update should persist editable bookmark fields");
  assert(updated.tags.length === 2, "update should return final submitted tags");
  assert(
    expectDefined(updated.tags[0], "update should return first tag").nameLower === "beta",
    "update should retain submitted beta tag",
  );
  assert(
    expectDefined(updated.tags[1], "update should return second tag").nameLower === "gamma",
    "update should attach submitted gamma tag",
  );
  assert(
    betaLinkRowIdAfterUpdate === betaLinkRowId,
    "update should retain existing bookmark tag link row",
  );
  assert(!alphaAfterUpdate, "update should delete detached orphan tag");
  assert(sharedAfterUpdate?.id === sharedBefore.id, "update should preserve shared detached tag");
  assert(sharedLinksAfterUpdate.length === 1, "shared tag should remain attached elsewhere");
  assert(updated.relatedLinks.length === 2, "update should return final related links");
  assert(
    expectDefined(updated.relatedLinks[0], "update should return first related link").id ===
      keptRelatedLinkId,
    "update should retain existing related link row",
  );
  assert(
    expectDefined(updated.relatedLinks[0], "update should return first related link").url ===
      "https://example.com/keep",
    "update should keep retained related link URL",
  );
  assert(!removedRelatedLinkAfterUpdate, "update should delete removed related link row");
  assert(
    expectDefined(updated.relatedLinks[1], "update should return second related link").url ===
      "https://example.com/add",
    "update should insert new related link",
  );
});

console.log("bookmark editor characterization passed");
