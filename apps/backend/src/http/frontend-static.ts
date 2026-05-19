import { Elysia, type Context } from "elysia";
import { existsSync, readFileSync, statSync, type Stats } from "node:fs";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";

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

const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";
const REVALIDATED_STATIC_CACHE_CONTROL = "public, no-cache";
const HTML_CACHE_CONTROL = "no-cache";

function toHttpDate(date: Date) {
  return date.toUTCString();
}

function getComparableHttpTime(date: Date) {
  return Math.floor(date.getTime() / 1000) * 1000;
}

function isFreshByLastModified(request: Request, fileStats: Stats) {
  const ifModifiedSince = request.headers.get("if-modified-since");

  if (!ifModifiedSince) {
    return false;
  }

  const ifModifiedSinceTime = Date.parse(ifModifiedSince);

  if (Number.isNaN(ifModifiedSinceTime)) {
    return false;
  }

  return ifModifiedSinceTime >= getComparableHttpTime(fileStats.mtime);
}

function buildStaticHeaders(contentType: string, cacheControl: string, fileStats: Stats) {
  return {
    "cache-control": cacheControl,
    "content-type": contentType,
    "last-modified": toHttpDate(fileStats.mtime),
  };
}

function serveFileResponse(
  request: Request,
  filePath: string,
  fileStats: Stats,
  contentType: string,
  cacheControl: string,
) {
  const headers = buildStaticHeaders(contentType, cacheControl, fileStats);

  if (isFreshByLastModified(request, fileStats)) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  if (typeof Bun !== "undefined") {
    return new Response(Bun.file(filePath), { headers });
  }

  return new Response(readFileSync(filePath), { headers });
}

function serveIndexHtml(frontendDistPath: string, request: Request) {
  const indexPath = join(frontendDistPath, "index.html");
  const indexStats = statSync(indexPath);

  return serveFileResponse(
    request,
    indexPath,
    indexStats,
    "text/html; charset=utf-8",
    HTML_CACHE_CONTROL,
  );
}

function isWithinDirectory(rootPath: string, candidatePath: string) {
  const relativePath = relative(rootPath, candidatePath);

  return relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath);
}

function getCacheControlForFrontendFile(pathname: string) {
  if (pathname.startsWith(`${APP_BASE_PATH}/assets/`)) {
    return IMMUTABLE_ASSET_CACHE_CONTROL;
  }

  return REVALIDATED_STATIC_CACHE_CONTROL;
}

function tryServeFrontendFile(frontendDistPath: string, request: Request, pathname: string) {
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

  if (!existsSync(candidatePath)) {
    return undefined;
  }

  const fileStats = statSync(candidatePath);

  if (!fileStats.isFile()) {
    return undefined;
  }

  const contentType =
    frontendAssetContentTypes[extname(candidatePath).toLowerCase()] ?? "application/octet-stream";
  const cacheControl = getCacheControlForFrontendFile(pathname);

  return serveFileResponse(request, candidatePath, fileStats, contentType, cacheControl);
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

  const staticFileResponse = tryServeFrontendFile(frontendDistPath, request, pathname);

  if (staticFileResponse) {
    return staticFileResponse;
  }

  if (pathname.startsWith(`${APP_BASE_PATH}/assets/`)) {
    set.status = 404;
    return { error: "Not Found" };
  }

  return serveIndexHtml(frontendDistPath, request);
}

export function createFrontendStaticPlugin(frontendDistPath: string) {
  return new Elysia({ name: "frontend-static", seed: { frontendDistPath } })
    .get(APP_BASE_PATH, ({ request }) => serveIndexHtml(frontendDistPath, request))
    .get(`${APP_BASE_PATH}/*`, (context: Pick<Context, "request" | "set">) =>
      serveSpaFallback(frontendDistPath, context),
    );
}
