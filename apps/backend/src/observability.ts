import { initLogger } from "evlog";
import type { AxiomConfig } from "evlog/axiom";
import { createAxiomDrain } from "evlog/axiom";
import type { EvlogElysiaOptions } from "evlog/elysia";

import { config } from "./config";

function createAxiomDrainOptions() {
  const { apiKey, dataset, orgId, edgeUrl, baseUrl } = config.axiom;

  if (config.isTestRuntime || !apiKey || !dataset) {
    return undefined;
  }

  const axiomConfig: Partial<AxiomConfig> = {
    apiKey,
    dataset,
    orgId,
    ...(edgeUrl ? { edgeUrl } : { baseUrl }),
  };

  return {
    drain: createAxiomDrain(axiomConfig),
  } satisfies Pick<EvlogElysiaOptions, "drain">;
}

export function initializeObservability() {
  initLogger({
    env: {
      service: "pongolinks-backend",
    },
  });
}

export function createRequestLoggingOptions(): EvlogElysiaOptions {
  return {
    ...createAxiomDrainOptions(),
  };
}
