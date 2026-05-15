# evlog wide events for backend observability

pongolinks backend observability will use evlog wide events: one request-scoped event should accumulate the useful context for an operation instead of spreading routine progress across many log lines. The backend sends request wide events to Axiom when Axiom credentials are configured outside the test runtime. Tests and smoke suites keep Axiom disabled, even when Bun would otherwise auto-load `.env`, so local verification does not emit remote logs. Handlers and services should be written so bookmark operations can add operation, validation, duplicate, not-found, and persistence context to the request event. This favors richer debugging context over scattered logs and establishes the logging style before more vertical slices are added.

see: @docs/vendor/evlog/elysia.md @docs/vendor/evlog/wide-events.md @docs/vendor/evlog/axiom.md
