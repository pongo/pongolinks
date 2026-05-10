import { relations } from "drizzle-orm";

import { bookmarks, bookmarkTags, relatedLinks, tags } from "./schema";

export const bookmarksRelations = relations(bookmarks, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
  relatedLinks: many(relatedLinks),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));

export const relatedLinksRelations = relations(relatedLinks, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [relatedLinks.bookmarkId],
    references: [bookmarks.id],
  }),
}));
