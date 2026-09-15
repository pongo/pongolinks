# Cookie sessions for single-user auth

## Context

pongolinks is a single-user self-hosted service, but it is accessed through a browser SPA and browser extensions as well as through backend-rendered pages. The original browser-managed Basic Auth flow repeatedly and unpredictably asked for the login and password, which made normal browser use and extension requests unreliable.

The service needs one simple authentication mechanism that persists across backend restarts and is shared by the SPA and browser extensions. A full multi-user identity system is not required for the current product, and introducing JWTs or a separate session service would add complexity without solving a current need.

## Decision

pongolinks replaces Basic Auth with server-issued persistent cookie sessions. The backend renders a password login page at `APP_BASE_PATH/login` (currently `/pl/login`) and reads the single password from `AUTH_PASSWORD`.

After a successful login, the backend generates an opaque random token, stores only its SHA-256 hash in the SQLite `auth_sessions` table, and sends the token in a cookie scoped to `APP_BASE_PATH`. The cookie is `HttpOnly`, `SameSite=Lax`, secure for HTTPS or production requests, and has an absolute two-year lifetime. The database session has the same expiration.

Unauthenticated API requests return the shared `auth.unauthorized` error with HTTP 401. Other protected requests redirect to the login page with a validated in-app return path.

Cookies are intentionally used because they are simple and sufficient for this single-user browser-based service. JSON session storage, JWTs, logout and session-management UI, and Basic Auth compatibility are out of scope for the first version.

## Consequences

- Browser sessions no longer depend on the browser's Basic Auth credential-cache behavior.
- The SPA and browser extensions can use the same browser profile session without owning authentication logic themselves.
- Authentication adds durable SQLite state and a migration. Sessions survive backend restarts, and each successful login can create another valid session.
- Expired sessions are removed when encountered or while creating a new session. There is no application-level logout or session revocation UI yet.
- Changing `AUTH_PASSWORD` requires a backend restart and does not invalidate existing sessions; existing sessions remain valid until they expire or are removed from the database.
- The cookie and session behavior is a cross-app contract. A future move to multi-user auth, API tokens, or stateless sessions requires revisiting this decision.
