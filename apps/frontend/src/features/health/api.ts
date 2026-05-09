import { treaty } from "@elysiajs/eden";

import type { App } from "@pongolinks/backend";

export const api = treaty<App>(window.location.origin);
