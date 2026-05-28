import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Elysia } from "elysia";
import { eq, lte } from "drizzle-orm";
import { authSessions } from "@pongolinks/db/schema";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";
import { Err } from "@pongolinks/shared/result";

import type { AppDb } from "#/db/app-db.ts";
import { ApiError } from "#/http/result-response.ts";

const SESSION_COOKIE_NAME = "pongolinks_session";
const SESSION_TOKEN_BYTES = 32;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2;
const LOGIN_PATH = `${APP_BASE_PATH}/login`;
const DEFAULT_NEXT_PATH = `${APP_BASE_PATH}/`;

type AuthCookie = {
  value?: string;
  set: (options: {
    value: string;
    httpOnly: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
    secure: boolean;
  }) => void;
};

type AuthCookieJar = Record<string, AuthCookie | undefined>;

export type CreateSessionAuthPluginOptions = {
  db?: AppDb;
};

function readEnv(name: string) {
  return typeof Bun === "undefined" ? process.env[name] : Bun.env[name];
}

function readAuthPassword() {
  const password = readEnv("AUTH_PASSWORD");

  if (!password?.trim()) {
    throw new Error("AUTH_PASSWORD must be set");
  }

  return password;
}

function toSqliteTimestamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function getCurrentTimestamp() {
  return toSqliteTimestamp(new Date());
}

function getSessionCookiePath() {
  return `${APP_BASE_PATH}/`;
}

function hashValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

function isPasswordMatch(candidate: string, expected: string) {
  return timingSafeEqual(hashValue(candidate), hashValue(expected));
}

function createSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

function shouldUseSecureCookie(request: Request) {
  return new URL(request.url).protocol === "https:" || readEnv("NODE_ENV") === "production";
}

function getCookie(cookie: AuthCookieJar) {
  return cookie[SESSION_COOKIE_NAME];
}

function setSessionCookie(cookie: AuthCookieJar, request: Request, token: string) {
  getCookie(cookie)?.set({
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: getSessionCookiePath(),
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: shouldUseSecureCookie(request),
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isAppPath(pathname: string) {
  return pathname === APP_BASE_PATH || pathname.startsWith(`${APP_BASE_PATH}/`);
}

function getSafeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  const url = new URL(value, "http://localhost");

  if (!isAppPath(url.pathname)) {
    return DEFAULT_NEXT_PATH;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function getRequestNextPath(request: Request) {
  const url = new URL(request.url);

  return getSafeNextPath(`${url.pathname}${url.search}${url.hash}`);
}

function getLoginRedirectPath(request: Request) {
  const next = getRequestNextPath(request);

  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

function renderLoginPage(options: { next: string; hasError?: boolean }) {
  const errorHtml = options.hasError ? '<p class="error" role="alert">Invalid password</p>' : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Log in - pongolinks</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      align-items: center;
      display: flex;
      justify-content: center;
      margin: 0;
      min-height: 100vh;
    }

    main {
      max-width: 24rem;
      padding: 1.5rem;
      width: 100%;
    }

    label,
    input,
    button {
      display: block;
      font: inherit;
      width: 100%;
    }

    label {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    input {
      box-sizing: border-box;
      margin-bottom: 1rem;
      padding: 0.75rem;
    }

    button {
      cursor: pointer;
      font-weight: 600;
      padding: 0.75rem;
    }

    .error {
      color: #b42318;
      margin: 0 0 1rem;
    }
  </style>
</head>
<body>
  <main>
    <form method="post" action="${LOGIN_PATH}">
      ${errorHtml}
      <input type="hidden" name="next" value="${escapeHtml(options.next)}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
      <button type="submit">Log in</button>
    </form>
  </main>
</body>
</html>`;
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function redirectResponse(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      location,
    },
  });
}

function unauthorizedApiResponse(set: { status?: number | string }) {
  set.status = 401;
  return Err(new ApiError("Authentication required", "auth.unauthorized", 401));
}

async function cleanupExpiredSessions(db: AppDb) {
  await db.delete(authSessions).where(lte(authSessions.expiresAt, getCurrentTimestamp())).run();
}

async function createSession(db: AppDb) {
  await cleanupExpiredSessions(db);

  const token = createSessionToken();
  const expiresAt = toSqliteTimestamp(new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000));

  await db
    .insert(authSessions)
    .values({
      tokenHash: hashToken(token),
      expiresAt,
    })
    .run();

  return token;
}

async function isValidSession(db: AppDb, token: string | undefined) {
  if (!token) {
    return false;
  }

  const tokenHash = hashToken(token);
  const session = await db.query.authSessions.findFirst({
    where: eq(authSessions.tokenHash, tokenHash),
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt <= getCurrentTimestamp()) {
    await db.delete(authSessions).where(eq(authSessions.id, session.id)).run();
    return false;
  }

  return true;
}

function isLoginRequest(request: Request) {
  const url = new URL(request.url);

  return url.pathname === LOGIN_PATH;
}

function isApiRequest(request: Request) {
  return new URL(request.url).pathname.startsWith(`${APP_BASE_PATH}/api/`);
}

export function createSessionAuthPlugin(options: CreateSessionAuthPluginOptions) {
  const authPassword = readAuthPassword();

  return new Elysia({ name: "session-auth" })
    .get(LOGIN_PATH, async ({ request, cookie }) => {
      const next = getSafeNextPath(new URL(request.url).searchParams.get("next"));

      if (
        options.db &&
        (await isValidSession(options.db, getCookie(cookie as AuthCookieJar)?.value))
      ) {
        return redirectResponse(next);
      }

      return htmlResponse(renderLoginPage({ next }));
    })
    .post(LOGIN_PATH, async ({ request, cookie }) => {
      const formData = await request.formData();
      const next = getSafeNextPath(formData.get("next"));
      const password = formData.get("password");

      if (typeof password !== "string" || !isPasswordMatch(password, authPassword)) {
        return htmlResponse(renderLoginPage({ next, hasError: true }), 401);
      }

      if (!options.db) {
        return new Response("Session storage is unavailable", { status: 503 });
      }

      const token = await createSession(options.db);
      setSessionCookie(cookie as AuthCookieJar, request, token);

      return redirectResponse(next);
    })
    .onBeforeHandle(async ({ request, cookie, set }) => {
      if (isLoginRequest(request)) {
        return;
      }

      if (
        options.db &&
        (await isValidSession(options.db, getCookie(cookie as AuthCookieJar)?.value))
      ) {
        return;
      }

      if (isApiRequest(request)) {
        return unauthorizedApiResponse(set);
      }

      return redirectResponse(getLoginRedirectPath(request));
    })
    .as("global");
}
