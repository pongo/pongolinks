import { asc, desc, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    check("bookmarks_url_not_empty", sql`${table.url} <> ''`),
    check("bookmarks_title_not_empty", sql`${table.title} <> ''`),
    check("bookmarks_is_private_boolean", sql`${table.isPrivate} IN (0, 1)`),
    index("idx_bookmarks_updated_at_id").on(desc(table.updatedAt), desc(table.id)),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Original spelling for display
    name: text("name").notNull(),

    // Normalized value maintained by the app layer for Unicode-friendly lookup
    nameLower: text("name_lower").notNull().unique(),

    // Maintained by database triggers on `bookmark_tags`
    usageCount: integer("usage_count").notNull().default(0),
  },
  (table) => [
    check("tags_name_not_empty", sql`${table.name} <> ''`),
    check("tags_name_lower_not_empty", sql`${table.nameLower} <> ''`),
    check("tags_usage_count_non_negative", sql`${table.usageCount} >= 0`),
    index("idx_tags_usage_count_name").on(desc(table.usageCount), asc(table.nameLower)),
  ],
);

export const bookmarkTags = sqliteTable(
  "bookmark_tags",
  {
    bookmarkId: integer("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),
    index("idx_bookmark_tags_tag_id").on(table.tagId),
  ],
);

export const relatedLinks = sqliteTable(
  "related_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bookmarkId: integer("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
  },
  (table) => [
    check("related_links_url_not_empty", sql`${table.url} <> ''`),
    uniqueIndex("related_links_bookmark_id_url_unique").on(table.bookmarkId, table.url),
    index("idx_related_links_bookmark_id").on(table.bookmarkId),
    index("idx_related_links_url").on(table.url),
  ],
);
