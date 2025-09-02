// src/middlewares/rateLimit.ts
import type { Request, Response, NextFunction } from 'express';

// Note: this in-memory store resets if you restart the server and is per-process.
// For production, swap the Map for Redis so it’s durable and shared across instances.

type KeyGen = (req: Request) => string;

interface Options {
  windowMs: number;
  max: number;
  keyGenerator: KeyGen;  // how to compute the bucket key
}

type Counter = { count: number; resetAt: number };

const store = new Map<string, Counter>();

export function rateLimit(opts: Options) {
  const { windowMs, max, keyGenerator } = opts;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      // new window
      store.set(key, { count: 1, resetAt: now + windowMs });
      setHeaders(res, max, max - 1, now + windowMs);
      return next();
    }

    if (entry.count >= max) {
      setHeaders(res, max, 0, entry.resetAt);
      return res.status(429).json({ code: 'RATE_LIMIT' });
    }

    entry.count += 1;
    setHeaders(res, max, Math.max(0, max - entry.count), entry.resetAt);
    return next();
  };
}

function setHeaders(res: Response, limit: number, remaining: number, resetAtMs: number) {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000))); // unix ts
}
