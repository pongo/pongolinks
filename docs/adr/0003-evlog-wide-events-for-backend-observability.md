# evlog wide events for backend observability

pongolinks backend observability will use evlog wide events: one request-scoped event should accumulate the useful context for an operation instead of spreading routine progress across many log lines. The backend sends request wide events to Axiom when Axiom credentials are configured outside the test runtime. Tests and smoke suites keep Axiom disabled, even when Bun would otherwise auto-load `.env`, so local verification does not emit remote logs. Handlers and services should be written so bookmark operations can add operation, validation, duplicate, not-found, and persistence context to the request event. This favors richer debugging context over scattered logs and establishes the logging style before more vertical slices are added.

Backend Bun smoke suites must run through the shared helper in `apps/backend/test/smoke-suite.ts`. The helper passes `--no-env-file`, clears Axiom credentials from the child environment, and sets `NODE_ENV=test`.

pongolinks will add OpenTelemetry traces as a separate backend observability signal, not as a replacement for evlog wide events. Traces go to a dedicated Axiom Events dataset configured by `AXIOM_TRACES_TOKEN` and `AXIOM_TRACES_DATASET`; the existing `AXIOM_TOKEN` or `AXIOM_API_KEY` plus `AXIOM_DATASET` remains the log/wide-event channel. Tracing is disabled in test runtime, disabled with a startup warning when only one trace credential is configured, and initially limited to automatic Elysia request lifecycle spans. Manual spans and log-to-trace correlation can be added later where they prove useful.

see: @docs/vendor/evlog/elysia.md @docs/vendor/evlog/wide-events.md @docs/vendor/evlog/axiom.md https://elysiajs.com/patterns/opentelemetry.md
