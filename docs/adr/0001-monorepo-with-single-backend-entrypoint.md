# Monorepo with a single backend entrypoint

pongolinks will use one repository with `apps/backend` for the Bun/Elysia server, `apps/frontend` for the Vue SPA, and shared packages for durable cross-app concerns such as the database schema. The backend is the only production entrypoint: it owns HTTP API routes, the Eden contract, database access, and serving the built frontend assets. This keeps deployment simple for a single-user service while leaving room for a future browser extension as a separate app.

The frontend should call backend API routes through Elysia Eden rather than raw `fetch`, so route shape and response types stay tied to the backend contract.

The Eden contract consumed by the frontend should be exported from a side-effect-free backend module, not from the backend runtime entrypoint that starts the server.

The frontend should keep one shared Eden client for backend connectivity, while each vertical slice owns its own API adapter functions and UI-facing error mapping.

Backend API routes should continue returning the project envelope shape (`{ ok: true, data } | { ok: false, error }`). Frontend feature adapters should translate Eden responses into UI-facing results instead of exposing transport details to Vue components.
