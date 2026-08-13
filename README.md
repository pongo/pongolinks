# pongolinks

<p align="center">
  <img width="250" alt="pongolinks" src="https://github.com/user-attachments/assets/d4a2971a-84ae-42ea-a7e5-94b8c06e83a4" />
</p>

pongolinks is a single-user self-hosted bookmark library for saving, organizing, and rediscovering links.

<img width="816" height="572" alt="Screenshot" src="https://github.com/user-attachments/assets/634dc5cf-5b07-4832-938c-dfe2e88a253d" />

## Features

- Save bookmarks with title, description, and Tags.
- Filter bookmarks by included Tags, excluded Tags, Bookmark URL host, and search text.
- Extract Related Links from bookmark descriptions.
- Save the current page through a Bookmarklet or the Chrome and Firefox browser extensions.
- Check whether the current browser tab URL is already saved through a browser extension.

## Technology Stack

- Bun
- Monorepo: Bun workspaces and Turborepo
- Backend: Bun, Elysia, Elysia Eden contract
- Frontend: Vue SPA, Vue Router, Vite, Tailwind CSS
- Database: SQLite through Drizzle ORM and `@libsql/client`
- Testing: Vitest
- Formatting: oxfmt

## Architecture

The project uses vertical slices. Feature behavior lives near the feature that owns it, while durable database schema and stable shared contracts live in workspace packages.

Read these documents before changing architecture or domain language:

- [`docs/architecture.md`](docs/architecture.md)
- [`CONTEXT.md`](CONTEXT.md) for ubiquitous language

Operational errors use the shared Rust-style `Result<T, E>` pattern. Exceptions are reserved for programmer errors, failed invariants, and test assertions.

## Repository Structure

```text
├── apps/
│   ├── backend/            Bun/Elysia server, API, Eden contract, production entrypoint
│   ├── frontend/           Vue SPA and browser UI
│   ├── extension-chrome/   Chrome extension source and build output
│   └── extension-firefox/  Firefox extension source and private signing build output
├── packages/
│   ├── db/                 Drizzle schema, relations, client, and migrations
│   └── shared/             Stable cross-workspace TypeScript contracts and helpers
├── docs/
│   ├── adr/                Architecture Decision Records
│   └── architecture.md     Project-wide architecture rules
├── CONTEXT.md              Domain glossary and relationships
├── package.json            Root workspace scripts
└── turbo.json              Turborepo pipeline
```

## Setup

Install Bun, then install dependencies from the repository root:

```bash
bun install
```

Create local environment values. The backend requires admin password:

```bash
AUTH_PASSWORD=admin123
DATABASE_PATH=.data/pongolinks.sqlite
```

`DATABASE_PATH` is optional if you want the default local SQLite path.

Run database migrations:

```bash
bun run db:migrate
```

## Development

Start the backend and frontend development servers:

```bash
bun run dev
```

The frontend dev server uses the `/pl/` base path and proxies `/pl/api` to the backend on port `3000`.

OpenAPI: http://localhost:3000/openapi

## Browser Extension

<img width="88" height="50" alt="browser extension icon" src="https://github.com/user-attachments/assets/2e7a7739-019a-4b1b-a182-f71cf758c494" />

The Chrome and Firefox extension sources are in `apps/extension-chrome` and `apps/extension-firefox`. In source form they target the local app at:

```text
http://localhost:3000/pl/
```

Build a loadable Chrome extension from the repository root:

```bash
bun run extension:build https://example.com/pl/
```

The URL must be an HTTP(S) app base URL ending with `/`. The command writes `apps/extension-chrome/dist`, which can be loaded as an unpacked Chrome extension.

Build and validate the private Firefox extension with:

```bash
bun run extension:build:firefox https://example.com/pl/
```

This writes the loadable files to `apps/extension-firefox/dist` and creates a ZIP in `apps/extension-firefox/web-ext-artifacts`. Submit that ZIP to Mozilla Add-ons for self-distribution, then install the signed `.xpi` through Firefox's `Install Add-on From File` action. See [`apps/extension-firefox/README.md`](apps/extension-firefox/README.md) for the signing and update workflow.
