import { apiClient } from "#/shared/api/client.ts";
import type { TagSummaryDTO } from "./types";

type ApiError = {
  message: string;
  code: string;
  data?: Record<string, unknown>;
};

type SuccessEnvelope<T> = {
  ok: true;
  data: T;
};

type ErrorEnvelope = {
  ok: false;
  error: ApiError;
};

type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

const unexpectedError: ApiError = {
  message: "Something went wrong. Please try again.",
  code: "bookmark.unexpected",
};

function isApiEnvelope<T>(value: unknown): value is SuccessEnvelope<T> | ErrorEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  );
}

function unexpectedResult<T>(): ApiResult<T> {
  return {
    ok: false,
    error: unexpectedError,
  };
}

function parseApiEnvelope<T>(envelope: SuccessEnvelope<T> | ErrorEnvelope): ApiResult<T> {
  if (envelope.ok) {
    return {
      ok: true,
      data: envelope.data,
    };
  }

  return {
    ok: false,
    error: envelope.error,
  };
}

export async function listTags(): Promise<ApiResult<{ tags: TagSummaryDTO[] }>> {
  try {
    const response = await apiClient.api.tags.get();
    const envelope = response.data ?? response.error?.value;

    if (isApiEnvelope<{ tags: TagSummaryDTO[] }>(envelope)) {
      return parseApiEnvelope(envelope);
    }

    return unexpectedResult<{ tags: TagSummaryDTO[] }>();
  } catch {
    return unexpectedResult<{ tags: TagSummaryDTO[] }>();
  }
}
