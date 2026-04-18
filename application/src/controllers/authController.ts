import { VerifyData } from "@utils/zod";
import { Request, Response } from "express";

export class AuthController {
  private readonly data: VerifyData;

  constructor() {
    this.data = new VerifyData();
  }

  authLogin = async (request: Request, response: Response) => {
    const parsedAdmin = this.data.verifyAuthRequest(request.body);
    const admin = await this.authServices.login(parsedAdmin);

    return response.status(200).send(admin);
  };
}
