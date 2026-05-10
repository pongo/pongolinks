# Monorepo with a single backend entrypoint

pongolinks will use one repository with `apps/backend` for the Bun/Elysia server, `apps/frontend` for the Vue SPA, and shared packages for durable cross-app concerns such as the database schema. The backend is the only production entrypoint: it owns HTTP API routes, the Eden contract, database access, and serving the built frontend assets. This keeps deployment simple for a single-user service while leaving room for a future browser extension as a separate app.
