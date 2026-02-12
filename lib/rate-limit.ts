/**
 * NFR-3: Rate limiting for auth endpoints
 * Max 5 attempts per IP per 15 minutes
 * Uses Redis when REDIS_URL is set (install ioredis for production); otherwise in-memory.
 */

import { RateLimiterMemory } from "rate-limiter-flexible";

const POINTS = 5;
const DURATION_SEC = 15 * 60;
const BLOCK_DURATION_SEC = 15 * 60;

let limiterInstance: RateLimiterMemory | import("rate-limiter-flexible").RateLimiterRedis | null = null;

async function getLimiter(): Promise<
  RateLimiterMemory | import("rate-limiter-flexible").RateLimiterRedis
> {
  if (limiterInstance) return limiterInstance;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const Redis = (await import("ioredis")).default;
      const { RateLimiterRedis } = await import("rate-limiter-flexible");
      const store = new Redis(redisUrl, { maxRetriesPerRequest: null });
      limiterInstance = new RateLimiterRedis({
        storeClient: store,
        keyPrefix: "pcc_rl",
        points: POINTS,
        duration: DURATION_SEC,
        blockDuration: BLOCK_DURATION_SEC,
      });
      return limiterInstance;
    } catch (e) {
      console.warn("[rate-limit] Redis unavailable, using in-memory limiter:", e);
    }
  }

  limiterInstance = new RateLimiterMemory({
    points: POINTS,
    duration: DURATION_SEC,
    blockDuration: BLOCK_DURATION_SEC,
  });
  return limiterInstance;
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  try {
    const rateLimiter = await getLimiter();
    await rateLimiter.consume(ip, 1);
    return { allowed: true };
  } catch (rateLimiterRes: unknown) {
    const msBeforeNext =
      typeof rateLimiterRes === "object" &&
      rateLimiterRes !== null &&
      "msBeforeNext" in rateLimiterRes &&
      typeof (rateLimiterRes as { msBeforeNext?: number }).msBeforeNext === "number"
        ? (rateLimiterRes as { msBeforeNext: number }).msBeforeNext
        : 0;
    const retryAfter = Math.ceil(msBeforeNext / 1000);
    return { allowed: false, retryAfter };
  }
}
