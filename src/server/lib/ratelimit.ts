import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

import { env } from "~/env";

// In-memory fallback so the app still works when Upstash credentials are not
// configured (e.g. local dev before env vars are set). Not shared across
// serverless instances — swap in Upstash for production.
class MemoryLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  async limit(identifier: string): Promise<{ success: boolean }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(identifier) ?? []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= this.max) {
      return { success: false };
    }

    timestamps.push(now);
    this.hits.set(identifier, timestamps);
    return { success: true };
  }
}

const hasUpstash = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

type RateLimiter = {
  limit(identifier: string): Promise<{ success: boolean }>;
};

function createLimiter(limit: number, windowSeconds: number): RateLimiter {
  if (hasUpstash) {
    return new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "devshub",
    });
  }
  return new MemoryLimiter(limit, windowSeconds * 1000);
}

export const postLimiter = createLimiter(5, 600);
export const commentLimiter = createLimiter(20, 600);
export const voteLimiter = createLimiter(100, 600);

export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string,
): Promise<void> {
  const { success } = await limiter.limit(identifier);
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "You're doing that too often. Please slow down and try again.",
    });
  }
}
