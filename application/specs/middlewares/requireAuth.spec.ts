import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";

import {
  requireAuth,
  requireSetupComplete,
  requireSetupIncomplete,
} from "../../src/middlewares/requireAuth";
import { SystemConfig } from "../../src/models/systemConfig";
import jwt from "jsonwebtoken";

vi.mock("@models/systemConfig");
vi.mock("jsonwebtoken");

const mockEnv = vi.hoisted(() => ({ JWT_SECRET: "test-secret-key", NODE_ENV: "test" }));
vi.mock("@utils/env", () => ({ env: mockEnv }));
vi.mock("@utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), silly: vi.fn(), trace: vi.fn(), fatal: vi.fn() },
}));

function makeReq(cookie?: string): Partial<Request> {
  return {
    headers: { cookie },
    user: undefined,
  };
}

function makeRes(): {
  redirect: ReturnType<typeof vi.fn>;
  clearCookie: ReturnType<typeof vi.fn>;
  locals: Record<string, unknown>;
} {
  return {
    redirect: vi.fn(),
    clearCookie: vi.fn(),
    locals: {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth
// ─────────────────────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it("Must call next() when setup is complete and token is valid", async () => {
    const fakeDecoded = {
      id: "user-123",
      name: "Jorge",
      email: "jorge@studio.com",
      role: "ADMIN",
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);
    vi.mocked(jwt.verify).mockReturnValue(fakeDecoded as any);

    const req = makeReq("aero_session=valid-token");
    const res = makeRes();

    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("Must set res.locals.currentUser with decoded token data", async () => {
    const fakeDecoded = {
      id: "user-123",
      name: "Jorge",
      email: "jorge@studio.com",
      role: "OWNER",
    };

    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);
    vi.mocked(jwt.verify).mockReturnValue(fakeDecoded as any);

    const req = makeReq("aero_session=valid-token");
    const res = makeRes();

    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.locals.currentUser).toMatchObject({
      id: "user-123",
      name: "Jorge",
      email: "jorge@studio.com",
      role: "OWNER",
    });
  });

  it("Must redirect to /login when token is invalid", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    const req = makeReq("aero_session=invalid-token");
    const res = makeRes();

    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("Must redirect to /login when no cookie is present", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);

    const req = makeReq(undefined);
    const res = makeRes();

    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("Must redirect to /setup when system is not configured yet", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);

    const req = makeReq("aero_session=any-token");
    const res = makeRes();

    await requireAuth(req as Request, res as unknown as Response, next as NextFunction);

    expect(res.redirect).toHaveBeenCalledWith("/setup");
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireSetupIncomplete
// ─────────────────────────────────────────────────────────────────────────────

describe("requireSetupIncomplete", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it("Must redirect to /login when setup is already complete", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);

    const req = makeReq();
    const res = makeRes();

    await requireSetupIncomplete(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("Must call next() when setup is not yet complete", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);

    const req = makeReq();
    const res = makeRes();

    await requireSetupIncomplete(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// requireSetupComplete
// ─────────────────────────────────────────────────────────────────────────────

describe("requireSetupComplete", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  it("Must call next() when setup is complete", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue({
      setupCompleted: true,
    } as any);

    const req = makeReq();
    const res = makeRes();

    await requireSetupComplete(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("Must redirect to /setup when system is not configured yet", async () => {
    vi.mocked(SystemConfig.findOne).mockResolvedValue(null);

    const req = makeReq();
    const res = makeRes();

    await requireSetupComplete(
      req as Request,
      res as unknown as Response,
      next as NextFunction,
    );

    expect(res.redirect).toHaveBeenCalledWith("/setup");
    expect(next).not.toHaveBeenCalled();
  });
});
