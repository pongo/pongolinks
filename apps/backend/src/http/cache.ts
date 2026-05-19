import { isResult } from "@pongolinks/shared/result";
import { Elysia } from "elysia";

import { etag } from "#/http/etag.ts";

type HeaderValue = string | string[] | undefined;
type HeaderBag = Record<string, HeaderValue>;

const PRIVATE_REVALIDATION_CACHE_CONTROL = "private, no-cache";
const AUTHORIZATION_VARY_HEADER = "Authorization";

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

export function privateApiRevalidationCache() {
  return new Elysia({ name: "private-api-revalidation-cache" })
    .use(etag({ serialize: serializeCacheableResponse }))
    .onAfterHandle(({ set }) => {
      const headers = set.headers as HeaderBag;

      headers["cache-control"] = PRIVATE_REVALIDATION_CACHE_CONTROL;
      appendVaryHeader(headers, AUTHORIZATION_VARY_HEADER);
    })
    .as("global");
}
