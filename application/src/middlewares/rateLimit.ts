import { AppError } from "@utils/appError";
import type { NextFunction, Request, Response } from "express";

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

function makeRateLimiter(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        statusCode: 429,
        message:
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
      });
      return;
    }

    entry.count++;
    next();
  };
}

// 5 attempts / 15 min — general auth endpoints (login, register, reset)
export const rateLimitAuth = makeRateLimiter(5, 15 * 60 * 1000);

// 3 attempts / 60 min — recovery endpoint (highest risk)
export const rateLimitRecovery = makeRateLimiter(3, 60 * 60 * 1000);

export const clearRateLimit = (req: Request) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  store.delete(`${ip}:${req.path}`);
};
