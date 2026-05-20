import QuickLRU from "quick-lru";
import { Err, Ok, type Result } from "@pongolinks/shared/result";

import type { BookmarkUrl } from "#/domain/bookmark-url.ts";
import { ApiError } from "#/http/result-response.ts";

export type WaybackAvailabilityDTO =
  | { available: false }
  | {
      available: true;
      archivedUrl: string;
      timestamp: string;
    };

type WaybackPayload = {
  archived_snapshots?: {
    closest?: {
      available?: unknown;
      url?: unknown;
      timestamp?: unknown;
    };
  };
};

const WAYBACK_AVAILABILITY_URL = "https://archive.org/wayback/available";
const WAYBACK_CACHE_MAX_SIZE = 64;
const WAYBACK_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function malformedPayloadError(payload: unknown) {
  return new ApiError("Wayback availability payload is malformed", "bookmark.unexpected", 502, {
    payload,
  });
}

export class WaybackAvailabilityService {
  private readonly cache = new QuickLRU<string, WaybackAvailabilityDTO>({
    maxSize: WAYBACK_CACHE_MAX_SIZE,
    maxAge: WAYBACK_CACHE_MAX_AGE_MS,
  });

  constructor(private readonly fetchFn?: typeof fetch) {}

  cacheSize(): number {
    return this.cache.size;
  }

  async getAvailability(url: BookmarkUrl): Promise<Result<WaybackAvailabilityDTO, ApiError>> {
    const cacheKey = url.value();
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return Ok(cached);
    }

    const endpoint = `${WAYBACK_AVAILABILITY_URL}?url=${encodeURIComponent(cacheKey)}`;

    let response: Response;
    const fetchFn = this.fetchFn ?? globalThis.fetch;

    try {
      response = await fetchFn(endpoint);
    } catch (error) {
      return Err(
        new ApiError("Wayback availability request failed", "bookmark.unexpected", 502, { error }),
      );
    }

    if (!response.ok) {
      return Err(
        new ApiError("Wayback availability response is not OK", "bookmark.unexpected", 502, {
          status: response.status,
        }),
      );
    }

    let payload: WaybackPayload;
    try {
      payload = (await response.json()) as WaybackPayload;
    } catch (error) {
      return Err(
        new ApiError(
          "Wayback availability response body is invalid JSON",
          "bookmark.unexpected",
          502,
          {
            error,
          },
        ),
      );
    }

    if (!isRecord(payload.archived_snapshots)) {
      return Err(malformedPayloadError(payload));
    }

    const closest = payload.archived_snapshots.closest;
    if (closest === undefined) {
      const unavailable: WaybackAvailabilityDTO = { available: false };
      this.cache.set(cacheKey, unavailable);
      return Ok(unavailable);
    }

    if (!isRecord(closest) || typeof closest.available !== "boolean") {
      return Err(malformedPayloadError(payload));
    }

    if (closest.available === false) {
      const unavailable: WaybackAvailabilityDTO = { available: false };
      this.cache.set(cacheKey, unavailable);
      return Ok(unavailable);
    }

    if (typeof closest.url !== "string" || typeof closest.timestamp !== "string") {
      return Err(malformedPayloadError(payload));
    }

    const available: WaybackAvailabilityDTO = {
      available: true,
      archivedUrl: closest.url,
      timestamp: closest.timestamp,
    };
    this.cache.set(cacheKey, available);

    return Ok(available);
  }
}
