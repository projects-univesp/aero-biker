import type { NextFunction, Request, Response } from "express";
import { env } from "@utils/env";

export const renderApi = (
  apiPath: string | ((req: Request) => string),
  viewPath: string,
  dataKey: string,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resolvedPath =
        typeof apiPath === "function" ? apiPath(req) : apiPath;
      const url = `http://localhost:${env.PORT}${resolvedPath}`;

      const apiResponse = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie ?? "",
        },
      });

      if (!apiResponse.ok) {
        const err = new Error(
          `Erro na API (${apiResponse.status}) ao buscar ${resolvedPath}`,
        );
        (err as Error & { statusCode: number }).statusCode = apiResponse.status;
        throw err;
      }

      const result = await apiResponse.json();

      return res.render(viewPath, { [dataKey]: result.data });
    } catch (error) {
      return next(error);
    }
  };
};
