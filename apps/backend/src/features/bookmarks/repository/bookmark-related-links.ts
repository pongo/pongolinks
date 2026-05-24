import { asc, eq } from "drizzle-orm";
import type { ValidUrl } from "@pongolinks/shared/brands";

import { relatedLinks } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import type { RelatedLinkSyncDiff } from "../application/bookmark-editor.ts";

export type RelatedLinkSyncDb = Pick<AppDb, "delete" | "insert" | "query">;

export async function insertBookmarkRelatedLinks(
  db: RelatedLinkSyncDb,
  bookmarkId: number,
  urls: ValidUrl[],
) {
  if (urls.length === 0) {
    return;
  }

  await db
    .insert(relatedLinks)
    .values(urls.map((url) => ({ bookmarkId, url })))
    .run();
}

export async function syncBookmarkRelatedLinks(
  db: RelatedLinkSyncDb,
  bookmarkId: number,
  nextUrls: ValidUrl[],
): Promise<RelatedLinkSyncDiff> {
  const existingRows = await db.query.relatedLinks.findMany({
    where: eq(relatedLinks.bookmarkId, bookmarkId),
    orderBy: asc(relatedLinks.id),
  });
  const nextUrlSet = new Set(nextUrls);
  const existingUrlSet = new Set(existingRows.map((row) => row.url as ValidUrl));
  const urlsToInsert = nextUrls.filter((url) => !existingUrlSet.has(url));
  const rowsToDelete = existingRows.filter((row) => !nextUrlSet.has(row.url as ValidUrl));
  const urlsToDelete = rowsToDelete.map((row) => row.url as ValidUrl);

  for (const row of rowsToDelete) {
    await db.delete(relatedLinks).where(eq(relatedLinks.id, row.id)).run();
  }

  await insertBookmarkRelatedLinks(db, bookmarkId, urlsToInsert);

  return {
    insertedCount: urlsToInsert.length,
    deletedCount: rowsToDelete.length,
    retainedCount: existingRows.length - rowsToDelete.length,
    urlsToInsert,
    urlsToDelete,
  };
}
