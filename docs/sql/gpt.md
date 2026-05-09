Да — для `updated_at` в твоём случае разумно заменить отдельный триггер на `.$onUpdate(() => sql\`(CURRENT_TIMESTAMP)\`)`, а FTS5-триггеры оставить, потому что они решают уже не timestamp, а синхронизацию внешнего FTS-индекса. Под актуальную beta-линейку Drizzle такая схема выглядит нормально; `v1.0.0-beta.17` опубликована как pre-release, а поддержка `$onUpdate` для SQLite у Drizzle есть с релизов ветки 0.30.x. [github](https://github.com/drizzle-team/drizzle-orm/releases)

## schema.ts

Ниже даю `schema.ts` для SQLite + Drizzle, с английскими комментариями в коде и с сохранением твоей структуры таблиц, индексов и ограничений. Для `CURRENT_TIMESTAMP` в SQLite Drizzle рекомендует использовать `sql`-default, а само значение хранится как текстовое представление UTC-даты и времени. [orm.drizzle](https://orm.drizzle.team)

```ts
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Bookmarks
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),

    // SQLite stores booleans as integers under the hood
    isPrivate: integer("is_private", { mode: "boolean" })
      .notNull()
      .default(false),

    // CURRENT_TIMESTAMP in SQLite is stored as text
    createdAt: text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),

    // Use Drizzle runtime hook instead of a dedicated updated_at trigger
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    check("bookmarks_url_not_empty", sql`${table.url} <> ''`),
    check("bookmarks_title_not_empty", sql`${table.title} <> ''`),

    // If you want to preserve the explicit DESC index from raw SQL,
    // use a raw SQL fragment inside index().on(...)
    index("idx_bookmarks_updated_at").on(sql`${table.updatedAt} DESC`),
  ],
);

// Tags
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Original spelling for display
    name: text("name").notNull(),

    // Normalized value maintained by the app layer for Unicode-friendly lookup
    nameLower: text("name_lower").notNull(),
  },
  (table) => [
    check("tags_name_not_empty", sql`${table.name} <> ''`),
    check("tags_name_lower_not_empty", sql`${table.nameLower} <> ''`),
    uniqueIndex("tags_name_lower_unique").on(table.nameLower),
  ],
);

// Many-to-many relation between bookmarks and tags
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

// Related links
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
    index("idx_related_links_bookmark_id").on(table.bookmarkId),
    index("idx_related_links_url").on(table.url),
  ],
);
```

## relations.ts

Если хочешь сразу удобные relations для `db.query.*`, добавь ещё отдельный файл. Это не заменяет FK, а только описывает ORM-связи на уровне Drizzle.  

```ts
import { relations } from "drizzle-orm";
import { bookmarks, bookmarkTags, relatedLinks, tags } from "./schema";

// Bookmarks relations
export const bookmarksRelations = relations(bookmarks, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
  relatedLinks: many(relatedLinks),
}));

// Tags relations
export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

// BookmarkTags relations
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

// RelatedLinks relations
export const relatedLinksRelations = relations(relatedLinks, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [relatedLinks.bookmarkId],
    references: [bookmarks.id],
  }),
}));
```

## custom migration

FTS5-таблицу и её триггеры я бы оставил в custom migration, потому что для таких вещей обычно удобнее использовать raw SQL, и в экосистеме Drizzle FTS5 часто заводят именно так. Для raw SQL Drizzle предлагает `sql\`\`` / custom migrations, а для FTS5 нет такого же удобного декларативного уровня, как для обычных таблиц. [orm.drizzle](https://orm.drizzle.team/docs/sql)

```sql
-- Enable FK checks for the current SQLite connection if needed.
PRAGMA foreign_keys = ON;

-- FTS5 virtual table
CREATE VIRTUAL TABLE bookmarks_fts USING fts5(
    title,
    description,
    content='bookmarks',
    content_rowid='id',
    tokenize='unicode61'
);

-- Insert trigger
CREATE TRIGGER bookmarks_ai
AFTER INSERT ON bookmarks
BEGIN
    INSERT INTO bookmarks_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

-- Update trigger: remove old indexed row first
CREATE TRIGGER bookmarks_bu
BEFORE UPDATE OF title, description ON bookmarks
BEGIN
    INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
END;

-- Update trigger: insert new indexed row
CREATE TRIGGER bookmarks_au
AFTER UPDATE OF title, description ON bookmarks
BEGIN
    INSERT INTO bookmarks_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

-- Delete trigger
CREATE TRIGGER bookmarks_bd
BEFORE DELETE ON bookmarks
BEGIN
    INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
END;
```

## что убрать и что оставить

Триггер `update_bookmarks_updated_at` можно убрать, если все изменения `bookmarks` проходят через Drizzle и ты сознательно переносишь это поведение на `.$onUpdate(...)`. Подход с `$onUpdate` для SQLite у Drizzle поддерживается, а `CURRENT_TIMESTAMP` для SQLite как раз задают через `sql`-default. [orm.drizzle](https://orm.drizzle.team)

FTS5-триггеры лучше оставить, потому что они поддерживают консистентность `bookmarks_fts` при `INSERT / UPDATE / DELETE`, а это уже отдельная задача, не связанная с `updated_at`. Для FTS5 в связке с Drizzle обычно используют raw SQL и custom migrations. [github](https://github.com/delucis/astro-db-fts)

`PRAGMA foreign_keys = ON` не стоит считать частью `schema.ts`; это лучше включать при инициализации соединения с SQLite или отдельной init-миграцией. В самих таблицах `references(..., { onDelete: "cascade" })` ты уже правильно описываешь каскадное удаление на стороне схемы.

## практический вариант

Я бы использовал такой расклад:

- `schema.ts` — обычные таблицы, FK, check, indexes, `updatedAt` через `.$onUpdate(...)`.
- `relations.ts` — ORM relations.
- `000x_fts.sql` — `CREATE VIRTUAL TABLE ...` и 4 FTS-триггера.
- Инициализация БД — `PRAGMA foreign_keys = ON`.

Если хочешь, я могу сразу собрать это в готовый набор файлов под `drizzle-kit` в формате `schema.ts + relations.ts + migration.sql`.