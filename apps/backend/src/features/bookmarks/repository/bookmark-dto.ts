import type { BookmarkDTO } from "../domain/contracts.ts";
import type { BookmarkWithTagsRow } from "./bookmark-loader.ts";

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
