/**
 * In-memory rate limiter for API routes. Limits by identifier (e.g. userId).
 * For production with multiple instances, consider @upstash/ratelimit with Redis.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function prune(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check rate limit for the given identifier. Returns null if allowed, or
 * { retryAfterSeconds } if rate limited.
 */
export function checkRateLimit(identifier: string): { retryAfterSeconds: number } | null {
  const now = Date.now();
  if (store.size > 10_000) prune();

  let entry = store.get(identifier);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(identifier, entry);
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { retryAfterSeconds };
  }
  return null;
}
