import crypto from "node:crypto";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { sessionStore } from "./session.store";

/** Name of the HTTP-only cookie that stores the raw session token. */
const SESSION_COOKIE = "session_token";

/** Session lifetime in seconds (7 days). */
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

/**
 * Hash a raw session token with SHA-256.
 * Only the hash is ever persisted; the raw token lives in the cookie.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new session for the given subject and set the session cookie.
 *
 * - Generates a random 32-byte token.
 * - Stores only its SHA-256 hash in the session store.
 * - Sets an HTTP-only, `SameSite=Lax` cookie (secure in production).
 *
 * @param subject - The subject (user/service) the session belongs to.
 */
export async function createSession(subject: { type: string; id: string }) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await sessionStore.create({
    tokenHash,
    subject,
    expiresAt,
  });

  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Resolve the current session from the request cookie.
 *
 * Returns `null` if there is no cookie, or if the stored session is
 * missing/expired. In the latter case the cookie is cleared.
 */
export async function getSession() {
  const token = getCookie(SESSION_COOKIE);

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = await sessionStore.get(tokenHash);

  if (!session) {
    deleteCookie(SESSION_COOKIE, {
      path: "/",
    });

    return null;
  }

  return session;
}

/**
 * Destroy the current session.
 *
 * Deletes the session from the store (if a cookie is present) and
 * always clears the session cookie.
 */
export async function destroySession() {
  const token = getCookie(SESSION_COOKIE);

  if (token) {
    const tokenHash = hashToken(token);

    await sessionStore.delete(tokenHash);
  }

  deleteCookie(SESSION_COOKIE, {
    path: "/",
  });
}
