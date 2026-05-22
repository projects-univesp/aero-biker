import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";

import {
  rateLimitAuth,
  rateLimitRecovery,
  clearRateLimit,
} from "../../src/middlewares/rateLimit";

// Each test uses a unique path to prevent store state leakage across tests.
// The rate-limit store is module-level and persists within a test run.
let pathSeq = 0;
const nextPath = () => `/test-rl-${++pathSeq}`;

function makeReq(path: string, ip = "10.0.0.1"): Partial<Request> {
  return { ip, path, socket: { remoteAddress: ip } } as any;
}

function makeRes(): {
  setHeader: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
} {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res); // allow res.status(429).json(...)
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// rateLimitAuth — 5 attempts / 15 min
// ─────────────────────────────────────────────────────────────────────────────

describe("rateLimitAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Must allow requests while under the attempt limit", () => {
    const path = nextPath();
    const req = makeReq(path);
    const res = makeRes();
    const next = vi.fn();

    for (let i = 0; i < 5; i++) {
      rateLimitAuth(req as Request, res as unknown as Response, next as NextFunction);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("Must return 429 after exceeding 5 attempts", () => {
    const path = nextPath();
    const req = makeReq(path);
    const res = makeRes();
    const next = vi.fn();

    for (let i = 0; i < 6; i++) {
      rateLimitAuth(req as Request, res as unknown as Response, next as NextFunction);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledOnce();
  });

  it("Must set Retry-After header on 429 response", () => {
    const path = nextPath();
    const req = makeReq(path);
    const res = makeRes();
    const next = vi.fn();

    for (let i = 0; i < 6; i++) {
      rateLimitAuth(req as Request, res as unknown as Response, next as NextFunction);
    }

    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(Number));
  });

  it("Must isolate rate limits by IP address", () => {
    const path = nextPath();
    const res = makeRes();
    const next = vi.fn();

    const reqA = makeReq(path, "10.1.1.1");
    const reqB = makeReq(path, "10.1.1.2");

    // Exhaust limit for IP A
    for (let i = 0; i < 6; i++) {
      rateLimitAuth(reqA as Request, res as unknown as Response, next as NextFunction);
    }
    const callsAfterA = next.mock.calls.length; // 5

    // IP B should still be allowed on same path
    rateLimitAuth(reqB as Request, res as unknown as Response, next as NextFunction);

    expect(next.mock.calls.length).toBe(callsAfterA + 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rateLimitRecovery — stricter: 3 attempts / 60 min
// ─────────────────────────────────────────────────────────────────────────────

describe("rateLimitRecovery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Must block after 3 attempts (stricter than auth limit)", () => {
    const path = nextPath();
    const req = makeReq(path);
    const res = makeRes();
    const next = vi.fn();

    for (let i = 0; i < 4; i++) {
      rateLimitRecovery(req as Request, res as unknown as Response, next as NextFunction);
    }

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearRateLimit
// ─────────────────────────────────────────────────────────────────────────────

describe("clearRateLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Must reset the counter so requests are allowed again after clearing", () => {
    const path = nextPath();
    const req = makeReq(path);
    const res = makeRes();
    const next = vi.fn();

    // Exhaust the limit
    for (let i = 0; i < 6; i++) {
      rateLimitAuth(req as Request, res as unknown as Response, next as NextFunction);
    }
    expect(next).toHaveBeenCalledTimes(5); // 6th was blocked

    // Clear the rate limit for this IP+path
    clearRateLimit(req as Request);

    vi.clearAllMocks();
    res.status.mockReturnValue(res);

    // Should be allowed again after clear
    rateLimitAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
