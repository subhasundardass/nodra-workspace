/**
 * Redis-backed session management.
 *
 * Replaces the earlier stateless JWT implementation. A session is an opaque,
 * random token handed to the client (normally in an HTTP-only cookie); the
 * server only ever stores a SHA-256 hash of that token. Because the state
 * lives in Redis, sessions can be revoked instantly (logout, "log out
 * everywhere", password change) — something a signed JWT cannot do.
 *
 * This module is transport-agnostic: it never touches cookies or headers
 * directly. The consuming app reads the raw token from the request
 * (see `extractSessionToken`) and calls `SessionManager`.
 *
 * Redis layout:
 *   session:<tokenHash>             JSON payload, with TTL
 *   user-sessions:<type>:<id>       SET of token hashes for one subject
 */
import crypto from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { AuthenticationError } from "../core/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionSubject {
  /** Kind of principal, e.g. "USER" or "SERVICE". */
  type: string;
  /** Principal identifier (for users: the User doctype name). */
  id: string;
}

export interface Session {
  /** SHA-256 hash of the session token (the raw token is never stored). */
  tokenHash: string;
  subject: SessionSubject;
  /** Absolute expiry. */
  expiresAt: Date;
  createdAt: Date;
  /** Free-form, JSON-serialisable data (e.g. IP / user agent at login). */
  data?: Record<string, unknown>;
}

export interface SessionStore {
  /** Persist a session. No-op if it is already expired. */
  create(session: Session): Promise<void>;
  /** Look up by token hash. `null` if missing, expired or malformed. */
  get(tokenHash: string): Promise<Session | null>;
  /** Push the absolute expiry of an existing session. */
  touch(tokenHash: string, expiresAt: Date): Promise<void>;
  /** Delete one session. */
  delete(tokenHash: string): Promise<void>;
  /** Delete every session of a subject ("log out everywhere"). */
  deleteBySubject(subject: SessionSubject): Promise<void>;
  /** Release underlying connections. */
  close?(): Promise<void>;
}

export interface SessionConfig {
  /** Session lifetime in seconds. */
  ttlSeconds: number;
  /**
   * Sliding expiration: when a session has less than half of its lifetime
   * left, `resolve()` extends it back to the full TTL. Default: true.
   */
  sliding?: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  ttlSeconds: 60 * 60 * 24 * 7,
  sliding: true,
};

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/** SHA-256 of a raw session token — the only form that is persisted. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** 256 bits of randomness, hex encoded. */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Pull a session token out of a request.
 *
 * Looks at the `Authorization: Bearer <token>` header first (API clients),
 * then at the named cookie (browsers).
 */
export function extractSessionToken(
  headers: { get(name: string): string | null | undefined },
  cookieName = "session_token",
): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const [scheme, value, ...rest] = auth.split(" ");
    if (scheme === "Bearer" && value && rest.length === 0) {
      return value;
    }
  }

  const cookieHeader = headers.get("cookie");
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const idx = part.indexOf("=");
      if (idx === -1) continue;
      if (part.slice(0, idx).trim() === cookieName) {
        const value = part.slice(idx + 1).trim();
        try {
          return value ? decodeURIComponent(value) : null;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Session manager
// ---------------------------------------------------------------------------

export class SessionManager {
  constructor(
    private readonly store: SessionStore,
    private readonly config: SessionConfig = DEFAULT_SESSION_CONFIG,
  ) {}

  get ttlSeconds(): number {
    return this.config.ttlSeconds;
  }

  /** Create a session. Returns the raw token — hand it to the client once. */
  async create(
    subject: SessionSubject,
    data?: Record<string, unknown>,
  ): Promise<{ token: string; session: Session }> {
    const token = generateSessionToken();
    const now = Date.now();
    const session: Session = {
      tokenHash: hashToken(token),
      subject,
      createdAt: new Date(now),
      expiresAt: new Date(now + this.config.ttlSeconds * 1000),
      data,
    };
    await this.store.create(session);
    return { token, session };
  }

  /** Resolve a raw token to a live session, or `null`. */
  async resolve(token: string | null | undefined): Promise<Session | null> {
    if (!token) return null;

    const tokenHash = hashToken(token);
    const session = await this.store.get(tokenHash);
    if (!session) return null;

    if (this.config.sliding !== false) {
      const remainingMs = session.expiresAt.getTime() - Date.now();
      if (remainingMs < (this.config.ttlSeconds * 1000) / 2) {
        const expiresAt = new Date(Date.now() + this.config.ttlSeconds * 1000);
        await this.store.touch(tokenHash, expiresAt);
        session.expiresAt = expiresAt;
      }
    }

    return session;
  }

  /** Like `resolve()` but throws `AuthenticationError` when there is none. */
  async require(token: string | null | undefined): Promise<Session> {
    const session = await this.resolve(token);
    if (!session) {
      throw new AuthenticationError("Session is missing or has expired");
    }
    return session;
  }

  async destroy(token: string | null | undefined): Promise<void> {
    if (!token) return;
    await this.store.delete(hashToken(token));
  }

  async destroyAll(subject: SessionSubject): Promise<void> {
    await this.store.deleteBySubject(subject);
  }
}

// ---------------------------------------------------------------------------
// Redis store
// ---------------------------------------------------------------------------

interface StoredSession {
  tokenHash: string;
  subject: SessionSubject;
  expiresAt: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

export class RedisSessionStore implements SessionStore {
  private readonly client: RedisClientType;
  private connecting: Promise<void> | null = null;

  constructor(
    url = process.env.REDIS_URL ?? "redis://localhost:6379",
    private readonly keyPrefix = "",
  ) {
    this.client = createClient({
      url,
      socket: {
        connectTimeout: 5_000,
        // Retry a few times, then give up so callers get an error instead of
        // hanging forever while Redis is down. `getClient()` reconnects
        // lazily on the next call, so a later Redis restart still recovers.
        reconnectStrategy: (retries) =>
          retries >= 3 ? new Error("Redis unavailable") : (retries + 1) * 200,
      },
    });
    this.client.on("error", (error) => {
      console.error("[Redis] Client error:", error);
    });
  }

  /**
   * Lazily connect. While the socket is open (connected or reconnecting)
   * commands are queued by node-redis, so just reuse the client; otherwise
   * start one shared connect().
   */
  private async getClient(): Promise<RedisClientType> {
    if (this.client.isOpen) return this.client;

    if (!this.connecting) {
      this.connecting = this.client
        .connect()
        .then(() => undefined)
        .finally(() => {
          this.connecting = null;
        });
    }
    await this.connecting;
    return this.client;
  }

  private sessionKey(tokenHash: string): string {
    return `${this.keyPrefix}session:${tokenHash}`;
  }

  private subjectKey(subject: SessionSubject): string {
    return `${this.keyPrefix}user-sessions:${subject.type}:${subject.id}`;
  }

  private parse(value: string): Session | null {
    try {
      const data = JSON.parse(value) as StoredSession;
      return {
        tokenHash: data.tokenHash,
        subject: data.subject,
        expiresAt: new Date(data.expiresAt),
        createdAt: new Date(data.createdAt ?? data.expiresAt),
        data: data.data,
      };
    } catch {
      return null;
    }
  }

  private serialise(session: Session): string {
    const stored: StoredSession = {
      tokenHash: session.tokenHash,
      subject: session.subject,
      expiresAt: session.expiresAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      data: session.data,
    };
    return JSON.stringify(stored);
  }

  async create(session: Session): Promise<void> {
    const ttl = Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000);
    if (ttl <= 0) return;

    const client = await this.getClient();
    const subjectKey = this.subjectKey(session.subject);

    await client
      .multi()
      .set(this.sessionKey(session.tokenHash), this.serialise(session), {
        EX: ttl,
      })
      .sAdd(subjectKey, session.tokenHash)
      // Index outlives its newest session by a day so stale entries vanish.
      .expire(subjectKey, ttl + 86_400)
      .exec();
  }

  async get(tokenHash: string): Promise<Session | null> {
    const client = await this.getClient();
    const value = await client.get(this.sessionKey(tokenHash));
    if (!value) return null;

    const session = this.parse(value);
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      await this.delete(tokenHash);
      return null;
    }
    return session;
  }

  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    const client = await this.getClient();
    const key = this.sessionKey(tokenHash);
    const value = await client.get(key);
    if (!value) return;

    const session = this.parse(value);
    if (!session) return;

    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
    if (ttl <= 0) return;

    session.expiresAt = expiresAt;
    const subjectKey = this.subjectKey(session.subject);

    await client
      .multi()
      .set(key, this.serialise(session), { EX: ttl, XX: true })
      .expire(subjectKey, ttl + 86_400)
      .exec();
  }

  async delete(tokenHash: string): Promise<void> {
    const client = await this.getClient();
    const key = this.sessionKey(tokenHash);
    const value = await client.get(key);
    if (!value) return;

    const session = this.parse(value);
    const multi = client.multi().del(key);
    if (session) multi.sRem(this.subjectKey(session.subject), tokenHash);
    await multi.exec();
  }

  async deleteBySubject(subject: SessionSubject): Promise<void> {
    const client = await this.getClient();
    const subjectKey = this.subjectKey(subject);
    const hashes = await client.sMembers(subjectKey);

    const multi = client.multi();
    for (const hash of hashes) multi.del(this.sessionKey(hash));
    multi.del(subjectKey);
    await multi.exec();
  }

  async close(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}

// ---------------------------------------------------------------------------
// In-memory store (tests / local experiments — NOT for production)
// ---------------------------------------------------------------------------

export class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  async create(session: Session): Promise<void> {
    if (session.expiresAt.getTime() <= Date.now()) return;
    this.sessions.set(session.tokenHash, { ...session });
  }

  async get(tokenHash: string): Promise<Session | null> {
    const session = this.sessions.get(tokenHash);
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      this.sessions.delete(tokenHash);
      return null;
    }
    return { ...session };
  }

  async touch(tokenHash: string, expiresAt: Date): Promise<void> {
    const session = this.sessions.get(tokenHash);
    if (session) session.expiresAt = expiresAt;
  }

  async delete(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }

  async deleteBySubject(subject: SessionSubject): Promise<void> {
    for (const [hash, s] of this.sessions) {
      if (s.subject.type === subject.type && s.subject.id === subject.id) {
        this.sessions.delete(hash);
      }
    }
  }
}
