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

const apiBase = "/pongolinks/api";

const unexpectedError: ApiError = {
  message: "Something went wrong. Please try again.",
  code: "bookmark.unexpected",
};

export async function listTags(): Promise<ApiResult<{ tags: TagSummaryDTO[] }>> {
  try {
    const response = await fetch(`${apiBase}/tags`, {
      headers: {
        "content-type": "application/json",
      },
    });
    const envelope = (await response.json()) as
      | SuccessEnvelope<{ tags: TagSummaryDTO[] }>
      | ErrorEnvelope;

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
  } catch {
    return {
      ok: false,
      error: unexpectedError,
    };
  }
}
