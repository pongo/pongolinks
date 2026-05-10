import { fileURLToPath } from "node:url";

export type BackendConfig = {
  port: number;
  databasePath: string;
  frontendDistPath: string;
};

const defaultFrontendDistPath = fileURLToPath(new URL("../../frontend/dist", import.meta.url));

const env = typeof Bun === "undefined" ? process.env : Bun.env;

export const config: BackendConfig = {
  port: Number(env.PORT ?? 3000),
  databasePath: env.DATABASE_PATH ?? ".data/pongolinks.sqlite",
  frontendDistPath: env.FRONTEND_DIST_PATH ?? defaultFrontendDistPath,
};
