import { AuthServices } from "@services/authServices";
import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class AuthController {
  private readonly data: VerifyData;
  private readonly authServices: AuthServices;

  constructor() {
    this.data = new VerifyData();
    this.authServices = new AuthServices();
  }

  emailLogin = async (request: Request, response: Response) => {
    const parsedAdmin = this.data.verifyAuthRequest(request.body);
    const admin = await this.authServices.emailLogin(parsedAdmin);

    return response.status(200).send(admin);
  };
}
