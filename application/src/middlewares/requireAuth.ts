import type { IToken } from "@dtos/auth";
import { SystemConfig } from "@models/systemConfig";
import { env } from "@utils/env";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

function getSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("aero_session="));
  if (!match) return undefined;
  return decodeURIComponent(match.trim().substring("aero_session=".length));
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await SystemConfig.findOne();

    if (!config?.setupCompleted) {
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
      res.locals.currentUser = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch {
      res.clearCookie("aero_session");
      res.redirect("/login");
    }
  } catch {
    res.redirect("/login");
  }
};

export const requireSetupIncomplete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await SystemConfig.findOne();
    if (config?.setupCompleted) {
      res.redirect("/login");
      return;
    }
    next();
  } catch {
    next();
  }
};

export const requireSetupComplete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = await SystemConfig.findOne();
    if (!config?.setupCompleted) {
      res.redirect("/setup");
      return;
    }
    next();
  } catch {
    next();
  }
};
