import { edenTreaty } from "@elysiajs/eden";
import type { EdenTreaty } from "@elysiajs/eden/treaty";
import type { ApiRoutes } from "@pongolinks/backend/contract";

export const apiClient: EdenTreaty.Create<ApiRoutes> = edenTreaty<ApiRoutes>("/pongolinks");
