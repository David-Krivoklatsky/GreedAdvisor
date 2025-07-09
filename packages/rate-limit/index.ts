import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

export function rateLimit(req: NextRequest): {
  success: boolean;
  remaining?: number;
} {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { success: false };
  }

  entry.count++;
  return { success: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

// Clean up expired entries periodically
setInterval(
  () => {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [ip, entry] of entries) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  },
  5 * 60 * 1000
); // Clean up every 5 minutes

export default rateLimit;
