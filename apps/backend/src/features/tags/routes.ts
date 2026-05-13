import { Elysia } from "elysia";

import { resultResponse, type ApiError } from "../../http/result-response";
import type { AppDb } from "../bookmarks/bookmarks-repository";
import { TagsRepository } from "./tags-repository";

export type TagRoutesOptions = {
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

export function createTagRoutes({ db }: TagRoutesOptions) {
  const repository = new TagsRepository(db);

  return new Elysia({ name: "tag-routes" }).get("/tags", async (context) => {
    const { set } = context;
    const log = getLogger(context);

    const result = await repository.list();
    if (result.isErr) {
      logError(log, result.error);
    } else {
      log.set({ tags: { count: result.value.tags.length } });
    }

    return resultResponse(result, set);
  });
}
