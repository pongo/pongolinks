import { bookmarks, bookmarkTags, relatedLinks, tags } from "@pongolinks/db/schema";
import type { Result } from "@pongolinks/shared/result";
import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createMigratedTestDb } from "#test/test-db.ts";
import { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { BookmarkId } from "../domain/bookmark-id.ts";
import type { EditableBookmarkData } from "../domain/contracts.ts";
import { parseTagNames } from "#/features/tags/tag-name.ts";
import { BookmarkEditor } from "./bookmark-editor.ts";

type TestDb = Awaited<ReturnType<typeof createMigratedTestDb>>;

function unwrapResult<T, E extends Error>(result: Result<T, E>): T {
  expect(result.isOk).toBe(true);

  if (result.isErr) {
    throw result.error;
  }

  return result.value;
}

function editableBookmark(overrides: Partial<EditableBookmarkData> & { tagsText?: string } = {}) {
  const url = unwrapResult(BookmarkUrl.from(overrides.url?.value() ?? "https://example.com"));
  const parsedTags = unwrapResult(parseTagNames(overrides.tagsText ?? ""));

  return {
    url,
    title: "Example",
    description: "A useful reference",
    isPrivate: false,
    tags: parsedTags,
    ...overrides,
  };
}

function bookmarkTagRowId(db: TestDb["db"], bookmarkId: number, tagId: number) {
  return db
    .select({ rowId: sql<number>`rowid` })
    .from(bookmarkTags)
    .where(and(eq(bookmarkTags.bookmarkId, bookmarkId), eq(bookmarkTags.tagId, tagId)))
    .get();
}

async function withRepository(
  run: (context: { bookmarkEditor: BookmarkEditor; db: TestDb["db"] }) => Promise<void>,
) {
  const database = await createMigratedTestDb();

  try {
    await run({
      bookmarkEditor: new BookmarkEditor(database.db),
      db: database.db,
    });
  } finally {
    database.close();
  }
}

describe("Bookmark editor", () => {
  it("rejects duplicate bookmark URLs on create", async () => {
    await withRepository(async ({ bookmarkEditor }) => {
      const first = await bookmarkEditor.create(editableBookmark());
      expect(first.isOk).toBe(true);

      const duplicate = await bookmarkEditor.create(
        editableBookmark({
          title: "Duplicate",
        }),
      );

      expect(duplicate.isErr).toBe(true);
      if (duplicate.isErr) {
        expect(duplicate.error.code).toBe("bookmark.url_duplicate");
        expect(duplicate.error.status).toBe(409);
      }
    });
  });

  it("attaches unique sorted tags and extracted related links on create", async () => {
    await withRepository(async ({ bookmarkEditor }) => {
      const created = unwrapResult(
        await bookmarkEditor.create(
          editableBookmark({
            description: "Primary https://example.com and related https://example.com/docs",
            tagsText: "article lang-ru article",
          }),
        ),
      );

      expect(created.tags.map((tag) => tag.nameLower)).toEqual(["article", "lang-ru"]);
      expect(created.relatedLinks.map((relatedLink) => relatedLink.url)).toEqual([
        "https://example.com",
        "https://example.com/docs",
      ]);
    });
  });

  it("rejects duplicate URLs and missing bookmarks on update", async () => {
    await withRepository(async ({ bookmarkEditor }) => {
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

      const duplicateUpdate = await bookmarkEditor.update(
        unwrapResult(BookmarkId.from(second.id)),
        editableBookmark({
          url: unwrapResult(BookmarkUrl.from(first.url)),
          title: "Two",
        }),
      );
      const missingUpdate = await bookmarkEditor.update(
        unwrapResult(BookmarkId.from(999)),
        editableBookmark({
          url: unwrapResult(BookmarkUrl.from("https://example.com/missing")),
          title: "Missing",
        }),
      );

      expect(duplicateUpdate.isErr).toBe(true);
      if (duplicateUpdate.isErr) {
        expect(duplicateUpdate.error.code).toBe("bookmark.url_duplicate");
        expect(duplicateUpdate.error.status).toBe(409);
      }

      expect(missingUpdate.isErr).toBe(true);
      if (missingUpdate.isErr) {
        expect(missingUpdate.error.code).toBe("bookmark.not_found");
        expect(missingUpdate.error.status).toBe(404);
      }
    });
  });

  it("persists edits while preserving retained rows and deleting detached orphan data", async () => {
    await withRepository(async ({ bookmarkEditor, db }) => {
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

      const beta = await db.query.tags.findFirst({ where: eq(tags.nameLower, "beta") });
      expect(beta).toBeDefined();
      if (!beta) return;

      const sharedBefore = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
      expect(sharedBefore).toBeDefined();
      if (!sharedBefore) return;

      const betaLinkRow = await bookmarkTagRowId(db, created.id, beta.id);
      expect(betaLinkRow).toBeDefined();
      if (!betaLinkRow) return;

      const keptRelatedLinkId = created.relatedLinks[0]?.id;
      const removedRelatedLinkId = created.relatedLinks[1]?.id;
      expect(keptRelatedLinkId).toEqual(expect.any(Number));
      expect(removedRelatedLinkId).toEqual(expect.any(Number));
      if (keptRelatedLinkId === undefined || removedRelatedLinkId === undefined) return;

      const updated = unwrapResult(
        await bookmarkEditor.update(
          unwrapResult(BookmarkId.from(created.id)),
          editableBookmark({
            url: unwrapResult(BookmarkUrl.from("https://example.com/edited")),
            title: "Edited",
            description: "Keep https://example.com/keep and add https://example.com/add",
            tagsText: "beta gamma",
          }),
        ),
      );

      const alphaAfterUpdate = await db.query.tags.findFirst({
        where: eq(tags.nameLower, "alpha"),
      });
      const sharedAfterUpdate = await db.query.tags.findFirst({
        where: eq(tags.nameLower, "shared"),
      });
      const betaLinkRowIdAfterUpdate = (await bookmarkTagRowId(db, created.id, beta.id))?.rowId;
      const sharedLinksAfterUpdate = await db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.tagId, sharedBefore.id),
      });
      const removedRelatedLinkAfterUpdate = await db.query.relatedLinks.findFirst({
        where: eq(relatedLinks.id, removedRelatedLinkId),
      });
      const persistedBookmark = await db.query.bookmarks.findFirst({
        where: eq(bookmarks.id, created.id),
      });

      expect(persistedBookmark?.title).toBe("Edited");
      expect(updated.tags.map((tag) => tag.nameLower)).toEqual(["beta", "gamma"]);
      expect(betaLinkRowIdAfterUpdate).toBe(betaLinkRow.rowId);
      expect(alphaAfterUpdate).toBeUndefined();
      expect(sharedAfterUpdate?.id).toBe(sharedBefore.id);
      expect(sharedLinksAfterUpdate).toHaveLength(1);
      expect(updated.relatedLinks).toEqual([
        {
          id: keptRelatedLinkId,
          url: "https://example.com/keep",
        },
        {
          id: expect.any(Number),
          url: "https://example.com/add",
        },
      ]);
      expect(removedRelatedLinkAfterUpdate).toBeUndefined();
    });
  });

  it("deletes a bookmark with owned related rows and only single-use orphan tags", async () => {
    await withRepository(async ({ bookmarkEditor, db }) => {
      const deletedTarget = unwrapResult(
        await bookmarkEditor.create(
          editableBookmark({
            url: unwrapResult(BookmarkUrl.from("https://example.com/delete-me")),
            description: "Related https://example.com/delete-me/docs",
            tagsText: "single shared",
          }),
        ),
      );
      const preservedBookmark = unwrapResult(
        await bookmarkEditor.create(
          editableBookmark({
            url: unwrapResult(BookmarkUrl.from("https://example.com/preserved")),
            title: "Preserved",
            tagsText: "shared",
          }),
        ),
      );

      const sharedBefore = await db.query.tags.findFirst({ where: eq(tags.nameLower, "shared") });
      expect(sharedBefore).toBeDefined();
      if (!sharedBefore) return;

      const result = unwrapResult(
        await bookmarkEditor.delete(unwrapResult(BookmarkId.from(deletedTarget.id))),
      );

      const deletedBookmark = await db.query.bookmarks.findFirst({
        where: eq(bookmarks.id, deletedTarget.id),
      });
      const deletedRelatedLinks = await db.query.relatedLinks.findMany({
        where: eq(relatedLinks.bookmarkId, deletedTarget.id),
      });
      const deletedBookmarkTags = await db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.bookmarkId, deletedTarget.id),
      });
      const singleAfterDelete = await db.query.tags.findFirst({
        where: eq(tags.nameLower, "single"),
      });
      const sharedAfterDelete = await db.query.tags.findFirst({
        where: eq(tags.nameLower, "shared"),
      });
      const remainingSharedLinks = await db.query.bookmarkTags.findMany({
        where: eq(bookmarkTags.tagId, sharedBefore.id),
      });

      expect(result).toEqual({ deletedBookmarkId: deletedTarget.id });
      expect(deletedBookmark).toBeUndefined();
      expect(deletedRelatedLinks).toHaveLength(0);
      expect(deletedBookmarkTags).toHaveLength(0);
      expect(singleAfterDelete).toBeUndefined();
      expect(sharedAfterDelete?.id).toBe(sharedBefore.id);
      expect(remainingSharedLinks).toEqual([
        {
          bookmarkId: preservedBookmark.id,
          tagId: sharedBefore.id,
        },
      ]);
    });
  });

  it("returns bookmark.not_found when deleting a missing bookmark", async () => {
    await withRepository(async ({ bookmarkEditor }) => {
      const result = await bookmarkEditor.delete(unwrapResult(BookmarkId.from(999)));

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error.code).toBe("bookmark.not_found");
        expect(result.error.status).toBe(404);
      }
    });
  });
});
