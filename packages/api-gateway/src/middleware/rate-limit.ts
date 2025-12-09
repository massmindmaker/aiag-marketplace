import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { GatewayEnv, GatewayHonoContext, RateLimitResult } from '../types';

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: Date }>;
  get(key: string): Promise<{ count: number; resetAt: Date } | null>;
}

// In-memory store for development (use Redis in production)
class InMemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetAt: Date }>();

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: Date }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt.getTime() > now) {
      existing.count++;
      return existing;
    }

    const entry = {
      count: 1,
      resetAt: new Date(now + windowMs),
    };
    this.store.set(key, entry);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return entry;
  }

  async get(key: string): Promise<{ count: number; resetAt: Date } | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt.getTime() < Date.now()) {
      return null;
    }
    return entry;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetAt.getTime() < now) {
        this.store.delete(key);
      }
    }
  }
}

export interface RateLimitOptions {
  store?: RateLimitStore;
  defaultRequestsPerMinute?: number;
  defaultRequestsPerDay?: number;
  keyGenerator?: (ctx: GatewayHonoContext) => string;
}

const defaultOptions: Required<RateLimitOptions> = {
  store: new InMemoryRateLimitStore(),
  defaultRequestsPerMinute: 60,
  defaultRequestsPerDay: 10000,
  keyGenerator: (ctx) => {
    const gateway = ctx.get('gateway');
    return gateway?.apiKey?.id || 'anonymous';
  },
};

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(options: RateLimitOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return createMiddleware<GatewayEnv>(async (ctx, next) => {
    const gateway = ctx.get('gateway');
    const key = opts.keyGenerator(ctx as GatewayHonoContext);

    // Get rate limits from API key or use defaults
    const requestsPerMinute = gateway?.apiKey?.rateLimits?.requestsPerMinute || opts.defaultRequestsPerMinute;
    const requestsPerDay = gateway?.apiKey?.rateLimits?.requestsPerDay || opts.defaultRequestsPerDay;

    // Check per-minute limit
    const minuteKey = `rate:minute:${key}`;
    const minuteResult = await opts.store.increment(minuteKey, 60 * 1000);

    if (minuteResult.count > requestsPerMinute) {
      ctx.header('X-RateLimit-Limit', requestsPerMinute.toString());
      ctx.header('X-RateLimit-Remaining', '0');
      ctx.header('X-RateLimit-Reset', minuteResult.resetAt.toISOString());
      ctx.header('Retry-After', Math.ceil((minuteResult.resetAt.getTime() - Date.now()) / 1000).toString());

      throw new HTTPException(429, {
        message: 'Rate limit exceeded. Please wait before making more requests.',
      });
    }

    // Check per-day limit
    const dayKey = `rate:day:${key}`;
    const dayResult = await opts.store.increment(dayKey, 24 * 60 * 60 * 1000);

    if (dayResult.count > requestsPerDay) {
      ctx.header('X-RateLimit-Limit', requestsPerDay.toString());
      ctx.header('X-RateLimit-Remaining', '0');
      ctx.header('X-RateLimit-Reset', dayResult.resetAt.toISOString());
      ctx.header('Retry-After', Math.ceil((dayResult.resetAt.getTime() - Date.now()) / 1000).toString());

      throw new HTTPException(429, {
        message: 'Daily rate limit exceeded. Please try again tomorrow.',
      });
    }

    // Set rate limit headers
    ctx.header('X-RateLimit-Limit', requestsPerMinute.toString());
    ctx.header('X-RateLimit-Remaining', Math.max(0, requestsPerMinute - minuteResult.count).toString());
    ctx.header('X-RateLimit-Reset', minuteResult.resetAt.toISOString());

    await next();
  });
}

/**
 * Check rate limit without incrementing (for checking status)
 */
export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const result = await store.get(`rate:${key}`);

  if (!result) {
    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(Date.now() + windowMs),
      limit,
    };
  }

  const remaining = Math.max(0, limit - result.count);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: result.resetAt,
    limit,
  };
}
