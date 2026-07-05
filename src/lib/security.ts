import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison of a provided webhook secret against the expected
 * value (FR-002). Length differences short-circuit (timingSafeEqual requires
 * equal-length buffers), which does not leak the secret's content.
 */
export function verifySecret(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * In-memory sliding-window rate limiter (FR-008).
 * Trade-off: per-instance state only — fine for a trial; swap for a shared
 * store (e.g. Upstash) behind the same interface in production.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  allow(key: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (recent.length >= this.maxRequests) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
