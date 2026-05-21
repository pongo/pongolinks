import { Err, type Result } from "@pongolinks/shared/result";

import {
  apiClient,
  type EdenApiResponse,
  parseApiPayload as parseSharedApiPayload,
  parseEdenResponse,
} from "#/shared/api/client.ts";
import {
  ApiError,
  mapBookmarkUrlApiErrorToFormErrors,
  parseApiError as parseSharedApiError,
} from "#/shared/api/errors.ts";
import type { WaybackAvailabilityDTO } from "./types.ts";

const fallbackError = new ApiError("Something went wrong. Please try again.", "wayback.unexpected");

type WaybackAvailabilityEndpoint = {
  get: (input: { $query: { url: string } }) => Promise<EdenApiResponse>;
};

const waybackAvailabilityEndpoint = apiClient.api.wayback
  .availability as WaybackAvailabilityEndpoint;

function parseApiError(value: unknown): ApiError {
  return parseSharedApiError(value, {
    fallbackError,
    mapFormErrors: mapBookmarkUrlApiErrorToFormErrors,
  });
}

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return parseSharedApiPayload<T, ApiError>(payload, {
    fallbackError,
    parseError: parseApiError,
  });
}

export async function checkWaybackAvailability(
  url: string,
  endpoint: WaybackAvailabilityEndpoint = waybackAvailabilityEndpoint,
): Promise<Result<WaybackAvailabilityDTO, ApiError>> {
  try {
    return parseEdenResponse<WaybackAvailabilityDTO, ApiError>(
      await endpoint.get({ $query: { url } }),
      {
        fallbackError,
        parseError: parseApiError,
      },
    );
  } catch {
    return Err(fallbackError);
  }
}
