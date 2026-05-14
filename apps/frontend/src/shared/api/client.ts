import { edenTreaty } from "@elysiajs/eden";
import type { EdenTreaty } from "@elysiajs/eden/treaty";
import type { ApiRoutes } from "@pongolinks/backend/contract";
import { Err, type Result, isResult } from "@pongolinks/shared/result";

export const apiClient: EdenTreaty.Create<ApiRoutes> = edenTreaty<ApiRoutes>("/pongolinks");

export type EdenApiResponse = {
  data: unknown;
  error: { value?: unknown } | null;
};

type ParseApiPayloadOptions<E extends Error> = {
  fallbackError: E;
  parseError?: (error: unknown) => E;
};

export function parseApiPayload<T, E extends Error>(
  payload: unknown,
  options: ParseApiPayloadOptions<E>,
): Result<T, E> {
  if (!isResult<T, E>(payload)) {
    return Err(options.fallbackError);
  }

  if (payload.isOk) {
    return payload;
  }

  return Err(options.parseError?.(payload.error) ?? options.fallbackError);
}

export function parseEdenResponse<T, E extends Error>(
  response: EdenApiResponse,
  options: ParseApiPayloadOptions<E>,
): Result<T, E> {
  if (response.data !== undefined && response.data !== null) {
    return parseApiPayload<T, E>(response.data, options);
  }

  if (response.error) {
    return parseApiPayload<T, E>(response.error.value, options);
  }

  return Err(options.fallbackError);
}
