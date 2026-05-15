import { createDb } from "@pongolinks/db";

import { createApp } from "./app";
import { config } from "./config";
import { initializeObservability } from "./observability";

initializeObservability();

const database = await createDb({ databasePath: config.databasePath });

export const app = createApp({ db: database.db });

app.listen(config.port);

console.log(`pongolinks backend listening on ${app.server?.url}`);

export type { ApiRoutes, App } from "./app";
export { createApp } from "./app";
