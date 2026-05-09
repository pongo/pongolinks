import { treaty } from "@elysiajs/eden";

import type { App } from "@pongolinks/backend";

type ApiClient = ReturnType<typeof treaty<App>>;

export const api: ApiClient = treaty<App>(window.location.origin);
