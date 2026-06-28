import { clearRateLimit } from "@middlewares/rateLimit";
import { AuthServices } from "@services/authServices";
import { env } from "@utils/env";
import { VerifyData } from "@utils/zod";
import type { Request, Response } from "express";
import { COOKIE_NAME, getBaseUrl, getCookieOptions } from "@utils/cookies";

export class AuthController {
  private readonly data: VerifyData;
  private readonly authServices: AuthServices;

  constructor() {
    this.data = new VerifyData();
    this.authServices = new AuthServices();
  }

  setup = async (req: Request, res: Response) => {
    const parsed = this.data.verifySetup(req.body);
    const result = await this.authServices.setup(parsed);
    res.cookie(COOKIE_NAME, result.data.token, getCookieOptions());

    return res
      .status(201)
      .json({
        ...result,
        data: { message: "Sistema configurado com sucesso" },
      });
  };

  login = async (req: Request, res: Response) => {
    const credentials = this.data.verifyAuthRequest(req.body);
    const result = await this.authServices.login(credentials);
    clearRateLimit(req);
    res.cookie(COOKIE_NAME, result.data.token, getCookieOptions());

    return res
      .status(200)
      .json({ ...result, data: { admin: result.data.admin } });
  };

  forgotPassword = async (req: Request, res: Response) => {
    const { email } = this.data.verifyEmail(req.body);
    const result = await this.authServices.forgotPassword(email, getBaseUrl());

    return res
      .status(200)
      .json({
        message: "Se o email existir, você receberá um link de recuperação",
      });
  };

  resetPassword = async (req: Request, res: Response) => {
    const parsed = this.data.verifyResetPassword(req.body);
    const result = await this.authServices.resetPassword(
      parsed.token,
      parsed.password,
    );

    return res.status(200).json({ message: "Senha redefinida com sucesso" });
  };

  logout = async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return res.redirect("/login");
  };
}
