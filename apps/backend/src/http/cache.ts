import { isResult } from "@pongolinks/shared/result";
import { Elysia } from "elysia";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

import type { etag as createEtagPlugin } from "@bogeychan/elysia-etag";

type HeaderValue = string | string[] | undefined;
type HeaderBag = Record<string, HeaderValue>;

const PRIVATE_REVALIDATION_CACHE_CONTROL = "private, no-cache";
const AUTHORIZATION_VARY_HEADER = "Authorization";
const require = createRequire(import.meta.url);

type ETagPluginFactory = typeof createEtagPlugin;

function appendVaryHeader(headers: HeaderBag, value: string) {
  const existingValue = headers.vary ?? headers.Vary;
  const existingValues = Array.isArray(existingValue)
    ? existingValue
    : (existingValue?.split(",") ?? []);
  const normalizedValues = existingValues.map((entry) => entry.trim()).filter(Boolean);

  if (normalizedValues.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
    headers.vary = normalizedValues.join(", ");
    delete headers.Vary;
    return;
  }

  headers.vary = [...normalizedValues, value].join(", ");
  delete headers.Vary;
}

function serializeCacheableResponse(response: unknown) {
  if (isResult(response) && response.isOk) {
    return JSON.stringify(response);
  }
}

function createNodeCompatibleEtagPlugin() {
  return new Elysia({ name: "node-compatible-etag" })
    .onAfterHandle((context) => {
      const serializedResponse = serializeCacheableResponse(context.response);

      if (serializedResponse === undefined) {
        return;
      }

      const etag = `"${createHash("sha1").update(serializedResponse).digest("base64")}"`;
      context.set.headers.etag = etag;

      const ifNoneMatch = context.headers["if-none-match"]?.split(",").map((entry) => entry.trim());
      if (context.request.method === "GET" && ifNoneMatch?.includes(etag)) {
        context.set.status = 304;
        context.response = null;
      }
    })
    .as("global");
}

function createRuntimeEtagPlugin() {
  if (typeof Bun === "undefined") {
    return createNodeCompatibleEtagPlugin();
  }

  const { etag } = require("@bogeychan/elysia-etag") as { etag: ETagPluginFactory };

  return etag({
    serialize: serializeCacheableResponse,
  });
}

export function privateApiRevalidationCache() {
  return new Elysia({ name: "private-api-revalidation-cache" })
    .use(createRuntimeEtagPlugin())
    .onAfterHandle(({ set }) => {
      const headers = set.headers as HeaderBag;

      headers["cache-control"] = PRIVATE_REVALIDATION_CACHE_CONTROL;
      appendVaryHeader(headers, AUTHORIZATION_VARY_HEADER);
    })
    .as("global");
}
