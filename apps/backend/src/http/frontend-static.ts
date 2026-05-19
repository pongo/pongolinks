import { Elysia, type Context } from "elysia";
import { existsSync, readFileSync, statSync } from "node:fs";
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

function serveIndexHtml(frontendDistPath: string) {
  const indexPath = join(frontendDistPath, "index.html");

  if (typeof Bun !== "undefined") {
    return new Response(Bun.file(indexPath), {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  return new Response(readFileSync(indexPath), {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

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

export function createFrontendStaticPlugin(frontendDistPath: string) {
  return new Elysia({ name: "frontend-static", seed: { frontendDistPath } })
    .get(APP_BASE_PATH, () => serveIndexHtml(frontendDistPath))
    .get(`${APP_BASE_PATH}/*`, (context: Pick<Context, "request" | "set">) =>
      serveSpaFallback(frontendDistPath, context),
    );
}
