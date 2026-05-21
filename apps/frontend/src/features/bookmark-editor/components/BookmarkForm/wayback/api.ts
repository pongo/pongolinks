import type { Result } from "@pongolinks/shared/result";

import { apiClient, type EdenApiResponse, createApiResultAdapter } from "#/shared/api/client.ts";
import { ApiError, mapBookmarkUrlApiErrorToFormErrors } from "#/shared/api/errors.ts";
import type { WaybackAvailabilityDTO } from "./types.ts";

const fallbackError = new ApiError("Something went wrong. Please try again.", "wayback.unexpected");

type WaybackAvailabilityEndpoint = {
  get: (input: { $query: { url: string } }) => Promise<EdenApiResponse>;
};

const waybackAvailabilityEndpoint = apiClient.api.wayback
  .availability as WaybackAvailabilityEndpoint;

const waybackApi = createApiResultAdapter({
  fallbackError,
  mapFormErrors: mapBookmarkUrlApiErrorToFormErrors,
});

export function parseApiPayload<T>(payload: unknown): Result<T, ApiError> {
  return waybackApi.parsePayload<T>(payload);
}

export async function checkWaybackAvailability(
  url: string,
  endpoint: WaybackAvailabilityEndpoint = waybackAvailabilityEndpoint,
): Promise<Result<WaybackAvailabilityDTO, ApiError>> {
  return waybackApi.call<WaybackAvailabilityDTO>(() => endpoint.get({ $query: { url } }));
}
