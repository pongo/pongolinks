import { Elysia, t } from "elysia";

import { resultResponse, type ApiError } from "../../http/result-response";
import { BookmarkId } from "./bookmark-id";
import { BookmarkUrl } from "./bookmark-url";
import {
  bookmarkValidationErrorResponse,
  validateEditableBookmarkInput,
} from "./bookmark-validation";
import { BookmarksRepository, type AppDb } from "./bookmarks-repository";
import { parseTagNames } from "./tag-name";

export type BookmarkRoutesOptions = {
  db: AppDb;
};

type WideEventLogger = {
  set: (context: Record<string, unknown>) => void;
};

const noopLogger: WideEventLogger = {
  set: () => {},
};

function getLogger(context: unknown): WideEventLogger {
  return typeof context === "object" && context !== null && "log" in context
    ? ((context as { log?: WideEventLogger }).log ?? noopLogger)
    : noopLogger;
}

function logError(log: WideEventLogger, error: ApiError) {
  log.set({
    error: {
      message: error.message,
      code: error.code,
      status: error.status,
      ...(error.data ? { data: error.data } : {}),
    },
  });
}

const editableBookmarkBodySchema = t.Object({
  url: t.String(),
  title: t.String(),
  description: t.Optional(t.String()),
  isPrivate: t.Optional(t.Boolean()),
  tagsText: t.Optional(t.String()),
});

const bookmarkIdParamsSchema = t.Object({
  id: t.Numeric({ minimum: 1, error: "bookmark.id_invalid" }),
});

export function createBookmarkRoutes({ db }: BookmarkRoutesOptions) {
  const repository = new BookmarksRepository(db);

  return new Elysia({ name: "bookmark-routes" })
    .onError(({ body, code, error, set }) => {
      if (code === "VALIDATION") {
        return bookmarkValidationErrorResponse(error, set, body);
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

        const inputResult = validateEditableBookmarkInput(body);
        if (inputResult.isErr) {
          logError(log, inputResult.error);
          return resultResponse(inputResult, set);
        }
        const input = inputResult.value;
        log.set({
          bookmark: {
            title: input.title,
            description: input.description,
            isPrivate: input.isPrivate,
          },
        });

        const urlResult = BookmarkUrl.from(input.url);
        if (urlResult.isErr) {
          logError(log, urlResult.error);
          return resultResponse(urlResult, set);
        }
        const url = urlResult.value;
        log.set({ bookmark: { url: url.value() } });

        const tagsResult = parseTagNames(input.tagsText);
        if (tagsResult.isErr) {
          logError(log, tagsResult.error);
          return resultResponse(tagsResult, set);
        }
        const tags = tagsResult.value;
        log.set({
          bookmark: {
            tags: tags.map((tag) => tag.name()),
          },
          tags: { count: tags.length },
        });

        const result = await repository.create({ ...input, url, tags }, log);
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

        log.set({ bookmark: { id: id.value.value() } });

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
        log.set({ bookmark: { id: id.value.value() } });

        const input = validateEditableBookmarkInput(body);
        if (input.isErr) {
          logError(log, input.error);
          return resultResponse(input, set);
        }
        log.set({
          bookmark: {
            title: input.value.title,
            description: input.value.description,
            isPrivate: input.value.isPrivate,
          },
        });

        const tagsResult = parseTagNames(input.value.tagsText);
        if (tagsResult.isErr) {
          logError(log, tagsResult.error);
          return resultResponse(tagsResult, set);
        }
        const tags = tagsResult.value;

        const url = BookmarkUrl.from(input.value.url);
        if (url.isErr) {
          logError(log, url.error);
          return resultResponse(url, set);
        }
        log.set({ bookmark: { url: url.value.value() } });

        const result = await repository.update(
          id.value,
          {
            ...input.value,
            url: url.value,
            tags,
          },
          log,
        );
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
}
