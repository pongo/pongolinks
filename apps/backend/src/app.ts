import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { config } from "./config";
import { healthRoutes } from "./features/health/routes";

export type CreateAppOptions = {
  frontendDistPath?: string;
  serveFrontend?: boolean;
};

const shouldServeFrontend = (options: CreateAppOptions) =>
  options.serveFrontend ??
  (typeof Bun === "undefined"
    ? process.env.NODE_ENV === "production"
    : Bun.env.NODE_ENV === "production");

const serveIndexHtml = (frontendDistPath: string) => {
  const indexPath = join(frontendDistPath, "index.html");

  if (typeof Bun !== "undefined") {
    return Bun.file(indexPath);
  }

  return new Response(readFileSync(indexPath), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
};

export const createApp = (options: CreateAppOptions = {}) => {
  const frontendDistPath = options.frontendDistPath ?? config.frontendDistPath;
  const app = new Elysia().group("/api", (api) => api.use(healthRoutes));

  if (!shouldServeFrontend(options)) {
    return app;
  }

  return app
    .use(
      staticPlugin({
        assets: frontendDistPath,
        prefix: "/",
      }),
    )
    .get("*", ({ request, set }) => {
      const pathname = new URL(request.url).pathname;

      if (pathname.startsWith("/api/")) {
        set.status = 404;
        return { error: "Not Found" };
      }

      return serveIndexHtml(frontendDistPath);
    });
};

export const app = createApp();

export type App = typeof app;
