import type { IToken } from "@dtos/auth";
import { Admin } from "@models/admin";
import { COOKIE_NAME } from "@utils/cookies";
import { env } from "@utils/env";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

let _setupComplete: boolean | null = null;

export function resetSetupCache(): void {
  _setupComplete = null;
}

async function isSetupComplete(): Promise<boolean> {
  if (_setupComplete === true) return true;
  const count = await Admin.count();
  if (count > 0) _setupComplete = true;
  return count > 0;
}

function getSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("COOKIE_NAME="));
  if (!match) return undefined;
  return decodeURIComponent(match.trim().substring("COOKIE_NAME=".length));
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (!setupDone) {
      res.redirect("/setup");
      return;
    }

    const token = getSessionToken(req);
    if (!token) {
      res.redirect("/login");
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET as string) as IToken;
      req.user = decoded;
      res.locals.currentUser = { id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role };
      next();
    } catch {
      res.clearCookie("COOKIE_NAME");
      res.redirect("/login");
    }
  } catch {
    res.redirect("/login");
  }
};

export const requireSetupIncomplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (setupDone) {
      res.redirect("/login");
      return;
    }
    next();
  } catch {
    next();
  }
};

export const requireSetupComplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupDone = await isSetupComplete();
    if (!setupDone) {
      res.redirect("/setup");
      return;
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role ?? "")) {
      res.status(403).json({ statusCode: 403, message: "Acesso não autorizado" });
      return;
    }
    next();
  };
};
