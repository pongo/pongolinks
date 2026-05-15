import { fileURLToPath } from "node:url";

export type BackendConfig = {
  port: number;
  databasePath: string;
  frontendDistPath: string;
  isTestRuntime: boolean;
  axiom: {
    apiKey?: string;
    dataset?: string;
    orgId?: string;
    edgeUrl?: string;
    baseUrl?: string;
  };
  traces: {
    axiomToken?: string;
    axiomDataset?: string;
  };
};

const defaultFrontendDistPath = fileURLToPath(new URL("../../frontend/dist", import.meta.url));

const env = typeof Bun === "undefined" ? process.env : Bun.env;

export const config: BackendConfig = {
  port: Number(env.PORT ?? 3000),
  databasePath: env.DATABASE_PATH ?? ".data/pongolinks.sqlite",
  frontendDistPath: env.FRONTEND_DIST_PATH ?? defaultFrontendDistPath,
  isTestRuntime: env.NODE_ENV === "test",
  axiom: {
    apiKey: env.AXIOM_API_KEY ?? env.AXIOM_TOKEN,
    dataset: env.AXIOM_DATASET,
    orgId: env.AXIOM_ORG_ID,
    edgeUrl: env.AXIOM_EDGE_URL,
    baseUrl: env.AXIOM_URL,
  },
  traces: {
    axiomToken: env.AXIOM_TRACES_TOKEN,
    axiomDataset: env.AXIOM_TRACES_DATASET,
  },
};
