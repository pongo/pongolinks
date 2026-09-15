# Authentication

pongolinks uses a single shared password and server-issued cookie sessions. The authentication flow is intentionally small because pongolinks is a single-user self-hosted service.

The architectural rationale and rejected alternatives are recorded in [ADR-0005](adr/0005-cookie-sessions-for-single-user-auth.md). This document describes the current behavior and the operational contract.

## Configuration

The backend requires `AUTH_PASSWORD` when the application is created. Use a strong secret and keep it outside source control.

The SQLite database path is configured with `DATABASE_PATH` and defaults to `.data/pongolinks.sqlite`. Authentication sessions are stored in that database, so database backups also contain the session records.

After installing dependencies, apply the database migrations before starting the backend:

```bash
bun run db:migrate
```

## Login flow

- `GET /pl/login` renders the backend login page.
- `POST /pl/login` checks the submitted password and, on success, redirects to a validated path inside `/pl/`.
- An invalid password returns HTTP 401 and does not set a session cookie.
- An already authenticated request to `/pl/login` redirects to the requested in-app path.

The `next` path is restricted to the application base path. External and protocol-relative URLs are ignored so that login cannot become an open redirect.

## Session behavior

Successful login creates a 32-byte random opaque token. The raw token is sent only to the browser. Its SHA-256 hash is stored in `auth_sessions` together with creation and expiration timestamps.

The browser receives the `pongolinks_session` cookie with these properties:

- `HttpOnly`, so browser scripts cannot read the token;
- `SameSite=Lax`, suitable for the same-site browser application;
- `Path=/pl/`, so it is scoped to the application;
- `Max-Age=63072000` (two years), with the same absolute expiration in SQLite;
- `Secure` for HTTPS requests and production runtime.

Sessions survive backend restarts. Expired sessions are deleted when they are encountered and when a new session is created. Logging in again creates another session; existing sessions are not replaced.

## Protected requests

The session auth plugin protects the application routes globally:

- Requests under `/pl/api/` without a valid session return HTTP 401 with the `auth.unauthorized` API error.
- Other protected page and asset requests redirect to `/pl/login` and preserve a safe in-app return path.
- The login route itself is available without a session.

The frontend redirects to the login page when an API response contains `auth.unauthorized` and returns to the original route after a successful login.

## Browser extensions

The Chrome and Firefox extensions do not implement a separate login flow. Log in to the configured pongolinks origin in the browser first; requests from the extensions then use the browser profile's existing same-origin session cookie. See the [browser extension documentation](browser-extension.md) for the extension message and cache contracts.

## Operations and limitations

- There is no logout or session-management UI in the current version.
- Changing `AUTH_PASSWORD` takes effect after the backend is restarted, but it does not revoke existing sessions. Existing session rows must be removed with SQLite tooling when immediate revocation is required; back up the database before making direct changes.
- Clearing a browser's cookies signs that browser out, but the corresponding database session remains until it expires or is removed.
- Use HTTPS in production so the session cookie is marked secure in transit.
- This is a single-user password gate, not a multi-user identity system. JWTs, API tokens, and Basic Auth compatibility are not supported.

Authentication behavior is covered by [`apps/backend/test/cookie-auth.test.ts`](../apps/backend/test/cookie-auth.test.ts) and the frontend unauthorized-response tests.
