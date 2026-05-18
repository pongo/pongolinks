import { basicAuth } from "@eelkevdbos/elysia-basic-auth";
import { staticPlugin } from "@elysiajs/static";
import { Elysia, type Context } from "elysia";
import { evlog } from "evlog/elysia";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";

import { config } from "./config";
import type { AppDb } from "./db/app-db";
import { createBookmarkRoutes } from "./features/bookmarks/routes";
import { createTagRoutes } from "./features/tags/routes";
import { healthRoutes } from "./features/health/routes";
import { createSearchRoutes } from "./features/search/routes";
import { createRequestLoggingOptions, createTracingPlugin } from "./observability";

export type CreateAppOptions = {
  db?: AppDb;
  frontendDistPath?: string;
  serveFrontend?: boolean;
};

export { APP_BASE_PATH };

function createApiRoutes(db: AppDb) {
  return new Elysia().group("/api", (api) =>
    api
      .use(healthRoutes)
      .use(createSearchRoutes({ db }))
      .use(createBookmarkRoutes({ db }))
      .use(createTagRoutes({ db })),
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

function readEnv(name: string) {
  return typeof Bun === "undefined" ? process.env[name] : Bun.env[name];
}

function createBasicAuthPlugin() {
  if (!readEnv("BASIC_AUTH_CREDENTIALS")?.trim()) {
    throw new Error("BASIC_AUTH_CREDENTIALS must be set");
  }

  return basicAuth({
    realm: "pongolinks",
    scope: `${APP_BASE_PATH}/`,
  });
}

function serveSpaFallback(
  frontendDistPath: string,
  { request, set }: Pick<Context, "request" | "set">,
) {
  const pathname = new URL(request.url).pathname;

  if (pathname.startsWith(`${APP_BASE_PATH}/api/`)) {
    set.status = 404;
    return { error: "Not Found" };
  }

  return serveIndexHtml(frontendDistPath);
}

export function createApp(options: CreateAppOptions = {}) {
  const frontendDistPath = options.frontendDistPath ?? config.frontendDistPath;
  const app = new Elysia()
    .use(createTracingPlugin())
    .use(createBasicAuthPlugin())
    .use(
      evlog({
        ...createRequestLoggingOptions(),
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
    .get(`${APP_BASE_PATH}/*`, (context: Pick<Context, "request" | "set">) =>
      serveSpaFallback(frontendDistPath, context),
    );
}

export type App = ReturnType<typeof createApp>;
export type ApiRoutes = ReturnType<typeof createApiRoutes>;
