import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { TEST_AUTH_PASSWORD } from "./api-smoke-support";

export function smokeSuiteEnv() {
  const {
    AXIOM_API_KEY: _axiomApiKey,
    AXIOM_DATASET: _axiomDataset,
    AXIOM_TOKEN: _axiomToken,
    AXIOM_TRACES_DATASET: _axiomTracesDataset,
    AXIOM_TRACES_TOKEN: _axiomTracesToken,
    ...env
  } = process.env;

  return {
    ...env,
    AUTH_PASSWORD: TEST_AUTH_PASSWORD,
    NODE_ENV: "test",
  };
}

export function runBackendSmokeSuite(filePath: string) {
  return spawnSync("bun", ["--no-env-file", filePath], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
    env: smokeSuiteEnv(),
  });
}
