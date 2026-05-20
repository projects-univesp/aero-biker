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

function extractToken(request: Request): string | undefined {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .find((c) => c.trim().startsWith("aero_session="));
    if (match) {
      return decodeURIComponent(match.trim().substring("aero_session=".length));
    }
  }

  return undefined;
}

export const auth = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const token = extractToken(request);

  if (!token) {
    response
      .status(401)
      .json(responseFormat({ message: "Token not provided", statusCode: 401 }));
    return;
  }

  jwt.verify(token, env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      response
        .status(401)
        .json(responseFormat({ message: "Invalid token", statusCode: 401 }));
      return;
    }
    request.user = decoded as IToken;
    next();
  });
};
