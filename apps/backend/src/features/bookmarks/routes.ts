import { Elysia } from "elysia";

import { resultResponse } from "../../http/result-response";
import { BookmarkId } from "./bookmark-id";
import { BookmarkUrl } from "./bookmark-url";
import { validateEditableBookmarkInput } from "./bookmark-validation";
import { BookmarksRepository, type AppDb } from "./bookmarks-repository";

export type BookmarkRoutesOptions = {
  db: AppDb;
};

type WideEventLogger = {
  set: (context: Record<string, unknown>) => void;
};

const noopLogger: WideEventLogger = {
  set: () => {},
};

const getLogger = (context: unknown): WideEventLogger =>
  typeof context === "object" && context !== null && "log" in context
    ? ((context as { log?: WideEventLogger }).log ?? noopLogger)
    : noopLogger;

export const createBookmarkRoutes = ({ db }: BookmarkRoutesOptions) => {
  const repository = new BookmarksRepository(db);

  return new Elysia({ name: "bookmark-routes" })
    .get("/bookmarks", async (context) => {
      const { set } = context;
      const log = getLogger(context);
      log.set({ bookmark: { operation: "list" } });

      const result = await repository.list();
      log.set({
        bookmark: {
          operation: "list",
          outcome: result.isOk ? "success" : "error",
          count: result.isOk ? result.value.bookmarks.length : undefined,
        },
      });

      return resultResponse(result, set);
    })
    .post("/bookmarks", async (context) => {
      const { body, set } = context;
      const log = getLogger(context);
      log.set({ bookmark: { operation: "create" } });

      const input = validateEditableBookmarkInput(body);
      if (input.isErr) {
        log.set({
          bookmark: { operation: "create", validation: "invalid", code: input.error.code },
        });
        return resultResponse(input, set);
      }

      const url = BookmarkUrl.from(input.value.url);
      if (url.isErr) {
        log.set({ bookmark: { operation: "create", validation: "invalid", code: url.error.code } });
        return resultResponse(url, set);
      }

      log.set({
        bookmark: {
          operation: "create",
          validation: "valid",
          url: url.value.value(),
        },
      });

      const result = await repository.create({ ...input.value, url: url.value });
      log.set({
        bookmark: {
          operation: "create",
          outcome: result.isOk ? "created" : "error",
          duplicate: result.isErr && result.error.code === "bookmark.url_duplicate",
          id: result.isOk ? result.value.id : undefined,
        },
      });

      return resultResponse(result, set);
    })
    .get("/bookmarks/:id", async (context) => {
      const { params, set } = context;
      const log = getLogger(context);
      log.set({ bookmark: { operation: "get" } });

      const id = BookmarkId.from(params.id);
      if (id.isErr) {
        log.set({ bookmark: { operation: "get", validation: "invalid", code: id.error.code } });
        return resultResponse(id, set);
      }

      log.set({ bookmark: { operation: "get", id: id.value.value(), validation: "valid" } });

      const result = await repository.findById(id.value);
      log.set({
        bookmark: {
          operation: "get",
          id: id.value.value(),
          outcome: result.isOk ? "found" : "error",
          notFound: result.isErr && result.error.code === "bookmark.not_found",
        },
      });

      return resultResponse(result, set);
    })
    .patch("/bookmarks/:id", async (context) => {
      const { body, params, set } = context;
      const log = getLogger(context);
      log.set({ bookmark: { operation: "update" } });

      const id = BookmarkId.from(params.id);
      if (id.isErr) {
        log.set({ bookmark: { operation: "update", validation: "invalid", code: id.error.code } });
        return resultResponse(id, set);
      }

      const input = validateEditableBookmarkInput(body);
      if (input.isErr) {
        log.set({
          bookmark: {
            operation: "update",
            id: id.value.value(),
            validation: "invalid",
            code: input.error.code,
          },
        });
        return resultResponse(input, set);
      }

      const url = BookmarkUrl.from(input.value.url);
      if (url.isErr) {
        log.set({
          bookmark: {
            operation: "update",
            id: id.value.value(),
            validation: "invalid",
            code: url.error.code,
          },
        });
        return resultResponse(url, set);
      }

      log.set({
        bookmark: {
          operation: "update",
          id: id.value.value(),
          validation: "valid",
          url: url.value.value(),
        },
      });

      const result = await repository.update(id.value, { ...input.value, url: url.value });
      log.set({
        bookmark: {
          operation: "update",
          id: id.value.value(),
          outcome: result.isOk ? "updated" : "error",
          duplicate: result.isErr && result.error.code === "bookmark.url_duplicate",
          notFound: result.isErr && result.error.code === "bookmark.not_found",
          updatedId: result.isOk ? result.value.id : undefined,
        },
      });

      return resultResponse(result, set);
    });
};
