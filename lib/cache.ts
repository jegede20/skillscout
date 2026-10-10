/**
 * AI result cache + AI rate limiter.
 *
 * - When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, both are stored in
 *   Upstash Redis, so every serverless instance shares the same cache and rate-limit counters.
 * - Otherwise (local development, or if Upstash is unreachable) they fall back to in-memory
 *   maps. Memory is per-instance, so the limit is only approximate in that mode.
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '');
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REMOTE_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN);
const REMOTE_TIMEOUT_MS = 1500;

const LIMIT = 5;
const WINDOW_MS = 60_000;

type RedisReply = { result?: unknown; error?: string };

/** Runs a pipeline of Redis commands over the Upstash REST API. Throws on any failure. */
async function redisPipeline(commands: (string | number)[][]): Promise<RedisReply[]> {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  const replies = (await res.json()) as RedisReply[];
  const failed = replies.find((r) => r.error);
  if (failed) throw new Error(`Upstash error: ${failed.error}`);
  return replies;
}

// ---------- In-memory fallback ----------

type Entry<T> = { value: T; expiresAt: number };
const memoryStore = new Map<string, Entry<unknown>>();
const MAX_ENTRIES = 500;

function memoryGet<T>(key: string): T | undefined {
  const hit = memoryStore.get(key) as Entry<T> | undefined;
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return undefined;
  }
  return hit.value;
}

function memorySet<T>(key: string, value: T, ttlMs: number): void {
  if (memoryStore.size >= MAX_ENTRIES) {
    const oldest = memoryStore.keys().next().value;
    if (oldest !== undefined) memoryStore.delete(oldest);
  }
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const memoryHits = new Map<string, number[]>();

function memoryAllow(identifier: string): boolean {
  const now = Date.now();
  const recent = (memoryHits.get(identifier) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    memoryHits.set(identifier, recent);
    return false;
  }
  recent.push(now);
  memoryHits.set(identifier, recent);
  if (memoryHits.size > 5000) memoryHits.clear();
  return true;
}

// ---------- Public API ----------

/** Returns a cached value, or undefined if missing or expired. */
export async function cacheGet<T>(key: string): Promise<T | undefined> {
  if (REMOTE_ENABLED) {
    try {
      const [reply] = await redisPipeline([['GET', `cache:${key}`]]);
      if (typeof reply.result !== 'string') return undefined;
      return JSON.parse(reply.result) as T;
    } catch (err) {
      console.warn('[cache] Upstash read failed, using memory:', (err as Error).message);
    }
  }
  return memoryGet<T>(key);
}

/** Stores a value for ttlMs milliseconds. */
export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (REMOTE_ENABLED) {
    try {
      await redisPipeline([['SET', `cache:${key}`, JSON.stringify(value), 'PX', ttlMs]]);
      return;
    } catch (err) {
      console.warn('[cache] Upstash write failed, using memory:', (err as Error).message);
    }
  }
  memorySet(key, value, ttlMs);
}

/** Returns true if the caller may make an AI request now (fixed window, 5 per minute). */
export async function allowAIRequest(identifier: string): Promise<boolean> {
  if (REMOTE_ENABLED) {
    try {
      const bucket = Math.floor(Date.now() / WINDOW_MS);
      const key = `ratelimit:ai:${identifier}:${bucket}`;
      const [incr] = await redisPipeline([
        ['INCR', key],
        ['EXPIRE', key, Math.ceil(WINDOW_MS / 1000) + 5, 'NX'],
      ]);
      return Number(incr.result) <= LIMIT;
    } catch (err) {
      console.warn('[rate-limit] Upstash failed, using memory:', (err as Error).message);
    }
  }
  return memoryAllow(identifier);
}
