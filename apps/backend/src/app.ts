import { basicAuth } from "@eelkevdbos/elysia-basic-auth";
import { staticPlugin } from "@elysiajs/static";
import { Elysia, type Context } from "elysia";
import { evlog } from "evlog/elysia";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
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

const frontendAssetContentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isWithinDirectory(rootPath: string, candidatePath: string) {
  const relativePath = relative(rootPath, candidatePath);

  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function tryServeFrontendFile(frontendDistPath: string, pathname: string) {
  if (!pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return undefined;
  }

  let assetPathname: string;

  try {
    assetPathname = decodeURIComponent(pathname.slice(`${APP_BASE_PATH}/`.length));
  } catch {
    return undefined;
  }

  const frontendRootPath = resolve(frontendDistPath);
  const candidatePath = resolve(frontendRootPath, assetPathname);

  if (!isWithinDirectory(frontendRootPath, candidatePath)) {
    return undefined;
  }

  if (!existsSync(candidatePath) || !statSync(candidatePath).isFile()) {
    return undefined;
  }

  const contentType =
    frontendAssetContentTypes[extname(candidatePath).toLowerCase()] ?? "application/octet-stream";

  if (typeof Bun !== "undefined") {
    return new Response(Bun.file(candidatePath), {
      headers: {
        "content-type": contentType,
      },
    });
  }

  return new Response(readFileSync(candidatePath), {
    headers: {
      "content-type": contentType,
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

  const staticFileResponse = tryServeFrontendFile(frontendDistPath, pathname);

  if (staticFileResponse) {
    return staticFileResponse;
  }

  if (pathname.startsWith(`${APP_BASE_PATH}/assets/`)) {
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
