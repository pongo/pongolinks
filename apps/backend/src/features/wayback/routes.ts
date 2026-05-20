import { Elysia } from "elysia";
import { z } from "zod";

import { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { getRouteLogger, logApiError } from "#/http/route-logging.ts";
import { resultResponse } from "#/http/result-response.ts";
import { WaybackAvailabilityService } from "./wayback-availability.ts";

export function createWaybackRoutes() {
  const waybackAvailability = new WaybackAvailabilityService();

  return new Elysia({ name: "wayback-routes" }).get(
    "/wayback/availability",
    async (context) => {
      const { query, set } = context;
      const log = getRouteLogger(context);

      const urlResult = BookmarkUrl.from(query.url);
      if (urlResult.isErr) {
        logApiError(log, urlResult.error);
        return resultResponse(urlResult, set);
      }

      const result = await waybackAvailability.getAvailability(urlResult.value);
      if (result.isErr) {
        logApiError(log, result.error);
      }

      return resultResponse(result, set);
    },
    {
      query: z.object({
        url: z.string({ error: "bookmark.url_required" }),
      }),
    },
  );
}
