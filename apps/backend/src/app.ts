import { Elysia } from "elysia";
import { evlog } from "evlog/elysia";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";

import { createSessionAuthPlugin } from "./http/session-auth";
import { config } from "./config";
import type { AppDb } from "./db/app-db";
import { createBookmarkRoutes } from "./features/bookmarks/routes";
import { createTagRoutes } from "./features/tags/routes";
import { healthRoutes } from "./features/health/routes";
import { createSearchRoutes } from "./features/search/routes";
import { createWaybackRoutes } from "./features/wayback/routes";
import { createFrontendStaticPlugin } from "./http/frontend-static";
import { createRequestLoggingOptions, createTracingPlugin } from "./observability";
import openapi, { fromTypes } from "@elysia/openapi";
import z from "zod";

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
      .use(createWaybackRoutes())
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

function readEnv(name: string) {
  return typeof Bun === "undefined" ? process.env[name] : Bun.env[name];
}

export function createApp(options: CreateAppOptions = {}) {
  const frontendDistPath = options.frontendDistPath ?? config.frontendDistPath;
  const app = new Elysia()
    .use(
      // http://localhost:3000/openapi
      openapi({
        enabled: readEnv("NODE_ENV") !== "production",
        references: fromTypes(),
        mapJsonSchema: {
          zod: z.toJSONSchema,
        },
      }),
    )
    .use(createTracingPlugin())
    .use(createSessionAuthPlugin({ db: options.db }))
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

  return app.use(createFrontendStaticPlugin(frontendDistPath));
}

export type App = ReturnType<typeof createApp>;
export type ApiRoutes = ReturnType<typeof createApiRoutes>;
