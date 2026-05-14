# Strengthen Bookmark route schemas

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Make Bookmark `POST` and `PATCH` body validation use Elysia `t` for the transport request shape.

## Scope

- Update `apps/backend/src/features/bookmarks/routes.ts`.
- Strengthen the editable Bookmark body schema:
  - `url: t.String()`;
  - `title: t.String()`;
  - `description: t.Optional(t.String())`;
  - `isPrivate: t.Optional(t.Boolean())`;
  - `tagsText: t.Optional(t.String())`.
- Keep the Bookmark id params schema using Elysia `t`.
- Keep `BookmarkUrl.from(...)`, `BookmarkId.from(...)`, and `parseTagNames(...)` in the route handlers.
- Do not move schemas into a new file.

## Out Of Scope

- Adding Zod.
- Adding Elysia response schemas.
- Changing API paths or response DTOs.
- Changing frontend code.
- Changing Value Object rules.
- Changing repository, database, Tag sync, or Related Link behavior.

## Tests

- Run `bun run typecheck`.
- Run `bun run agent:test`.
- Run `bun run format`.

Do not start a dev server.
