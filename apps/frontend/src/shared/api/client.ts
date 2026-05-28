import { edenTreaty } from "@elysiajs/eden";
import type { EdenTreaty } from "@elysiajs/eden/treaty";
import type { ApiRoutes } from "@pongolinks/backend/contract";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";
import { Err, type Result, isResult } from "@pongolinks/shared/result";
import { ApiError, type FormErrors, genericFallbackError, parseApiError } from "./errors";

export const apiClient: EdenTreaty.Create<ApiRoutes> = edenTreaty<ApiRoutes>(APP_BASE_PATH);

export type EdenApiResponse = {
  data: unknown;
  error: { value?: unknown } | null;
};

type ApiResultAdapterOptions = {
  fallbackError?: ApiError;
  mapFormErrors?: (error: Pick<ApiError, "code" | "message">) => FormErrors;
  onUnauthorized?: (currentPath: string) => void;
};

type ParseApiPayloadOptions = Required<Pick<ApiResultAdapterOptions, "fallbackError">> &
  Pick<ApiResultAdapterOptions, "mapFormErrors">;

function parseErrorPayload(value: unknown, options: ParseApiPayloadOptions): ApiError {
  return parseApiError(value, {
    fallbackError: options.fallbackError,
    mapFormErrors: options.mapFormErrors,
  });
}

function parseApiPayload<T>(
  payload: unknown,
  options: ApiResultAdapterOptions = {},
): Result<T, ApiError> {
  const fallbackError = options.fallbackError ?? genericFallbackError;

  if (!isResult<T, ApiError>(payload)) {
    return Err(fallbackError);
  }

  if (payload.isOk) {
    return payload;
  }

  return Err(
    parseErrorPayload(payload.error, {
      fallbackError,
      mapFormErrors: options.mapFormErrors,
    }),
  );
}

export function getLoginRedirectPath(currentPath: string) {
  const next =
    currentPath.startsWith("/") && !currentPath.startsWith("//")
      ? currentPath
      : `${APP_BASE_PATH}/`;

  return `${APP_BASE_PATH}/login?next=${encodeURIComponent(next)}`;
}

function redirectToLogin(currentPath: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(getLoginRedirectPath(currentPath));
}

function getCurrentBrowserPath() {
  if (typeof window === "undefined") {
    return `${APP_BASE_PATH}/`;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function handleUnauthorized(result: Result<unknown, ApiError>, options: ApiResultAdapterOptions) {
  if (result.isErr && result.error.code === "auth.unauthorized") {
    (options.onUnauthorized ?? redirectToLogin)(getCurrentBrowserPath());
  }
}

function parseEdenResponse<T>(
  response: EdenApiResponse,
  options: ApiResultAdapterOptions = {},
): Result<T, ApiError> {
  const fallbackError = options.fallbackError ?? genericFallbackError;
  let result: Result<T, ApiError>;

  if (response.data !== undefined && response.data !== null) {
    result = parseApiPayload<T>(response.data, { ...options, fallbackError });
    handleUnauthorized(result, options);
    return result;
  }

  if (response.error) {
    result = parseApiPayload<T>(response.error.value, { ...options, fallbackError });
    handleUnauthorized(result, options);
    return result;
  }

  return Err(fallbackError);
}

export function createApiResultAdapter(options: ApiResultAdapterOptions = {}) {
  const fallbackError = options.fallbackError ?? genericFallbackError;
  const adapterOptions = { ...options, fallbackError };

  return {
    parsePayload<T>(payload: unknown): Result<T, ApiError> {
      return parseApiPayload<T>(payload, adapterOptions);
    },

    parseResponse<T>(response: EdenApiResponse): Result<T, ApiError> {
      return parseEdenResponse<T>(response, adapterOptions);
    },

    async call<T>(request: () => Promise<EdenApiResponse>): Promise<Result<T, ApiError>> {
      try {
        return parseEdenResponse<T>(await request(), adapterOptions);
      } catch {
        return Err(fallbackError);
      }
    },
  };
}
