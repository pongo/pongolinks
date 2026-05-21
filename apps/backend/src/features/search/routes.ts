import { Elysia } from "elysia";
import { z } from "zod";

import type { AppDb } from "#/db/app-db.ts";
import { parseBookmarkUrl } from "#/http/bookmark-url-api-error.ts";
import { getRouteLogger, logApiError } from "#/http/route-logging.ts";
import { resultResponse } from "#/http/result-response.ts";
import { SearchRepository } from "./search-repository.ts";

export type SearchRoutesOptions = {
  db: AppDb;
};

export function createSearchRoutes({ db }: SearchRoutesOptions) {
  const repository = new SearchRepository(db);

  return new Elysia({ name: "search-routes" }).get(
    "/search/check",
    async (context) => {
      const { query, set } = context;
      const log = getRouteLogger(context);

      const urlResult = parseBookmarkUrl(query.url);
      if (urlResult.isErr) {
        logApiError(log, urlResult.error);
        return resultResponse(urlResult, set);
      }
      const url = urlResult.value;
      log.set({ search: { url: url.value() } });

      const result = await repository.checkBookmarkUrl(url);
      if (result.isErr) {
        logApiError(log, result.error);
      } else {
        log.set({ search: { status: result.value.status } });
      }

      return resultResponse(result, set);
    },
    {
      query: z.object({
        url: z.string().optional(),
      }),
    },
  );
}
