Вот полная схема для `drizzle-orm@v1.0.0-beta.17`. Я разбил её на три файла: основная схема, конфиг Drizzle Kit и отдельный SQL-файл для FTS5 (Drizzle не поддерживает `CREATE VIRTUAL TABLE` нативно).

***

**`src/schema.ts`**

```typescript
/**
 * Drizzle ORM schema — drizzle-orm@v1.0.0-beta.17
 *
 * IMPORTANT CAVEATS:
 *  1. `updatedAt.$onUpdate()` fires only through Drizzle's .update() API.
 *     Raw SQL updates bypass it — add the DB-level trigger in fts5.sql if needed.
 *  2. FTS5 virtual table and its sync triggers are in fts5.sql (custom migration).
 *     Drizzle does not support CREATE VIRTUAL TABLE.
 *  3. PRAGMA foreign_keys = ON must be enabled at the connection level (see db.ts).
 */

import {
  sqliteTable,
  index,
  primaryKey,
  check,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// bookmarks
// ─────────────────────────────────────────────────────────────────────────────

export const bookmarks = sqliteTable(
  "bookmarks",
  (t) => ({
    id: t.integer().primaryKey({ autoIncrement: true }),

    /** Canonical bookmark URL; must be unique and non-empty */
    url: t.text().notNull().unique(),

    title: t.text().notNull(),

    description: t.text().notNull().default(""),

    /**
     * Visibility flag: false = public, true = private.
     * Stored as INTEGER 0/1 in SQLite; Drizzle maps it to JS boolean.
     */
    isPrivate: t
      .integer("is_private", { mode: "boolean" })
      .notNull()
      .default(false),

    createdAt: t
      .text("created_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),

    /**
     * Auto-updated at the ORM level on every Drizzle .update() call.
     * Does NOT fire on raw SQL updates outside Drizzle.
     */
    updatedAt: t
      .text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  }),
  (table) => [
    check("url_not_empty", sql`${table.url} <> ''`),
    check("title_not_empty", sql`${table.title} <> ''`),

    // Optimizes ORDER BY updated_at DESC pagination queries
    index("idx_bookmarks_updated_at").on(table.updatedAt.desc()),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// tags
// ─────────────────────────────────────────────────────────────────────────────

export const tags = sqliteTable(
  "tags",
  (t) => ({
    id: t.integer().primaryKey({ autoIncrement: true }),

    /** Original casing — used for display */
    name: t.text().notNull(),

    /**
     * Lowercased/normalized name — uniqueness is enforced here.
     * Normalization happens in application code for full Unicode safety.
     */
    nameLower: t.text("name_lower").notNull().unique(),
  }),
  (table) => [
    check("name_not_empty", sql`${table.name} <> ''`),
    check("name_lower_not_empty", sql`${table.nameLower} <> ''`),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// bookmark_tags  (M:N pivot)
// ─────────────────────────────────────────────────────────────────────────────

export const bookmarkTags = sqliteTable(
  "bookmark_tags",
  (t) => ({
    bookmarkId: t
      .integer("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),

    tagId: t
      .integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  }),
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),

    // Covers "all bookmarks with a given tag" queries
    index("idx_bookmark_tags_tag_id").on(table.tagId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// related_links
// ─────────────────────────────────────────────────────────────────────────────

export const relatedLinks = sqliteTable(
  "related_links",
  (t) => ({
    id: t.integer().primaryKey({ autoIncrement: true }),

    bookmarkId: t
      .integer("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),

    url: t.text().notNull(),
  }),
  (table) => [
    check("url_not_empty", sql`${table.url} <> ''`),

    // Fast "all related links for a given bookmark" lookup
    index("idx_related_links_bookmark_id").on(table.bookmarkId),

    // Fast URL search among related links
    index("idx_related_links_url").on(table.url),
  ],
);
```

***

**`drizzle/fts5.sql`** *(кастомная миграция — запустить вручную после основной)*

```sql
-- FTS5 virtual table for full-text search over bookmarks.
-- External content mode keeps the index in sync with the bookmarks table.
-- unicode61 tokenizer ensures correct Unicode / Cyrillic tokenization.
-- Run this file manually after applying the main Drizzle migration.

CREATE VIRTUAL TABLE bookmarks_fts USING fts5(
    title,
    description,
    content='bookmarks',
    content_rowid='id',
    tokenize='unicode61'
);

-- INSERT: add new bookmark to the FTS index
CREATE TRIGGER bookmarks_ai AFTER INSERT ON bookmarks BEGIN
    INSERT INTO bookmarks_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

-- BEFORE UPDATE: remove the stale FTS entry before title/description change
CREATE TRIGGER bookmarks_bu BEFORE UPDATE OF title, description ON bookmarks BEGIN
    INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
END;

-- AFTER UPDATE: insert the refreshed entry into the FTS index
CREATE TRIGGER bookmarks_au AFTER UPDATE OF title, description ON bookmarks BEGIN
    INSERT INTO bookmarks_fts(rowid, title, description)
    VALUES (new.id, new.title, new.description);
END;

-- BEFORE DELETE: purge the bookmark from the FTS index
CREATE TRIGGER bookmarks_bd BEFORE DELETE ON bookmarks BEGIN
    INSERT INTO bookmarks_fts(bookmarks_fts, rowid, title, description)
    VALUES ('delete', old.id, old.title, old.description);
END;
```

***

**`drizzle.config.ts`**

```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database.sqlite",
  },
} satisfies Config;
```

***

**`src/db.ts`**

```typescript
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("database.sqlite");

// Foreign key enforcement is OFF by default in SQLite — must be set per connection
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

***

## Ключевые решения

**`updatedAt` и `$onUpdate`** — ты правильно предложил заменить триггер `update_bookmarks_updated_at`. `$onUpdate(() => sql\`(CURRENT_TIMESTAMP)\`)` автоматически подставляет значение в каждый `UPDATE`-запрос, сформированный через Drizzle. Если в проекте будут прямые SQL-запросы в обход ORM, триггер стоит оставить в `fts5.sql`.

**FTS5** — `CREATE VIRTUAL TABLE` не поддерживается схемой Drizzle нативно. Решение — отдельный SQL-файл, который запускается один раз после основной миграции. Все четыре триггера синхронизации (`_ai`, `_bu`, `_au`, `_bd`) перенесены без изменений. [github](https://github.com/delucis/astro-db-fts)

**`is_private`** — вместо `CHECK(is_private IN (0, 1))` используется `mode: "boolean"`: Drizzle сам ограничивает значения 0/1 на уровне типа и маппит их в JS `boolean`. Добавлять отдельный `check()` избыточно. [orm.drizzle](https://orm.drizzle.team/docs/column-types/sqlite)

**`PRAGMA foreign_keys`** — должен включаться на уровне соединения, не в схеме. [orm.drizzle](https://orm.drizzle.team/docs/get-started/sqlite-cloud-new)