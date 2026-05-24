import { asc, eq } from "drizzle-orm";

import { bookmarks, relatedLinks, tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;

export type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};

export type BookmarkLoaderDb = Pick<AppDb, "query">;

export async function findBookmarkById(
  db: BookmarkLoaderDb,
  id: number,
): Promise<BookmarkWithTagsRow | undefined> {
  return db.query.bookmarks.findFirst({
    where: eq(bookmarks.id, id),
    with: {
      bookmarkTags: {
        with: {
          tag: true,
        },
      },
      relatedLinks: {
        orderBy: asc(relatedLinks.id),
      },
    },
  });
}
