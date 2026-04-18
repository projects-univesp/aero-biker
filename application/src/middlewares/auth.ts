import { AuthDTO } from "@dtos/auth";
import { env } from "@utils/env";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: AuthDTO;
    }
  }
}

export const auth = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    new Error("Token not provided"), request, response, next);
    return;
  }

  const tokenWithoutBearer = authHeader.split(" ")[1];

  jwt.verify(tokenWithoutBearer, env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      new Error("Invalid token "), request, response, next);
      return;
    }

    request.user = decoded as AuthDTO;
    next();
  });
};