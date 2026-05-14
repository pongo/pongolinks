import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { evlog } from "evlog/elysia";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "./config";
import type { AppDb } from "./db/app-db";
import { createBookmarkRoutes } from "./features/bookmarks/routes";
import { createTagRoutes } from "./features/tags/routes";
import { healthRoutes } from "./features/health/routes";

export type CreateAppOptions = {
  db?: AppDb;
  frontendDistPath?: string;
  serveFrontend?: boolean;
};

export const APP_BASE_PATH = "/pongolinks";

function createApiRoutes(db: AppDb) {
  return new Elysia().group("/api", (api) =>
    api.use(healthRoutes).use(createBookmarkRoutes({ db })).use(createTagRoutes({ db })),
  );
}

function createHealthOnlyApiRoutes() {
  return new Elysia().group("/api", (api) => api.use(healthRoutes));
}

function shouldServeFrontend(options: CreateAppOptions) {
  return (
    options.serveFrontend ??
    (typeof Bun === "undefined"
      ? process.env.NODE_ENV === "production"
      : Bun.env.NODE_ENV === "production")
  );
}

function serveIndexHtml(frontendDistPath: string) {
  const indexPath = join(frontendDistPath, "index.html");

  if (typeof Bun !== "undefined") {
    return Bun.file(indexPath);
  }

  return new Response(readFileSync(indexPath), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export function createApp(options: CreateAppOptions = {}) {
  const frontendDistPath = options.frontendDistPath ?? config.frontendDistPath;
  const app = new Elysia()
    .use(
      evlog({
        include: [`${APP_BASE_PATH}/api/**`],
        exclude: [`${APP_BASE_PATH}/api/health`],
      }),
    )
    .group(APP_BASE_PATH, (base) =>
      base.use(options.db ? createApiRoutes(options.db) : createHealthOnlyApiRoutes()),
    );

  if (!shouldServeFrontend(options)) {
    return app;
  }

  return app
    .use(
      staticPlugin({
        assets: frontendDistPath,
        prefix: APP_BASE_PATH,
      }),
    )
    .get(APP_BASE_PATH, () => serveIndexHtml(frontendDistPath))
    .get(`${APP_BASE_PATH}/*`, ({ request, set }) => {
      const pathname = new URL(request.url).pathname;

      if (pathname.startsWith(`${APP_BASE_PATH}/api/`)) {
        set.status = 404;
        return { error: "Not Found" };
      }

      return serveIndexHtml(frontendDistPath);
    });
}

export type App = ReturnType<typeof createApp>;
export type ApiRoutes = ReturnType<typeof createApiRoutes>;
