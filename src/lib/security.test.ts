import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifySecret, RateLimiter } from './security';

describe('verifySecret', () => {
  it('returns true for matching secrets', () => {
    expect(verifySecret('s3cret', 's3cret')).toBe(true);
  });

  it('returns false for mismatching secrets of same length', () => {
    expect(verifySecret('s3cret', 's3creT')).toBe(false);
  });

  it('returns false for length differences', () => {
    expect(verifySecret('short', 'a-much-longer-secret')).toBe(false);
  });

  it('returns false when provided is missing', () => {
    expect(verifySecret(null, 's3cret')).toBe(false);
    expect(verifySecret(undefined, 's3cret')).toBe(false);
    expect(verifySecret('', 's3cret')).toBe(false);
  });

  it('returns false when expected is not configured', () => {
    expect(verifySecret('anything', undefined)).toBe(false);
    expect(verifySecret('anything', '')).toBe(false);
  });
});

describe('RateLimiter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows up to maxRequests within the window', () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(false);
  });

  it('tracks keys independently', () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('b')).toBe(true);
    expect(limiter.allow('a')).toBe(false);
  });

  it('slides the window: old requests expire', () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.allow('ip')).toBe(true);
    vi.advanceTimersByTime(30_000);
    expect(limiter.allow('ip')).toBe(true);
    expect(limiter.allow('ip')).toBe(false);
    vi.advanceTimersByTime(31_000); // first request now outside window
    expect(limiter.allow('ip')).toBe(true);
  });
});
