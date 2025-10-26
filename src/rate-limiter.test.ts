import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBucketRateLimiter } from './rate-limiter.js';

describe('TokenBucketRateLimiter', () => {
  let limiter: TokenBucketRateLimiter;

  beforeEach(() => {
    limiter = new TokenBucketRateLimiter(10); // 10 requests per second
  });

  it('should allow immediate requests when tokens are available', async () => {
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50); // Should be nearly instant
  });

  it('should allow multiple requests up to the limit', async () => {
    const start = Date.now();

    // Should allow 10 requests immediately
    for (let i = 0; i < 10; i++) {
      await limiter.acquire();
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100); // Should all be nearly instant
  });

  it('should throttle requests beyond the limit', async () => {
    const limiter2 = new TokenBucketRateLimiter(5); // 5 requests per second
    const start = Date.now();

    // First 5 should be instant
    for (let i = 0; i < 5; i++) {
      await limiter2.acquire();
    }

    // 6th request should wait
    await limiter2.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(100); // Should have waited
  });

  it('should refill tokens over time', async () => {
    const limiter3 = new TokenBucketRateLimiter(10);

    // Exhaust all tokens
    for (let i = 0; i < 10; i++) {
      await limiter3.acquire();
    }

    // Wait for some refill
    await new Promise((resolve) => setTimeout(resolve, 200));

    const start = Date.now();
    await limiter3.acquire(); // Should have refilled some tokens
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100); // Should be quick due to refill
  });

  it('should handle different rates correctly', async () => {
    const slowLimiter = new TokenBucketRateLimiter(1); // 1 request per second

    const start = Date.now();
    await slowLimiter.acquire(); // First is instant
    await slowLimiter.acquire(); // Second should wait ~1 second
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(900); // Should wait close to 1 second
  });
});
