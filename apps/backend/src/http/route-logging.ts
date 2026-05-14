import type { ApiError } from "./result-response.ts";

export type RouteLogger = {
  set: (context: Record<string, unknown>) => void;
};

const noopLogger: RouteLogger = {
  set: () => {},
};

export function getRouteLogger(context: unknown): RouteLogger {
  return typeof context === "object" && context !== null && "log" in context
    ? ((context as { log?: RouteLogger }).log ?? noopLogger)
    : noopLogger;
}

export function logApiError(log: RouteLogger, error: ApiError) {
  log.set({
    error: {
      message: error.message,
      code: error.code,
      status: error.status,
      ...(error.data ? { data: error.data } : {}),
    },
  });
}
