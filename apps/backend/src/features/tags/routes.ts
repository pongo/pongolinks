import { Err, Ok, type Result } from "@pongolinks/shared/result";
import { Elysia } from "elysia";
import { z } from "zod";

import type { AppDb } from "#/db/app-db.ts";
import { privateApiRevalidationCache } from "#/http/cache.ts";
import { getRouteLogger, logApiError } from "#/http/route-logging.ts";
import { ApiError, resultResponse, type ApiErrorCode } from "#/http/result-response.ts";
import { TagsRepository } from "./tags-repository";

export type TagRoutesOptions = {
  db: AppDb;
};

const tagIdParamsSchema = z.object({
  id: z.coerce
    .number({ error: "tag.not_found" })
    .int({ error: "tag.not_found" })
    .min(1, { error: "tag.not_found" }),
});

const updateTagBodySchema = z.strictObject(
  {
    name: z.string({ error: "tag.name_invalid" }),
  },
  {
    error: "tag.name_invalid",
  },
);

const validationErrorMessages = {
  "tag.name_invalid": "Tag name must be a non-empty token without whitespace",
  "tag.not_found": "Tag id must be a positive integer",
} as const satisfies Partial<Record<ApiErrorCode, string>>;

type ValidationApiErrorCode = keyof typeof validationErrorMessages;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readValidationCode(error: unknown): ValidationApiErrorCode {
  if (!(error instanceof Error)) {
    return "tag.name_invalid";
  }

  if (error.message in validationErrorMessages) {
    return error.message as ValidationApiErrorCode;
  }

  try {
    const payload = JSON.parse(error.message);
    const message = isRecord(payload) ? payload.message : undefined;

    return typeof message === "string" && message in validationErrorMessages
      ? (message as ValidationApiErrorCode)
      : "tag.name_invalid";
  } catch {
    return "tag.name_invalid";
  }
}

function tagValidationApiError(error: unknown): ApiError {
  const code = readValidationCode(error);
  const message = validationErrorMessages[code];

  return new ApiError(message, code, 400);
}

function tagValidationErrorResponse(error: unknown, set: { status?: number | string }) {
  const apiError = tagValidationApiError(error);

  set.status = apiError.status;
  return Err(apiError);
}

function parseTagName(name: string): Result<{ trimmed: string; lowered: string }, ApiError> {
  const trimmed = name.trim();
  if (trimmed === "" || /\s/u.test(trimmed)) {
    return Err(
      new ApiError(
        "Tag name must be a non-empty token without whitespace",
        "tag.name_invalid",
        400,
      ),
    );
  }

  return Ok({ trimmed, lowered: trimmed.toLocaleLowerCase("und") });
}

export function createTagRoutes({ db }: TagRoutesOptions) {
  const repository = new TagsRepository(db);

  return new Elysia({ name: "tag-routes" })
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        return tagValidationErrorResponse(error, set);
      }
    })
    .get("/tags/untagged-bookmarks", async (context) => {
      const { set } = context;
      const log = getRouteLogger(context);

      const result = await repository.listUntaggedBookmarks();
      if (result.isErr) {
        logApiError(log, result.error);
      } else {
        log.set({
          bookmarks: { count: result.value.bookmarks.length },
          untagged: { totalCount: result.value.totalCount },
        });
      }

      return resultResponse(result, set);
    })
    .patch(
      "/tags/:id",
      async (context) => {
        const { body, params, set } = context;
        const log = getRouteLogger(context);
        const parsed = parseTagName(body.name);
        if (parsed.isErr) {
          logApiError(log, parsed.error);
          return resultResponse(parsed, set);
        }

        log.set({
          tag: { id: params.id, name: parsed.value.trimmed, nameLower: parsed.value.lowered },
        });

        const result = await repository.update(
          params.id,
          parsed.value.trimmed,
          parsed.value.lowered,
        );
        if (result.isErr) {
          logApiError(log, result.error);
        } else {
          log.set({
            tag: {
              updatedId: result.value.id,
              name: result.value.name,
              nameLower: result.value.nameLower,
            },
          });
        }

        return resultResponse(result, set);
      },
      {
        params: tagIdParamsSchema,
        body: updateTagBodySchema,
      },
    )
    .delete(
      "/tags/:id",
      async (context) => {
        const { params, set } = context;
        const log = getRouteLogger(context);

        log.set({ tag: { id: params.id } });

        const result = await repository.delete(params.id);
        if (result.isErr) {
          logApiError(log, result.error);
        } else {
          log.set({ tag: { deletedId: result.value.deletedTagId } });
        }

        return resultResponse(result, set);
      },
      {
        params: tagIdParamsSchema,
      },
    )
    .use(
      new Elysia({ name: "tag-cacheable-read-routes" })
        .use(privateApiRevalidationCache())
        .get("/tags", async (context) => {
          const { set } = context;
          const log = getRouteLogger(context);

          const result = await repository.list();
          if (result.isErr) {
            logApiError(log, result.error);
          } else {
            log.set({ tags: { count: result.value.tags.length } });
          }

          return resultResponse(result, set);
        }),
    );
}
