import { clearRateLimit } from "@middlewares/rateLimit";
import { AuthServices } from "@services/authServices";
import { env } from "@utils/env";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";

const COOKIE_NAME = "aero_session";

function setCookieOptions() {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    secure: isProduction,
    maxAge: env.JWT_EXPIRES_IN * 1000,
    path: "/",
  };
}

function getBaseUrl(): string {
  return env.APP_URL;
}

export class AuthController {
  private readonly data: VerifyData;
  private readonly authServices: AuthServices;

  constructor() {
    this.data = new VerifyData();
    this.authServices = new AuthServices();
  }

  getSetupStatus = async (req: Request, res: Response) => {
    const result = await this.authServices.getSetupStatus();
    return res.status(200).json(result);
  };

  setup = async (req: Request, res: Response) => {
    const parsed = this.data.verifySetup(req.body);
    const result = await this.authServices.setup(parsed);
    res.cookie(COOKIE_NAME, result.data.token, setCookieOptions());
    return res.status(201).json({ ...result, data: { message: "Sistema configurado com sucesso" } });
  };

  login = async (req: Request, res: Response) => {
    const credentials = this.data.verifyAuthRequest(req.body);
    const result = await this.authServices.login(credentials);
    clearRateLimit(req);
    res.cookie(COOKIE_NAME, result.data.token, setCookieOptions());
    return res.status(200).json({ ...result, data: { admin: result.data.admin } });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = this.data.verifyEmail(req.body);
    const result = await this.authServices.forgotPassword(email, getBaseUrl());
    return res.status(200).json(result);
  };

  resetPassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyResetPassword(req.body);
    const result = await this.authServices.resetPassword(parsed.token, parsed.password);
    return res.status(200).json(result);
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return res.redirect("/login");
  };
}
