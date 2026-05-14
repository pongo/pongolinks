import { combine, Err } from "@pongolinks/shared/result";
import { Elysia } from "elysia";
import { z } from "zod";

import { getRouteLogger, logApiError } from "../../http/route-logging.ts";
import { ApiError, resultResponse, type ApiErrorCode } from "../../http/result-response.ts";
import type { AppDb } from "../../db/app-db.ts";
import { BookmarkId } from "./domain/bookmark-id.ts";
import { BookmarkUrl } from "./domain/bookmark-url.ts";
import { BookmarksRepository } from "./bookmarks-repository";
import { parseTagNames } from "./domain/tag-name.ts";

export type BookmarkRoutesOptions = {
  db: AppDb;
};

const editableBookmarkBodySchema = z.strictObject(
  {
    url: z.string({ error: "bookmark.url_required" }),
    title: z.string({ error: "bookmark.title_required" }).trim().min(1, {
      error: "bookmark.title_required",
    }),
    description: z.string({ error: "bookmark.validation_invalid" }).trim().optional().default(""),
    isPrivate: z.boolean({ error: "bookmark.validation_invalid" }).optional().default(false),
    tagsText: z.string({ error: "bookmark.validation_invalid" }).optional().default(""),
  },
  {
    error: "bookmark.validation_invalid",
  },
);

const bookmarkIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "bookmark.id_invalid" })
    .int({
      error: "bookmark.id_invalid",
    })
    .min(1, { error: "bookmark.id_invalid" }),
});

const validationErrorMessages = {
  "bookmark.id_invalid": "Bookmark id must be a positive safe integer",
  "bookmark.title_required": "Bookmark title is required",
  "bookmark.url_required": "Bookmark URL is required",
  "bookmark.validation_invalid": "Bookmark request is invalid",
} as const satisfies Partial<Record<ApiErrorCode, string>>;

type ValidationApiErrorCode = keyof typeof validationErrorMessages;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readValidationCode(error: unknown): ValidationApiErrorCode {
  if (!(error instanceof Error)) {
    return "bookmark.validation_invalid";
  }

  if (error.message in validationErrorMessages) {
    return error.message as ValidationApiErrorCode;
  }

  try {
    const payload = JSON.parse(error.message);
    const message = isRecord(payload) ? payload.message : undefined;

    return typeof message === "string" && message in validationErrorMessages
      ? (message as ValidationApiErrorCode)
      : "bookmark.validation_invalid";
  } catch {
    return "bookmark.validation_invalid";
  }
}

function bookmarkValidationApiError(error: unknown): ApiError {
  const code = readValidationCode(error);
  const message = validationErrorMessages[code];

  return new ApiError(message, code, 400);
}

function bookmarkValidationErrorResponse(error: unknown, set: { status?: number | string }) {
  const apiError = bookmarkValidationApiError(error);

  set.status = apiError.status;
  return Err(apiError);
}

export function createBookmarkRoutes({ db }: BookmarkRoutesOptions) {
  const repository = new BookmarksRepository(db);

  return new Elysia({ name: "bookmark-routes" })
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        return bookmarkValidationErrorResponse(error, set);
      }
    })
    .get("/bookmarks", async (context) => {
      const { set } = context;
      const log = getRouteLogger(context);

      const result = await repository.list();
      if (result.isErr) {
        logApiError(log, result.error);
      } else {
        log.set({ bookmarks: { count: result.value.bookmarks.length } });
      }

      return resultResponse(result, set);
    })
    .post(
      "/bookmarks",
      async (context) => {
        const { body, set } = context;
        const log = getRouteLogger(context);
        log.set({
          bookmark: {
            title: body.title,
            description: body.description,
            isPrivate: body.isPrivate,
          },
        });

        const parseResults = combine([BookmarkUrl.from(body.url), parseTagNames(body.tagsText)]);
        if (parseResults.isErr) {
          logApiError(log, parseResults.error);
          return resultResponse(parseResults, set);
        }

        const [url, tags] = parseResults.value;
        log.set({
          bookmark: {
            url: url.value(),
            tags: tags.map((tag) => tag.name()),
          },
          tags: { count: tags.length },
        });

        const result = await repository.create({ ...body, url, tags }, log);
        if (result.isErr) {
          logApiError(log, result.error);
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
        const log = getRouteLogger(context);

        const id = BookmarkId.from(params.id);
        if (id.isErr) {
          logApiError(log, id.error);
          return resultResponse(id, set);
        }

        log.set({ bookmark: { id: id.value.value() } });

        const result = await repository.findById(id.value);
        if (result.isErr) {
          logApiError(log, result.error);
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
        const log = getRouteLogger(context);

        const parseResults = combine([
          BookmarkId.from(params.id),
          BookmarkUrl.from(body.url),
          parseTagNames(body.tagsText),
        ]);
        if (parseResults.isErr) {
          logApiError(log, parseResults.error);
          return resultResponse(parseResults, set);
        }

        const [id, url, tags] = parseResults.value;
        log.set({
          bookmark: {
            id: id.value(),
            title: body.title,
            description: body.description,
            isPrivate: body.isPrivate,
            url: url.value(),
            tags: tags.map((tag) => tag.name()),
          },
          tags: { count: tags.length },
        });

        const result = await repository.update(id, { ...body, url, tags }, log);
        if (result.isErr) {
          logApiError(log, result.error);
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
