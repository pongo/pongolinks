import { combine, Err } from "@pongolinks/shared/result";
import { Elysia } from "elysia";
import { z } from "zod";

import type { AppDb } from "#/db/app-db.ts";
import { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { privateApiRevalidationCache } from "#/http/cache.ts";
import { getRouteLogger, logApiError } from "#/http/route-logging.ts";
import { ApiError, resultResponse, type ApiErrorCode } from "#/http/result-response.ts";
import { BookmarkId } from "./domain/bookmark-id.ts";
import { BookmarkEditor } from "./repository/bookmark-editor.ts";
import { BookmarkReadRepository } from "./repository/bookmark-read-repository.ts";
import { parseTagNames } from "./domain/tag-name.ts";
import { normalizeBookmarkListPage } from "./pagination.ts";

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

function normalizeQueryTag(rawTag: string) {
  const trimmed = rawTag.trim();
  const isExcluded = trimmed.startsWith("-");
  const value = isExcluded ? trimmed.slice(1) : trimmed;
  const parsed = parseTagNames(value);
  if (parsed.isErr) {
    return parsed;
  }

  if (parsed.value.length !== 1) {
    return Err(
      new ApiError(
        "Tag filters must be non-empty names without whitespace",
        "bookmark.tags_invalid",
        400,
      ),
    );
  }
  const tag = parsed.value[0];
  if (!tag) {
    return Err(new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400));
  }

  if (tag.nameLower().startsWith("-")) {
    return Err(new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400));
  }

  return parsed;
}

export function createBookmarkRoutes({ db }: BookmarkRoutesOptions) {
  const bookmarkEditor = new BookmarkEditor(db);
  const bookmarkReads = new BookmarkReadRepository(db);

  return new Elysia({ name: "bookmark-routes" })
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        return bookmarkValidationErrorResponse(error, set);
      }
    })
    .post(
      "/bookmarks",
      async (context) => {
        const { body, set } = context;
        const log = getRouteLogger(context);

        const parseResults = combine([BookmarkUrl.from(body.url), parseTagNames(body.tagsText)]);
        if (parseResults.isErr) {
          logApiError(log, parseResults.error);
          return resultResponse(parseResults, set);
        }

        const [url, tags] = parseResults.value;
        log.set({
          bookmark: {
            url: url.value(),
            title: body.title,
            description: body.description,
            isPrivate: body.isPrivate,
            tags: tags.map((tag) => tag.name()),
          },
          tags: { count: tags.length },
        });

        const result = await bookmarkEditor.create({ ...body, url, tags }, log);
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

        const result = await bookmarkReads.findById(id.value);
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

        const result = await bookmarkEditor.update(id, { ...body, url, tags }, log);
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
    )
    .delete(
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

        const result = await bookmarkEditor.delete(id.value, log);
        if (result.isErr) {
          logApiError(log, result.error);
        }

        return resultResponse(result, set);
      },
      {
        params: bookmarkIdParamsSchema,
      },
    )
    .use(
      new Elysia({ name: "bookmark-cacheable-read-routes" }).use(privateApiRevalidationCache()).get(
        "/bookmarks",
        async (context) => {
          const { query, set } = context;
          const log = getRouteLogger(context);

          const page = normalizeBookmarkListPage(query.page);
          const qTokens =
            typeof query.q === "string"
              ? query.q
                  .trim()
                  .split(/\s+/u)
                  .filter((token) => token.length > 0)
              : [];
          const domain = typeof query.domain === "string" ? query.domain.trim() : "";
          const rawTags = Array.isArray(query.tag)
            ? query.tag
            : typeof query.tag === "string"
              ? [query.tag]
              : [];
          const urlValue = typeof query.url === "string" ? query.url : undefined;

          const hasUrlMode = typeof urlValue === "string" && urlValue.trim() !== "";
          const hasMixedMode =
            hasUrlMode && (qTokens.length > 0 || domain !== "" || rawTags.length > 0);
          if (hasMixedMode) {
            const mixedModeError = Err(
              new ApiError(
                "URL lookup mode cannot be combined with other filters",
                "bookmark.validation_invalid",
                400,
              ),
            );
            logApiError(log, mixedModeError.error);
            return resultResponse(mixedModeError, set);
          }

          const includeTagNamesLower = new Set<string>();
          const excludeTagNamesLower = new Set<string>();
          for (const rawTag of rawTags) {
            const parsedTag = normalizeQueryTag(rawTag);
            if (parsedTag.isErr) {
              logApiError(log, parsedTag.error);
              return resultResponse(parsedTag, set);
            }

            const trimmed = rawTag.trim();
            const tagNameLower = parsedTag.value[0]?.nameLower();
            if (!tagNameLower) {
              const invalidTag = Err(
                new ApiError("Tag filters are invalid", "bookmark.validation_invalid", 400),
              );
              logApiError(log, invalidTag.error);
              return resultResponse(invalidTag, set);
            }

            if (trimmed.startsWith("-")) {
              excludeTagNamesLower.add(tagNameLower);
            } else {
              includeTagNamesLower.add(tagNameLower);
            }
          }

          const contradictoryTag = [...includeTagNamesLower].find((tag) =>
            excludeTagNamesLower.has(tag),
          );
          if (contradictoryTag) {
            const contradictionError = Err(
              new ApiError(
                "Tag filters cannot include and exclude the same tag",
                "bookmark.validation_invalid",
                400,
              ),
            );
            logApiError(log, contradictionError.error);
            return resultResponse(contradictionError, set);
          }

          const url = hasUrlMode ? BookmarkUrl.from(urlValue) : null;
          if (url?.isErr) {
            logApiError(log, url.error);
            return resultResponse(url, set);
          }

          const result = await bookmarkReads.list(page, {
            qTokens,
            includeTagNamesLower: [...includeTagNamesLower].sort((a, b) => a.localeCompare(b)),
            excludeTagNamesLower: [...excludeTagNamesLower].sort((a, b) => a.localeCompare(b)),
            domain: domain === "" ? null : domain.toLocaleLowerCase("und"),
            url: url?.value ?? null,
          });
          if (result.isErr) {
            logApiError(log, result.error);
          } else {
            log.set({
              bookmarks: { count: result.value.bookmarks.length },
              pagination: result.value.pagination,
            });
          }

          return resultResponse(result, set);
        },
        {
          query: z.object({
            q: z.string().optional(),
            tag: z.union([z.string(), z.array(z.string())]).optional(),
            domain: z.string().optional(),
            url: z.string().optional(),
            page: z.string().optional(),
          }),
        },
      ),
    );
}
