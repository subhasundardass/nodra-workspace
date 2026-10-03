import { createClient, type RedisClientType } from "redis";

/**
 * A single user session.
 */
export interface Session {
  /** Hash of the session token (never the raw token). */
  tokenHash: string;

  /** The subject (user/service) this session belongs to. */
  subject: {
    type: string;
    id: string;
  };

  /** Absolute expiration time of the session. */
  expiresAt: Date;
}

/**
 * Storage abstraction for sessions.
 */
export interface SessionStore {
  /**
   * Persist a new session.
   * No-op if `session.expiresAt` is already in the past.
   */
  create(session: Session): Promise<void>;

  /**
   * Look up a session by token hash.
   * Returns `null` if missing, expired, or malformed.
   */
  get(tokenHash: string): Promise<Session | null>;

  /**
   * Delete a single session and remove it from its subject index.
   */
  delete(tokenHash: string): Promise<void>;

  /**
   * Delete all sessions belonging to a subject
   * (e.g. "log out everywhere").
   */
  deleteBySubject(subject: { type: string; id: string }): Promise<void>;
}

/**
 * Redis-backed `SessionStore`.
 *
 * Storage layout:
 * - `session:<tokenHash>`              -> JSON session payload (with TTL)
 * - `user-sessions:<type>:<id>`        -> SET of token hashes for a subject
 *
 * The subject index is given a TTL slightly longer than the session
 * itself so stale entries eventually disappear.
 */
class RedisSessionStore implements SessionStore {
  private client: RedisClientType;
  private connecting: Promise<void> | null = null;

  constructor(url = process.env.REDIS_URL ?? "redis://localhost:6379") {
    this.client = createClient({
      url,
    });

    this.client.on("error", (error) => {
      console.error("[Redis] Client error:", error);
    });
  }

  /**
   * Returns a connected client, connecting lazily on first use.
   * Concurrent callers share the same in-flight connection promise.
   */
  private async getClient() {
    if (this.client.isReady) {
      return this.client;
    }

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

  /** Redis key for a session payload. */
  private sessionKey(tokenHash: string) {
    return `session:${tokenHash}`;
  }

  /** Redis key for a subject's set of session token hashes. */
  private subjectKey(subject: { type: string; id: string }) {
    return `user-sessions:${subject.type}:${subject.id}`;
  }

  async create(session: Session): Promise<void> {
    const client = await this.getClient();

    const now = Date.now();
    const expiresAt = session.expiresAt.getTime();

    const ttlSeconds = Math.ceil((expiresAt - now) / 1000);

    if (ttlSeconds <= 0) {
      return;
    }

    const sessionKey = this.sessionKey(session.tokenHash);
    const subjectKey = this.subjectKey(session.subject);

    const value = JSON.stringify({
      tokenHash: session.tokenHash,
      subject: session.subject,
      expiresAt: session.expiresAt.toISOString(),
    });

    const multi = client.multi();

    multi.set(sessionKey, value, {
      EX: ttlSeconds,
    });

    multi.sAdd(subjectKey, session.tokenHash);

    /*
     * The subject index itself doesn't contain expiration
     * automatically. Give it a TTL slightly longer than the
     * session so stale entries don't remain forever.
     */
    multi.expire(subjectKey, ttlSeconds + 86400);

    await multi.exec();
  }

  async get(tokenHash: string): Promise<Session | null> {
    const client = await this.getClient();

    const value = await client.get(this.sessionKey(tokenHash));

    if (!value) {
      return null;
    }

    try {
      const data = JSON.parse(value) as {
        tokenHash: string;
        subject: {
          type: string;
          id: string;
        };
        expiresAt: string;
      };

      const expiresAt = new Date(data.expiresAt);

      /*
       * Redis TTL normally handles this, but this check protects
       * against an invalid/stale value.
       */
      if (expiresAt.getTime() <= Date.now()) {
        await this.delete(tokenHash);
        return null;
      }

      return {
        tokenHash: data.tokenHash,
        subject: data.subject,
        expiresAt,
      };
    } catch {
      /*
       * Invalid Redis data should never become a valid session.
       */
      await this.delete(tokenHash);
      return null;
    }
  }

  async delete(tokenHash: string): Promise<void> {
    const client = await this.getClient();

    const sessionKey = this.sessionKey(tokenHash);

    /*
     * First retrieve the session so we know which subject index
     * needs to be updated.
     */
    const value = await client.get(sessionKey);

    if (!value) {
      return;
    }

    let session: Session;

    try {
      const data = JSON.parse(value) as {
        tokenHash: string;
        subject: {
          type: string;
          id: string;
        };
        expiresAt: string;
      };

      session = {
        tokenHash: data.tokenHash,
        subject: data.subject,
        expiresAt: new Date(data.expiresAt),
      };
    } catch {
      await client.del(sessionKey);
      return;
    }

    const subjectKey = this.subjectKey(session.subject);

    const multi = client.multi();

    multi.del(sessionKey);
    multi.sRem(subjectKey, tokenHash);

    await multi.exec();
  }

  async deleteBySubject(subject: { type: string; id: string }): Promise<void> {
    const client = await this.getClient();

    const subjectKey = this.subjectKey(subject);

    const tokenHashes = await client.sMembers(subjectKey);

    if (tokenHashes.length === 0) {
      await client.del(subjectKey);
      return;
    }

    const multi = client.multi();

    for (const tokenHash of tokenHashes) {
      multi.del(this.sessionKey(tokenHash));
    }

    multi.del(subjectKey);

    await multi.exec();
  }
}

/** Shared singleton instance using `REDIS_URL` (or localhost by default). */
export const sessionStore = new RedisSessionStore();
