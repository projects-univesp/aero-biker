import { AdminDTO } from "@dtos/admin";
import { Admin } from "@models/admin";
import { compareHashPasswords } from "@utils/encrypt";
import { env } from "@utils/env";
import { logger } from "@utils/logger";
import { responseFormat } from "@utils/responseFormat";
import jwt from "jsonwebtoken";


export class AuthServices {
  
  emailLogin = async (admin: Partial<AdminDTO>) => {
    const existsAdmin = await Admin.findOne({
      where: { email: admin.email },
    });

    if (existsAdmin === null)
      throw logger.error("Email incorrect, please try again", 401);

    const passwordMatch = await compareHashPasswords(
      admin.password!,
      existsAdmin.password,
    );

    if (!passwordMatch)
      throw logger.error("Email or password incorrect, please try again", 401);

    const token = jwt.sign(
      {
        sub: existsAdmin.id,
        id: existsAdmin.id,
        email: existsAdmin.email,
        name: existsAdmin.name,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" },
    );

    const payload = {
      admin: {
        id: existsAdmin.id,
        name: existsAdmin.name,
        email: existsAdmin.email,
      },
      token,
    };

    return responseFormat({
      data: payload,
      message: "Admin retrivied succesfully",
      statusCode: 200,
    });
  };
}
