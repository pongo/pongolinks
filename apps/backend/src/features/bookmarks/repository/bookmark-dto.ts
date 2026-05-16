import { bookmarks, relatedLinks, tags } from "@pongolinks/db/schema";

import type { BookmarkDTO } from "../domain/contracts.ts";

type BookmarkRow = typeof bookmarks.$inferSelect;
type TagRow = typeof tags.$inferSelect;
type RelatedLinkRow = typeof relatedLinks.$inferSelect;

export type BookmarkWithTagsRow = BookmarkRow & {
  bookmarkTags: { tag: TagRow }[];
  relatedLinks: RelatedLinkRow[];
};

export function toBookmarkDTO(row: BookmarkWithTagsRow): BookmarkDTO {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    isPrivate: row.isPrivate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.bookmarkTags
      .map(({ tag }) => ({
        id: tag.id,
        name: tag.name,
        nameLower: tag.nameLower,
      }))
      .sort((left, right) => left.nameLower.localeCompare(right.nameLower)),
    relatedLinks: row.relatedLinks.map((relatedLink) => ({
      id: relatedLink.id,
      url: relatedLink.url,
    })),
  };
}
