Коротко: для `v1.0.0-beta.17` рабочий поток такой же, как в актуальной beta-линейке Drizzle Kit — сначала `drizzle-kit generate`, потом `drizzle-kit migrate`. [orm.drizzle](https://orm.drizzle.team)
`generate` строит SQL-миграции из твоей Drizzle schema, а `migrate` применяет только новые `.sql`-файлы и фиксирует их в таблице `__drizzle_migrations`. [github](https://github.com/drizzle-team/drizzle-orm/releases)

## Config

Для `generate` Drizzle Kit требует как минимум `dialect` и путь к `schema`, и это можно задать либо в `drizzle.config.ts`, либо через CLI-параметры. [github](https://github.com/drizzle-team/drizzle-orm/releases)
Для `migrate` нужен тот же `dialect` плюс credentials подключения к базе, и их тоже можно передать через `drizzle.config.ts` или через CLI. [orm.drizzle](https://orm.drizzle.team)

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./sqlite.db",
  },
});
```

## Commands

Базовая последовательность такая: сначала `npx drizzle-kit generate --name init`, потом `npx drizzle-kit migrate`. [orm.drizzle](https://orm.drizzle.team)
`generate` читает schema-файлы, сравнивает текущий snapshot с последним сохранённым snapshot и создаёт SQL-миграцию вместе со `snapshot.json` в папке миграций. [github](https://github.com/drizzle-team/drizzle-orm/releases)
`migrate` затем читает `.sql`-миграции из папки, сверяется с логом применённых миграций в базе и выполняет только те, которые ещё не запускались. [orm.drizzle](https://orm.drizzle.team)

```bash
npx drizzle-kit generate --name init
npx drizzle-kit migrate
```

## Custom SQL

Если тебе нужна пустая миграция под FTS5, триггеры или другой raw SQL, используй custom migration через `generate` с опцией `custom`. [github](https://github.com/drizzle-team/drizzle-orm/releases)
Для понятных имён файлов можно добавлять `--name`, например `npx drizzle-kit generate --custom --name bookmarks-fts`. [github](https://github.com/drizzle-team/drizzle-orm/releases)

```bash
npx drizzle-kit generate --custom --name bookmarks-fts
```

## Beta notes

В beta-линейке Drizzle Kit были изменения в системе миграций: команда `check` используется для проверки конфликтов и коммутативности миграций, а `--ignore-conflicts` задуман только как обходной путь на случай проблем в самом Kit. [orm.drizzle](https://orm.drizzle.team/docs/kit-overview)
В beta-релизах команда миграций уже меняла структуру и учёт миграций, включая versioning таблицы миграций, сопоставление по имени папки и автоматический upgrade, поэтому перед первым прогоном на существующей базе лучше сделать backup. [github](https://github.com/drizzle-team/drizzle-orm/issues/3578)
На главной странице Drizzle отдельно отмечен релиз `v1.0.0-beta.17` и дополнительные проверки для upgrade таблицы миграций, так что для старого beta-состояния это особенно актуально. [orm.drizzle](https://orm.drizzle.team)

## Practical flow

Если у тебя code-first проект, самый безопасный цикл такой: меняешь `schema.ts`, запускаешь `generate`, проверяешь SQL-файл, затем запускаешь `migrate`. [orm.drizzle](https://orm.drizzle.team)
Для SQLite-специфичных вещей вроде FTS5 и триггеров удобно держать обычные таблицы в schema, а виртуальные таблицы и триггеры — в custom SQL migration. [github](https://github.com/drizzle-team/drizzle-orm/releases)

Пример `package.json`-скриптов:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate --config drizzle.config.ts",
    "db:migrate": "drizzle-kit migrate --config drizzle.config.ts",
    "db:check": "drizzle-kit check --config drizzle.config.ts"
  }
}
```

Хочешь, я сразу дам готовый `drizzle.config.ts` и набор `npm scripts` именно под твой SQLite-проект с `bookmarks`, `FTS5` и custom migration для триггеров?