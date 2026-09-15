# Backend Observability

The backend uses structured request observability built from evlog wide events and OpenTelemetry traces. These are complementary signals: wide events provide rich operation context, while traces show request lifecycle timing and propagation.

## Wide-event logging

The backend uses evlog wide events instead of spreading routine progress across many log lines. One request-scoped event should accumulate the useful context for an operation before it is emitted. Handlers and services should add operation, validation, duplicate, not-found, and persistence context to the request event where that information is available.

This approach favors richer debugging context and less noisy logs as more vertical slices are added. The Elysia integration emits the request event when the request completes.

When Axiom credentials are configured outside the test runtime, request wide events are sent to the configured Axiom dataset. The log channel uses `AXIOM_TOKEN` or `AXIOM_API_KEY` together with `AXIOM_DATASET`; optional Axiom connection settings are read from the corresponding `AXIOM_*` variables.

## OpenTelemetry tracing

OpenTelemetry traces are a separate backend observability signal, not a replacement for wide-event logging. Traces use a dedicated Axiom Events dataset configured by `AXIOM_TRACES_TOKEN` and `AXIOM_TRACES_DATASET`.

The initial tracing scope is automatic Elysia request lifecycle spans. Tracing is disabled during tests and is disabled with a startup warning when only one of the two trace credentials is configured. Manual spans and log-to-trace correlation can be added later where they provide clear diagnostic value.

## Test and smoke-runtime behavior

Tests and smoke suites must not emit remote Axiom logs or traces, even when Bun would otherwise auto-load `.env` files. Backend Bun smoke suites must run through [`apps/backend/test/smoke-suite.ts`](../apps/backend/test/smoke-suite.ts), whose shared helper:

- passes `--no-env-file`;
- clears Axiom log and trace credentials from the child environment;
- sets `NODE_ENV=test`.

## Vendor references

- [evlog Elysia integration](vendor/evlog/elysia.md)
- [evlog wide events](vendor/evlog/wide-events.md)
- [evlog Axiom adapter](vendor/evlog/axiom.md)
- [Elysia OpenTelemetry pattern](https://elysiajs.com/patterns/opentelemetry.md)
