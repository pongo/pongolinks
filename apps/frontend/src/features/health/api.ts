import { treaty } from "@elysiajs/eden";

import type { ApiRoutes } from "@pongolinks/backend";

type ApiClient = ReturnType<typeof treaty<ApiRoutes>>;

export const api: ApiClient = treaty<ApiRoutes>(`${window.location.origin}/pongolinks`);
