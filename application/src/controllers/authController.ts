import { AuthServices } from "@services/authServices";
import { clearRateLimit } from "@middlewares/rateLimit";
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

export class AuthController {
  private readonly data: VerifyData;
  private readonly authServices: AuthServices;

  constructor() {
    this.data = new VerifyData();
    this.authServices = new AuthServices();
  }

  getSetupStatus = async (request: Request, response: Response) => {
    const result = await this.authServices.getSetupStatus();
    return response.status(200).json(result);
  };

  emailLogin = async (request: Request, response: Response) => {
    const credentials = this.data.verifyAuthRequest(request.body);
    const result = await this.authServices.emailLogin(credentials);

    clearRateLimit(request);
    response.cookie(COOKIE_NAME, result.data.token, setCookieOptions());

    return response.status(200).json({
      ...result,
      data: { admin: result.data.admin },
    });
  };

  setup = async (request: Request, response: Response) => {
    const parsed = this.data.verifySetup(request.body);
    const result = await this.authServices.setup(parsed);

    response.cookie(COOKIE_NAME, result.data.token, setCookieOptions());

    return response.status(201).json({
      ...result,
      data: { message: "Sistema configurado com sucesso" },
    });
  };

  register = async (request: Request, response: Response) => {
    const parsed = this.data.verifyRegister(request.body);
    const result = await this.authServices.register(parsed);
    return response.status(201).json(result);
  };

  resetPasswordWithMaster = async (request: Request, response: Response) => {
    const parsed = this.data.verifyResetWithMaster(request.body);
    const result = await this.authServices.resetPasswordWithMaster(parsed);
    return response.status(200).json(result);
  };

  resetMasterPassword = async (request: Request, response: Response) => {
    const parsed = this.data.verifyRecovery(request.body);
    const result = await this.authServices.resetMasterPassword(parsed);
    return response.status(200).json(result);
  };

  logout = async (request: Request, response: Response) => {
    response.clearCookie(COOKIE_NAME, { path: "/" });
    return response.redirect("/login");
  };
}
