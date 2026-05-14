import { Elysia } from "elysia";

import { getRouteLogger, logApiError } from "../../http/route-logging.ts";
import { resultResponse } from "../../http/result-response";
import type { AppDb } from "../bookmarks/bookmarks-repository";
import { TagsRepository } from "./tags-repository";

export type TagRoutesOptions = {
  db: AppDb;
};

export function createTagRoutes({ db }: TagRoutesOptions) {
  const repository = new TagsRepository(db);

  return new Elysia({ name: "tag-routes" }).get("/tags", async (context) => {
    const { set } = context;
    const log = getRouteLogger(context);

    const result = await repository.list();
    if (result.isErr) {
      logApiError(log, result.error);
    } else {
      log.set({ tags: { count: result.value.tags.length } });
    }

    return resultResponse(result, set);
  });
}
