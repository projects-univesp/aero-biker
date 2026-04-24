import { IToken } from "@dtos/auth";
import { env } from "@utils/env";
import { responseFormat } from "@utils/responseFormat";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: IToken;
    }
  }
}

export const auth = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const authHeader = request.headers.authorization;

  const data = { request, response, next };
  if (!authHeader) {
    responseFormat({
      message: "Token not provided",
      statusCode: 401,
      ...data,
    });
    return;
  }

  const tokenWithoutBearer = authHeader.split(" ")[1];

  jwt.verify(tokenWithoutBearer, env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      responseFormat({
        message: "Invalid token",
        statusCode: 401,
        ...data,
      });
      return;
    }
    request.user = decoded as IToken;
    next();
  });
};
