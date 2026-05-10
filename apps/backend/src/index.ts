import { app } from "./app";
import { config } from "./config";

app.listen(config.port);

console.log(`pongolinks backend listening on ${app.server?.url}`);

export type { ApiRoutes, App } from "./app";
export { app, createApp } from "./app";
