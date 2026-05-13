import { Elysia, t } from "elysia";

import { resultResponse, type ApiError } from "../../http/result-response";
import { BookmarkId } from "./bookmark-id";
import { BookmarkUrl } from "./bookmark-url";
import {
  bookmarkValidationErrorResponse,
  validateEditableBookmarkInput,
} from "./bookmark-validation";
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

const logError = (log: WideEventLogger, error: ApiError) => {
  log.set({
    error: {
      message: error.message,
      code: error.code,
      status: error.status,
      ...(error.data ? { data: error.data } : {}),
    },
  });
};

const editableBookmarkBodySchema = t.Object({
  url: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  isPrivate: t.Optional(t.Boolean()),
});

const bookmarkIdParamsSchema = t.Object({
  id: t.Numeric({ minimum: 1 }),
});

export const createBookmarkRoutes = ({ db }: BookmarkRoutesOptions) => {
  const repository = new BookmarksRepository(db);

  return new Elysia({ name: "bookmark-routes" })
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        return bookmarkValidationErrorResponse(error, set);
      }
    })
    .get("/bookmarks", async (context) => {
      const { set } = context;
      const log = getLogger(context);

      const result = await repository.list();
      if (result.isErr) {
        logError(log, result.error);
      } else {
        log.set({ bookmarks: { count: result.value.bookmarks.length } });
      }

      return resultResponse(result, set);
    })
    .post(
      "/bookmarks",
      async (context) => {
        const { body, set } = context;
        const log = getLogger(context);

        const input = validateEditableBookmarkInput(body);
        if (input.isErr) {
          logError(log, input.error);
          return resultResponse(input, set);
        }

        const url = BookmarkUrl.from(input.value.url);
        if (url.isErr) {
          logError(log, url.error);
          return resultResponse(url, set);
        }

        log.set({
          bookmark: {
            validation: "valid",
            url: url.value.value(),
          },
        });

        const result = await repository.create({ ...input.value, url: url.value });
        if (result.isErr) {
          logError(log, result.error);
        } else {
          log.set({ bookmark: { id: result.value.id } });
        }

        return resultResponse(result, set);
      },
      {
        body: editableBookmarkBodySchema,
      },
    )
    .get(
      "/bookmarks/:id",
      async (context) => {
        const { params, set } = context;
        const log = getLogger(context);

        const id = BookmarkId.from(params.id);
        if (id.isErr) {
          logError(log, id.error);
          return resultResponse(id, set);
        }

        log.set({ bookmark: { id: id.value.value(), validation: "valid" } });

        const result = await repository.findById(id.value);
        if (result.isErr) {
          logError(log, result.error);
        }

        return resultResponse(result, set);
      },
      {
        params: bookmarkIdParamsSchema,
      },
    )
    .patch(
      "/bookmarks/:id",
      async (context) => {
        const { body, params, set } = context;
        const log = getLogger(context);

        const id = BookmarkId.from(params.id);
        if (id.isErr) {
          logError(log, id.error);
          return resultResponse(id, set);
        }

        const input = validateEditableBookmarkInput(body);
        if (input.isErr) {
          log.set({ bookmark: { id: id.value.value() } });
          logError(log, input.error);
          return resultResponse(input, set);
        }

        const url = BookmarkUrl.from(input.value.url);
        if (url.isErr) {
          log.set({ bookmark: { id: id.value.value() } });
          logError(log, url.error);
          return resultResponse(url, set);
        }

        log.set({
          bookmark: {
            id: id.value.value(),
            validation: "valid",
            url: url.value.value(),
          },
        });

        const result = await repository.update(id.value, { ...input.value, url: url.value });
        if (result.isErr) {
          logError(log, result.error);
        } else {
          log.set({ bookmark: { updatedId: result.value.id } });
        }

        return resultResponse(result, set);
      },
      {
        body: editableBookmarkBodySchema,
        params: bookmarkIdParamsSchema,
      },
    );
};
