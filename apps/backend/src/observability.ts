import { opentelemetry } from "@elysia/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Elysia } from "elysia";
import { initLogger } from "evlog";
import type { AxiomConfig } from "evlog/axiom";
import { createAxiomDrain } from "evlog/axiom";
import type { EvlogElysiaOptions } from "evlog/elysia";

import { config } from "./config";

const AXIOM_TRACES_URL = "https://api.axiom.co/v1/traces";
const SERVICE_NAME = "pongolinks-backend";

let didWarnAboutPartialTracingConfig = false;

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
      service: SERVICE_NAME,
    },
  });
}

export function createRequestLoggingOptions(): EvlogElysiaOptions {
  return {
    ...createAxiomDrainOptions(),
  };
}

function hasPartialTracingConfig() {
  const { axiomToken, axiomDataset } = config.traces;

  return Boolean(axiomToken || axiomDataset) && !(axiomToken && axiomDataset);
}

function warnAboutPartialTracingConfig() {
  if (didWarnAboutPartialTracingConfig) {
    return;
  }

  didWarnAboutPartialTracingConfig = true;
  console.warn(
    "OpenTelemetry tracing disabled: set both AXIOM_TRACES_TOKEN and AXIOM_TRACES_DATASET to export traces to Axiom.",
  );
}

function getTracingCredentials() {
  const { axiomToken, axiomDataset } = config.traces;

  if (config.isTestRuntime) {
    return undefined;
  }

  if (hasPartialTracingConfig()) {
    warnAboutPartialTracingConfig();
    return undefined;
  }

  if (!axiomToken || !axiomDataset) {
    return undefined;
  }

  return { axiomToken, axiomDataset };
}

export function createTracingPlugin() {
  const tracingCredentials = getTracingCredentials();

  if (!tracingCredentials) {
    return new Elysia({ name: "tracing-disabled" });
  }

  return opentelemetry({
    serviceName: SERVICE_NAME,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: AXIOM_TRACES_URL,
          headers: {
            Authorization: `Bearer ${tracingCredentials.axiomToken}`,
            "X-Axiom-Dataset": tracingCredentials.axiomDataset,
          },
        }),
      ),
    ],
  });
}
