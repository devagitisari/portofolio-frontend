import { ApiError } from "./errors";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Rate limiter for the public endpoints (login / contact / analytics).
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are configured (recommended on Vercel, where the filesystem is ephemeral),
 * and falls back to an in-memory counter otherwise.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const bucket = `ratelimit:${key}`;

  if (await limitWithUpstash(bucket, limit, windowSeconds)) {
    return;
  }

  const now = Date.now();
  const entry = buckets.get(bucket);

  if (!entry || entry.resetAt <= now) {
    buckets.set(bucket, { count: 1, resetAt: now + windowSeconds * 1000 });

    // Keep the map from growing forever on long-lived instances.
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }
    return;
  }

  entry.count += 1;

  if (entry.count > limit) {
    throw ApiError.tooManyRequests("Too Many Attempts.");
  }
}

/** Returns true when the request was handled by Upstash (allow or reject). */
async function limitWithUpstash(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) return false;

    const result = (await response.json()) as Array<{ result?: number | string }>;
    const count = Number(result?.[0]?.result ?? 0);

    if (count > limit) {
      throw ApiError.tooManyRequests("Too Many Attempts.");
    }

    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Fail open: never block a request because the limiter is unavailable.
    return false;
  }
}

/** Best-effort client IP, honouring Vercel's proxy headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return headers.get("x-real-ip") ?? headers.get("x-vercel-forwarded-for") ?? "127.0.0.1";
}
